/**
 * 入场限流：向入场券服务（经 nginx 暴露在 `api/`，即线上 /game/api/）申请会话票据，
 * 保证网页版最大同时在线人数（服务端 MAX_SLOTS 控制，当前 3）。
 *
 * 语义：
 * - 每个标签页一个名额（cid 按 sessionStorage 区分）；
 * - 领票成功后每 20s 心跳续租；关闭/刷新页面时 sendBeacon 立即释放，
 *   异常关闭（崩溃/断网）由服务端 120s 租约超时自动释放；
 * - 满员时 enter() 每 5s 重试排队，直到拿到空位；
 * - 入场券服务不可达时放行（fail-open）：限流是保护措施，不应在服务故障时把游戏锁死。
 */

export interface GateSnapshot {
  online: number;
  max: number;
}

const HEARTBEAT_MS = 20_000;
const RETRY_MS = 5_000;

declare global {
  interface Window {
    BootLoader?: {
      phase(text: string): void;
      progress(p: number): void;
      done(): void;
    };
  }
}

interface AcquireResponse {
  ok: boolean;
  token?: string;
  online?: number;
  max?: number;
  reason?: string;
}

function clientId(): string {
  try {
    let cid = sessionStorage.getItem('asoul-cid');
    if (!cid) {
      cid = `cid-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      sessionStorage.setItem('asoul-cid', cid);
    }
    return cid;
  } catch {
    return 'cid-anon';
  }
}

async function callApi(path: string, params: Record<string, string>): Promise<AcquireResponse> {
  const query = new URLSearchParams(params).toString();
  const resp = await fetch(`api/${path}?${query}`, { cache: 'no-store' });
  // 429（满员）与 404（票据过期）都带 JSON 说明，属正常分支
  if (!resp.ok && resp.status !== 429 && resp.status !== 404) {
    throw new Error(`gate http ${resp.status}`);
  }
  return (await resp.json()) as AcquireResponse;
}

export class AdmissionGate {
  private static token: string | null = null;
  private static heartbeatTimer: number | null = null;

  /** 领票（必要时排队等待），成功返回 token；服务不可达时返回 null（放行）。 */
  static async enter(onPhase: (text: string) => void): Promise<string | null> {
    let waited = false;
    for (;;) {
      let data: AcquireResponse;
      try {
        data = await callApi('acquire', { cid: clientId() });
      } catch (error) {
        console.warn('[gate] 入场券服务不可达，放行进入：', error);
        onPhase('限流服务不可用，直接进入');
        return null;
      }
      if (data.ok && data.token) {
        this.token = data.token;
        onPhase(`领票成功，当前在线 ${data.online}/${data.max}`);
        this.startHeartbeat();
        this.bindRelease();
        return this.token;
      }
      const occupancy = `${data.online ?? '?'}/${data.max ?? '?'}`;
      onPhase(waited
        ? `服务器满员（${occupancy}），排队等待空位…`
        : `当前在线 ${occupancy} 人已满，排队等待空位…`);
      waited = true;
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }

  private static startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => void this.beat(), HEARTBEAT_MS);
  }

  private static stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private static async beat(): Promise<void> {
    if (!this.token) return;
    const token = this.token;
    try {
      const data = await callApi('heartbeat', { token });
      if (data.ok) return;
      console.warn('[gate] 票据已过期，重新领票');
      this.token = null;
      this.stopHeartbeat();
      await this.enter(() => { /* 游戏已在运行，静默重新领票 */ });
    } catch {
      // 网络抖动：保留 token，下个周期再试；服务恢复前服务端租约最多 120s
    }
  }

  private static bindRelease(): void {
    const release = (): void => {
      if (!this.token) return;
      this.stopHeartbeat();
      // sendBeacon 在页面卸载时仍能把请求发出去（POST）
      navigator.sendBeacon(`api/release?token=${encodeURIComponent(this.token)}`);
      this.token = null;
    };
    window.addEventListener('pagehide', release);
    window.addEventListener('beforeunload', release);
  }
}

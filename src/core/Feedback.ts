import { clientId } from './AdmissionGate';

/**
 * 玩家意见反馈上报。
 *
 * 目标端点是后端服务的 `api/feedback`：开发时由 Vite 代理到 127.0.0.1:8793，
 * 线上由 nginx 反代 /game/api/ 到同一服务，最终追加写入服务器上的 JSONL 文件。
 *
 * 语义：
 * - 服务器收下 → 返回 ok；
 * - 服务器暂时不可达（离线、Electron 桌面版走 file://、服务重启中）→ 把这条反馈
 *   留在 localStorage，下次打开反馈页自动补交，玩家写的内容不会白丢；
 * - 服务器明确拒绝（内容为空、超长、被限频）→ 不存本地，直接把原因告诉玩家。
 */

export const FEEDBACK_MAX_CONTENT = 500;
export const FEEDBACK_MAX_CONTACT = 80;

const PENDING_KEY = 'asoul-feedback-pending-v1';
const PENDING_LIMIT = 20;

export interface FeedbackDraft {
  content: string;
  contact?: string;
}

export interface FeedbackRecord extends FeedbackDraft {
  id: string;
  ts: number;
}

export interface SubmitResult {
  /** 服务器已收下 */
  ok: boolean;
  /** 已存入本地待补交队列 */
  queued: boolean;
  id: string;
  message: string;
}

/** 服务器返回了明确的拒绝原因（不适合自动重试）。 */
class FeedbackRejected extends Error {}

function newId(): string {
  return `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function trim(value: string, limit: number): string {
  return value.replace(/\s+$/, '').trim().slice(0, limit);
}

function readPending(): FeedbackRecord[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FeedbackRecord =>
      !!item && typeof (item as FeedbackRecord).content === 'string' && typeof (item as FeedbackRecord).id === 'string');
  } catch {
    return [];
  }
}

function writePending(records: FeedbackRecord[]): void {
  try {
    if (records.length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(records.slice(-PENDING_LIMIT)));
  } catch {
    // 隐私模式等场景写不进去：忽略，不影响在线提交路径。
  }
}

async function post(record: FeedbackRecord): Promise<void> {
  let resp: Response;
  try {
    resp = await fetch('api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: record.id, content: record.content, contact: record.contact ?? '', cid: clientId() }),
      cache: 'no-store',
    });
  } catch {
    // 网络层失败：可能只是断网或服务重启，值得补交。
    throw new Error('网络不可达');
  }
  let data: { ok?: boolean; message?: string } = {};
  try {
    data = (await resp.json()) as { ok?: boolean; message?: string };
  } catch {
    // 非 JSON 响应（例如反代返回的 HTML 错误页）走下面的状态码分支。
  }
  if (resp.ok && data.ok !== false) return;
  // 4xx 是内容本身有问题，重试也不会成功；5xx 及网关类错误留给补交队列。
  if (resp.status >= 400 && resp.status < 500) {
    throw new FeedbackRejected(data.message ?? `服务器拒绝了这条反馈（${resp.status}）`);
  }
  throw new Error(data.message ?? `服务器暂时异常（${resp.status}）`);
}

/** 提交一条反馈。无论成功与否都不会抛异常，结果由返回值表达。 */
export async function submitFeedback(draft: FeedbackDraft): Promise<SubmitResult> {
  const record: FeedbackRecord = {
    id: newId(),
    ts: Date.now(),
    content: trim(draft.content, FEEDBACK_MAX_CONTENT),
    contact: trim(draft.contact ?? '', FEEDBACK_MAX_CONTACT),
  };
  try {
    await post(record);
    return { ok: true, queued: false, id: record.id, message: '提交成功，感谢你的建议！' };
  } catch (error) {
    if (error instanceof FeedbackRejected) {
      return { ok: false, queued: false, id: record.id, message: error.message };
    }
    const detail = error instanceof Error ? error.message : '网络异常';
    writePending([...readPending(), record]);
    return { ok: false, queued: true, id: record.id, message: `${detail}，已先存在本地，下次打开此页会自动补交。` };
  }
}

export function pendingCount(): number {
  return readPending().length;
}

/** 补交本地积压的反馈，返回本次成功送达的条数。 */
export async function flushPending(): Promise<number> {
  const pending = readPending();
  if (pending.length === 0) return 0;
  const rest: FeedbackRecord[] = [];
  let sent = 0;
  for (const record of pending) {
    try {
      await post(record);
      sent += 1;
    } catch {
      rest.push(record);
    }
  }
  writePending(rest);
  return sent;
}

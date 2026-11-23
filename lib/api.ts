import { authClient } from "./auth-client";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: { path: string; message: string }[];

  constructor(
    status: number,
    code: string | undefined,
    message: string,
    details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  token?: string | null;
  body?: unknown;
  formData?: FormData;
  timeoutMs?: number;
}

function errorMessage(status: number, code: string | undefined, fallback: string) {
  if (fallback && fallback !== `HTTP ${status}`) return fallback;
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Please sign in to continue.";
    case 403:
      return code === "ACCOUNT_BLOCKED"
        ? "Your account has been blocked. Please contact support."
        : code === "UPGRADE_REQUIRED"
          ? "This action needs a Premium plan."
          : "You are not allowed to do that.";
    case 404:
      return "Not found. It may have been removed.";
    case 409:
      return code === "DUPLICATE"
        ? "You already requested this service for that date."
        : code === "ALREADY_PROCESSED"
          ? "This request was already handled. Refresh to see the latest status."
          : code === "ALREADY_SELECTED"
            ? "Role already selected."
            : "This action was already completed.";
    case 422:
      return "Please fix the highlighted fields.";
    case 429:
      return "Too many requests. Please wait a moment and retry.";
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, body, formData, headers, timeoutMs = 15_000, signal, ...init } = options;
  const timeout = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout
    ? AbortSignal.timeout(timeoutMs)
    : undefined;
  const combined = signal
    ? timeout
      ? AbortSignal.any([signal, timeout])
      : signal
    : (timeout ?? undefined);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      signal: combined,
      headers: {
        ...(formData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new ApiError(0, "TIMEOUT", "The server is taking too long. Please check your connection and retry.");
    }
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Please check your connection and retry.");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    const code = json?.code as string | undefined;
    const message = errorMessage(
      res.status,
      code,
      (json?.message as string | undefined) ?? `HTTP ${res.status}`,
    );
    throw new ApiError(res.status, code, message, json?.details);
  }
  return json as T;
}

export const MAX_PAGE_LIMIT = 50;

export function pageQuery(page: number, limit: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    ...extra,
    page: String(Math.max(1, page)),
    limit: String(Math.min(Math.max(1, limit), MAX_PAGE_LIMIT)),
  });
  return params.toString();
}

export async function authed<T = unknown>(
  path: string,
  options: Omit<ApiOptions, "token"> = {},
): Promise<T> {
  const { data } = await authClient.token();
  const token = data?.token ?? null;
  return api<T>(path, { ...options, token });
}

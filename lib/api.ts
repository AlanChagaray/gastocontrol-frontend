export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface ApiError { message: string; status: number; errors?: Record<string,string[]>; }

interface Opts extends Omit<RequestInit,"body"> { body?: unknown; token?: string; }

async function request<T>(endpoint: string, opts: Opts = {}): Promise<T> {
  const { body, token, headers: extra, ...rest } = opts;
  const headers: Record<string,string> = { "Content-Type":"application/json", Accept:"application/json", ...(extra as Record<string,string>) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${endpoint}`, { ...rest, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const b = await res.json().catch(()=>({}));
    throw { message: b?.message ?? res.statusText, status: res.status, errors: b?.errors } as ApiError;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(ep: string, opts?: Opts) => request<T>(ep, { method:"GET",    ...opts }),
  post:   <T>(ep: string, body: unknown, opts?: Opts) => request<T>(ep, { method:"POST",   body, ...opts }),
  put:    <T>(ep: string, body: unknown, opts?: Opts) => request<T>(ep, { method:"PUT",    body, ...opts }),
  patch:  <T>(ep: string, body: unknown, opts?: Opts) => request<T>(ep, { method:"PATCH",  body, ...opts }),
  delete: <T>(ep: string, opts?: Opts) => request<T>(ep, { method:"DELETE", ...opts }),
};

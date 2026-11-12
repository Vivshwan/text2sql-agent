import type { SessionMeta, AskResponse } from "./types";

const API_BASE = "https://text2sql-agent-8pia.onrender.com";

const j = async (r: Response) => {
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({}));
    throw new Error(errorData.detail ?? r.statusText);
  }
  return r.json();
};

export async function createDemoSession(): Promise<SessionMeta> {
  return j(await fetch(`${API_BASE}/api/sessions/demo`, { method: "POST" }));
}

export async function createCsvSession(file: File): Promise<SessionMeta> {
  const fd = new FormData();
  fd.append("file", file);
  return j(await fetch(`${API_BASE}/api/sessions`, { method: "POST", body: fd }));
}

export async function ask(session_id: string, question: string, clarification?: string): Promise<AskResponse> {
  return j(await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, question, clarification }),
  }));
}
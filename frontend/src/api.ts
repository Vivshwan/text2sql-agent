import type { SessionMeta, AskResponse } from "./types";

// Hardcoded production backend URL
const API_BASE = import.meta.env.VITE_API_URL || "";

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const j = async (r: Response) => {
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({}));
    throw new Error(errorData.detail ?? r.statusText);
  }
  return r.json();
};

export async function createDemoSession(): Promise<SessionMeta> {
  return j(
    await fetch(`${API_BASE}/api/sessions/demo`, { 
      method: "POST",
      headers: { ...getAuthHeaders() }
    })
  );
}

export async function createCsvSession(file: File): Promise<SessionMeta> {
  const fd = new FormData();
  fd.append("file", file);
  return j(
    await fetch(`${API_BASE}/api/sessions`, { 
      method: "POST", 
      headers: { ...getAuthHeaders() },
      body: fd 
    })
  );
}

export async function ask(session_id: string, question: string, clarification?: string): Promise<AskResponse> {
  return j(
    await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ session_id, question, clarification }),
    })
  );
}
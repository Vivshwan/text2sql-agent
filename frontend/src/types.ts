export interface SessionMeta {
  id: string; source: string; table?: string; row_count?: number;
  columns: string[]; schema_text: string; date_columns: string[];
  cleanup_report?: string[];
}
export interface AskResponse {
  status: "ok" | "needs_clarification" | "error";
  answer?: string; sql?: string; columns: string[]; rows: (string | number | null)[][];
  chart?: string | null; clarification_question?: string; error?: string;
}
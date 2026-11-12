import { useState, useRef, useEffect } from "react";
import type { AskResponse, SessionMeta } from "./types";
import { ask, createDemoSession, createCsvSession } from "./api";
import { DataTable } from "./components/DataTable";
import { SqlBlock } from "./components/SqlBlock";
import { Database, UploadCloud, Send, Sparkles, AlertCircle, Bot, User, Trash2, Plus, MessageSquare } from "lucide-react";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string | AskResponse; isClarification?: boolean; };

export default function App() {
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [clarification, setClarification] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function handleDemo() {
    setBusy(true);
    try { setSession(await createDemoSession()); setMessages([]); } catch (e: any) { alert(e.message); }
    setBusy(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setBusy(true);
    try { setSession(await createCsvSession(e.target.files[0])); setMessages([]); } catch (e: any) { alert(e.message); }
    setBusy(false);
  }

  async function handleAsk(e?: React.FormEvent) {
    e?.preventDefault();
    if (!session || !question.trim()) return;
    const userQ = question;
    setQuestion(""); setBusy(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userQ }]);
    
    try {
      const res = await ask(session.id, userQ, clarification || undefined);
      if (res.status === "needs_clarification") setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: res, isClarification: true }]);
      else if (res.status === "error") setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Error: ${res.error}` }]);
      else { setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: res }]); setClarification(""); }
    } catch (e: any) { 
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Network error: ${e.message}` }]); 
    }
    setBusy(false);
  }

  return (
    <div className="flex h-screen bg-[#0f111a] text-gray-200 font-sans overflow-hidden selection:bg-brand-500/30">
      <aside className="w-[260px] bg-[#161926] border-r border-[#1f2335] flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-2"><Database className="w-6 h-6 text-brand-500" /><h1 className="font-semibold text-lg text-white">DataQuery AI</h1></div>
        <div className="px-4 pb-4"><button onClick={() => setMessages([])} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg text-sm font-medium"><Plus size={16} /> New Chat</button></div>
        
        <div className="flex-1 overflow-y-auto px-2">
          <div className="px-2 py-2 text-xs font-semibold text-gray-500">Today</div>
          {messages.length > 0 && <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1f2335] text-sm border border-gray-700/50"><MessageSquare size={14} className="text-brand-500" /><span className="truncate">Active Data Query</span></div>}
        </div>

        <div className="p-3 border-t border-[#1f2335] space-y-3">
          {!session ? (
            <div className="space-y-2">
              <button onClick={handleDemo} className="w-full flex items-center justify-center gap-2 bg-[#2a2f45] hover:bg-[#343a56] py-2 rounded-lg text-xs font-medium"><Database size={14} /> Load Demo DB</button>
              <label className="w-full flex items-center justify-center gap-2 bg-[#2a2f45] hover:bg-[#343a56] py-2 rounded-lg text-xs font-medium cursor-pointer border border-dashed border-gray-600">
                <UploadCloud size={14} /> Upload Data<input type="file" accept=".csv,.db,.sqlite,.sqlite3,.xlsx,.xls" onChange={handleFile} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="bg-[#1f2335] rounded-lg p-3 text-xs border border-gray-700/50 flex justify-between items-center">
              <div className="truncate pr-2"><p className="text-brand-400 font-medium truncate">{session.source}</p><p className="text-gray-500">{session.row_count} rows</p></div>
              <button onClick={() => { setSession(null); setMessages([]); }} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            {messages.length === 0 && (
              <div className="text-center mt-32">
                <div className="inline-flex items-center justify-center p-4 bg-brand-500/10 rounded-2xl mb-6"><Sparkles size={32} className="text-brand-500" /></div>
                <h2 className="text-3xl font-semibold text-white mb-2">How can I help you today?</h2>
                <p className="text-gray-400">Ask anything about your data. I'll write the SQL and visualize it.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-gray-600" : "bg-brand-600"}`}>
                  {msg.role === "user" ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "flex justify-end" : ""}`}>
                  <div className={`rounded-2xl ${msg.role === "user" ? "bg-[#1f2335] text-white px-5 py-3.5" : msg.isClarification ? "bg-[#1f2335] border border-orange-500/30 w-full" : "bg-[#161926] border border-[#1f2335] w-full p-5"}`}>
                    
                    {msg.role === "user" && <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content as string}</p>}
                    {msg.role === "assistant" && typeof msg.content === "string" && <p className="text-red-400 text-sm">{msg.content}</p>}
                    
                    {msg.isClarification && typeof msg.content === "object" && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2 text-sm"><AlertCircle size={16} /> Clarification Needed</div>
                        <p className="text-gray-300 text-sm mb-4">{(msg.content as AskResponse).clarification_question}</p>
                        <div className="flex gap-2">
                          <input type="text" value={clarification} onChange={(e) => setClarification(e.target.value)} placeholder="Type your answer..." className="flex-1 bg-[#0f111a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 text-white" onKeyDown={(e) => e.key === "Enter" && handleAsk()} />
                          <button onClick={() => handleAsk()} className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2 rounded-lg text-sm font-medium">Send</button>
                        </div>
                      </div>
                    )}

                    {!msg.isClarification && msg.role === "assistant" && typeof msg.content === "object" && (msg.content as AskResponse).status === "ok" && (
                      <div className="w-full">
                        <p className="text-gray-200 text-base leading-relaxed mb-4">{(msg.content as AskResponse).answer}</p>
                        <SqlBlock sql={(msg.content as AskResponse).sql!} />
                        {(msg.content as AskResponse).chart && <div className="mt-5 border border-gray-700/50 rounded-xl overflow-hidden bg-white p-2"><img src={(msg.content as AskResponse).chart!} alt="Chart" className="w-full h-auto rounded" /></div>}
                        {(msg.content as AskResponse).rows && (msg.content as AskResponse).rows.length > 0 && <DataTable columns={(msg.content as AskResponse).columns} rows={(msg.content as AskResponse).rows} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0"><Bot size={16} className="text-white" /></div>
                <div className="flex items-center gap-1.5 h-8"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 pb-6 bg-gradient-to-t from-[#0f111a] to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleAsk} className="relative flex items-center bg-[#1f2335] border border-gray-600 rounded-2xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all p-2 shadow-lg">
              <label className="cursor-pointer p-3 text-gray-400 hover:text-white transition-colors">
                <UploadCloud size={20} />
                <input type="file" accept=".csv,.db,.sqlite,.sqlite3,.xlsx,.xls" onChange={handleFile} className="hidden" disabled={busy} />
              </label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }} placeholder={session ? "Message DataQuery AI..." : "Upload or connect a database first..."} disabled={!session || busy} className="w-full bg-transparent border-none text-gray-100 placeholder-gray-500 px-2 py-3 resize-none outline-none max-h-32 text-sm" rows={1} style={{ height: 'auto', minHeight: '44px' }} />
              <button type="submit" disabled={!session || busy || !question.trim()} className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:bg-gray-600 m-1"><Send size={18} /></button>
            </form>
            <p className="text-center text-[11px] text-gray-500 mt-2">DataQuery AI can make mistakes. Always verify the SQL.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
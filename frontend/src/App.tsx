import { useState, useRef, useEffect } from "react";
import type { AskResponse, SessionMeta } from "./types";
import { ask, createDemoSession, createCsvSession } from "./api";
import { DataTable } from "./components/DataTable";
import { SqlBlock } from "./components/SqlBlock";
import { AuthScreen } from "./components/AuthScreen";
import { useAuth } from "./AuthContext";
import { 
  Database, UploadCloud, Send, Sparkles, AlertCircle, 
  Bot, User, Trash2, Menu, LogOut 
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string | AskResponse;
  isClarification?: boolean;
};

export default function App() {
  const { user, logout } = useAuth();
  
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [clarification, setClarification] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // If no user is logged in, show the Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  async function handleDemo() {
    setBusy(true);
    try { 
      setSession(await createDemoSession()); 
      setMessages([]); 
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setBusy(true);
    try { 
      setSession(await createCsvSession(e.target.files[0])); 
      setMessages([]); 
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  }

  async function handleAsk(e?: React.FormEvent) {
    e?.preventDefault();
    if (!session || !question.trim()) return;

    const userQ = question;
    setQuestion("");
    setBusy(true);

    // Add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userQ }]);

    try {
      const res = await ask(session.id, userQ, clarification || undefined);
      
      if (res.status === "needs_clarification") {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: "assistant", 
          content: res, 
          isClarification: true 
        }]);
      } else if (res.status === "error") {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: "assistant", 
          content: `Error: ${res.error}` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: "assistant", 
          content: res 
        }]);
        setClarification(""); // clear clarification after success
      }
    } catch (e: any) { 
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Network error: ${e.message}` }]);
    }
    setBusy(false);
  }

  return (
    <div className="flex h-screen bg-surface-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-80" : "w-0"} bg-surface-800 border-r border-gray-700/50 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b border-gray-700/50 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-brand-500/20 rounded-lg">
            <Database className="w-6 h-6 text-brand-500" />
          </div>
          <h1 className="font-bold text-xl text-white">DataQuery AI</h1>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Connect Data</h2>
            <button 
              onClick={handleDemo} 
              disabled={busy}
              className="w-full flex items-center gap-3 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-4 rounded-xl transition-all mb-3 disabled:opacity-50"
            >
              <Sparkles size={18} /> Load Demo DB
            </button>
            <label className="w-full flex items-center justify-center gap-3 bg-surface-700 hover:bg-surface-600 border border-gray-600 cursor-pointer text-gray-200 font-medium py-3 px-4 rounded-xl transition-all">
              <UploadCloud size={18} /> Upload File
              <input type="file" accept=".csv,.db,.sqlite,.sqlite3,.xlsx,.xls" onChange={handleFile} disabled={busy} className="hidden" />
            </label>
          </div>

          {session && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Session</h2>
              <div className="bg-surface-900 border border-gray-700/50 p-4 rounded-xl">
                <p className="text-sm text-brand-500 font-medium truncate" title={session.source}>{session.source}</p>
                <p className="text-xs text-gray-400 mt-1">{session.row_count ? `${session.row_count} rows` : 'Connected'}</p>
                <button 
                  onClick={() => { setSession(null); setMessages([]); setQuestion(""); setClarification(""); }} 
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  <Trash2 size={14} /> Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-700/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors shrink-0" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Mobile Toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-4 left-4 z-20 p-2 bg-surface-800 rounded-lg text-gray-400 hover:text-white md:hidden">
          <Menu size={20} />
        </button>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            
            {!session && (
              <div className="text-center mt-32 animate-fade-in-up">
                <div className="inline-flex items-center justify-center p-6 bg-surface-800 rounded-full shadow-glow mb-6">
                  <Bot size={48} className="text-brand-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">How can I help you today?</h2>
                <p className="text-gray-400 text-lg">Connect a database on the left to start asking questions.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-gray-700" : "bg-brand-500/20"}`}>
                  {msg.role === "user" ? <User size={20} className="text-gray-300" /> : <Bot size={20} className="text-brand-500" />}
                </div>

                {/* Message Bubble */}
                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "flex justify-end" : ""}`}>
                  <div className={`rounded-2xl p-5 ${
                    msg.role === "user" ? "bg-surface-700 text-white" : 
                    msg.isClarification ? "bg-orange-500/10 border border-orange-500/30" : 
                    "bg-surface-800 border border-gray-700/50"
                  }`}>
                    
                    {/* User Text */}
                    {msg.role === "user" && <p className="whitespace-pre-wrap">{msg.content as string}</p>}
                    
                    {/* Assistant Text/Error */}
                    {msg.role === "assistant" && typeof msg.content === "string" && (
                      <p className="text-red-400">{msg.content}</p>
                    )}

                    {/* Assistant Clarification */}
                    {msg.isClarification && typeof msg.content === "object" && (
                      <div>
                        <div className="flex items-center gap-2 text-orange-400 font-bold mb-2">
                          <AlertCircle size={18} /> Clarification Needed
                        </div>
                        <p className="text-gray-200 mb-4">{(msg.content as AskResponse).clarification_question}</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={clarification} 
                            onChange={(e) => setClarification(e.target.value)} 
                            placeholder="Type your answer..."
                            className="flex-1 bg-surface-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 text-white"
                            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                          />
                          <button onClick={() => handleAsk()} className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-lg text-sm font-bold">Send</button>
                        </div>
                      </div>
                    )}

                    {/* Assistant OK Response */}
                    {!msg.isClarification && msg.role === "assistant" && typeof msg.content === "object" && (msg.content as AskResponse).status === "ok" && (
                      <div className="w-full">
                        <p className="text-gray-100 text-lg mb-4 leading-relaxed">{(msg.content as AskResponse).answer}</p>
                        
                        <SqlBlock sql={(msg.content as AskResponse).sql!} />
                        
                        {(msg.content as AskResponse).chart && (
                          <div className="mt-6 border border-gray-700/50 rounded-xl overflow-hidden bg-white p-2">
                            <img src={(msg.content as AskResponse).chart!} alt="Chart" className="w-full h-auto rounded" />
                          </div>
                        )}

                        {(msg.content as AskResponse).rows && (msg.content as AskResponse).rows.length > 0 && (
                          <DataTable 
                            columns={(msg.content as AskResponse).columns} 
                            rows={(msg.content as AskResponse).rows} 
                            question={question || "data"} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {busy && (
              <div className="flex gap-4 animate-fade-in-up">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                  <Bot size={20} className="text-brand-500" />
                </div>
                <div className="bg-surface-800 border border-gray-700/50 rounded-2xl p-5 flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface-800 border-t border-gray-700/50 shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleAsk} className="relative flex items-end bg-surface-900 border border-gray-700 rounded-2xl overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all p-2 shadow-lg">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder={session ? "Ask a question about your data..." : "Connect a database first..."}
                disabled={!session || busy}
                className="w-full bg-transparent border-none text-gray-100 placeholder-gray-500 px-3 py-3 resize-none outline-none max-h-32"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!session || busy || !question.trim()}
                className="mb-1 mr-1 p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
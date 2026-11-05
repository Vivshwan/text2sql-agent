import { useState } from "react";
import { useAuth } from "../AuthContext";
import { Database, Mail, Lock, User, Loader2 } from "lucide-react";

// Hardcoded production backend URL
const API_BASE = import.meta.env.VITE_API_URL || "";

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    const url = isLogin ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/signup`;
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Handle non-JSON responses (like HTML error pages)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend server is starting up. Please wait 30 seconds and try again.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");

      if (isLogin) {
        login(data.access_token, { name: data.name, email });
      } else {
        // Auto-login after signup
        setIsLogin(true);
        setError("Account created! Please log in.");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-800 p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-500/20 rounded-2xl mb-4">
            <Database className="w-8 h-8 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLogin ? "Sign in to access DataQuery AI" : "Start analyzing your data in seconds"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-900 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-900 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-900 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-all mt-6 flex items-center justify-center"
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-brand-500 hover:text-brand-400 font-semibold"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}
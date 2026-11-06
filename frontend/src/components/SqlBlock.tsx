import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code2, ChevronDown, ChevronUp } from "lucide-react";

export function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border border-gray-700/50 rounded-lg overflow-hidden bg-surface-900">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-surface-800 hover:bg-surface-700 transition-colors text-sm font-medium text-gray-300">
        <div className="flex items-center gap-2"><Code2 size={16} className="text-brand-500" /> Generated SQL</div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="text-sm"><SyntaxHighlighter language="sql" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}>{sql}</SyntaxHighlighter></div>}
    </div>
  );
}
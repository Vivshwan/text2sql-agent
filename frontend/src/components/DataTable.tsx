import { Download } from "lucide-react";

export function DataTable({ columns, rows }: { columns: string[]; rows: any[][] }) {
  if (!columns.length) return null;

  const downloadCSV = () => {
    const headerRow = columns.map(c => `"${c}"`).join(",");
    const dataRows = rows.map((row) => row.map((cell) => cell === null ? '""' : `"${String(cell).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headerRow, ...dataRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", `query_results.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="mt-6 border border-gray-700/50 rounded-xl overflow-hidden bg-surface-900">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-800 border-b border-gray-700/50">
        <span className="text-sm text-gray-300">{rows.length} rows</span>
        <button onClick={downloadCSV} className="flex items-center gap-2 text-xs font-semibold text-brand-500 hover:text-white bg-brand-500/10 hover:bg-brand-600 px-3 py-1.5 rounded transition-all"><Download size={14} /> Export CSV</button>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-surface-900 text-gray-400 sticky top-0 border-b border-gray-700/50">
            <tr>{columns.map((c, i) => <th key={i} className="px-6 py-3">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-800/50">
                {row.map((cell, j) => <td key={j} className="px-6 py-2 whitespace-nowrap">{cell === null ? <span className="text-gray-600 italic">null</span> : String(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
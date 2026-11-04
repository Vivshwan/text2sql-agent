import { Download } from "lucide-react";

export function DataTable({ 
  columns, 
  rows, 
  question 
}: { 
  columns: string[]; 
  rows: any[][]; 
  question?: string;
}) {
  if (!columns.length) return null;

  const downloadCSV = () => {
    // 1. Create CSV headers
    const headerRow = columns.map(c => `"${c}"`).join(",");
    
    // 2. Format rows
    const dataRows = rows.map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const str = String(cell);
          return `"${str.replace(/"/g, '""')}"`; 
        })
        .join(",")
    );

    // 3. Combine
    const csvContent = [headerRow, ...dataRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 4. Keyword Extraction Logic
    let fileName = "query_results";
    if (question) {
      // List of common words to ignore
      const stopWords = new Set([
        "what", "were", "was", "the", "are", "is", "by", "in", "of", "to", "for", 
        "and", "a", "an", "on", "at", "with", "from", "how", "many", "much", "does", 
        "do", "did", "show", "me", "list", "all", "which", "who", "where", "when", 
        "please", "give", "tell", "can", "you", "i", "we", "they", "it", "this", "that"
      ]);

      // Split into words, lowercase, remove punctuation, filter stopwords, and take top 4 keywords
      const keywords = question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "") // remove punctuation
        .split(/\s+/)                // split by spaces
        .filter(word => word.length > 2 && !stopWords.has(word)) // remove stop words
        .slice(0, 4)                 // take first 4 keywords for brevity
        .join("_");                  // join with underscores

      if (keywords.length > 0) {
        fileName = `${keywords}_results`;
      }
    }

    // 5. Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
  };

  return (
    <div className="mt-6 border border-gray-700/50 rounded-xl overflow-hidden bg-surface-900">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-800 border-b border-gray-700/50">
        <span className="text-sm font-medium text-gray-300">
          {rows.length} {rows.length === 1 ? "row" : "rows"} returned
        </span>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 text-xs font-semibold text-brand-500 hover:text-white bg-brand-500/10 hover:bg-brand-600 px-3 py-1.5 rounded transition-all"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-surface-900 text-gray-400 sticky top-0 border-b border-gray-700/50 shadow-sm">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className="px-6 py-3 font-semibold tracking-wider whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-800/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-2 whitespace-nowrap border-r border-gray-800/50 last:border-0">
                    {cell === null ? (
                      <span className="text-gray-600 italic">null</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
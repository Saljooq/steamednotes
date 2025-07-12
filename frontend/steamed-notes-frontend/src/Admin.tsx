import React, { useState } from "react";

interface QueryResult {
  columns: string[];
  rows: any[][];
  error?: string;
}

const AdminPage: React.FC = () => {
  const [query, setQuery] = useState<string>("SELECT * FROM notes");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  const executeQuery = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute query");
      }
      const data: QueryResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ columns: [], rows: [], error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Admin - Run SQL Queries</h1>
      <div className="mb-4">
        <label
          htmlFor="sqlQuery"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Enter SQL Query (SELECT only):
        </label>
        <textarea
          id="sqlQuery"
          value={query}
          onChange={handleQueryChange}
          className="mt-1 p-2 border rounded w-full h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., SELECT * FROM notes"
        />
      </div>
      <button
        onClick={executeQuery}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300 hover:bg-blue-600 transition-colors"
      >
        {isLoading ? "Executing..." : "Execute Query"}
      </button>
      {result && (
        <div className="mt-4">
          {result.error ? (
            <p className="text-red-500 font-medium">{result.error}</p>
          ) : result.columns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 bg-white">
                <thead>
                  <tr>
                    {result.columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-300 p-2 bg-gray-200 text-gray-700 font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="border border-gray-300 p-2">
                          {cell === null ? "NULL" : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No results returned.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
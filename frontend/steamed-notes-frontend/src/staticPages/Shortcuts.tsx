import React from 'react';

const Shortcuts: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-4">Keyboard Shortcuts</h1>
        <p className="text-center text-gray-600 mb-8">Use these shortcuts to navigate and manage your notes efficiently.</p>
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">Current Shortcuts</h2>
            <table className="w-full mt-4 border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Shortcut</th>
                  <th className="text-left py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2"><kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + S</kbd></td>
                  <td className="py-2">Save the current note</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + Up</kbd></td>
                  <td className="py-2">Navigate to the previous note in the folder</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + Down</kbd></td>
                  <td className="py-2">Navigate to the next note in the folder</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">TODO: Future Shortcuts</h2>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>Add shortcut for creating a new note (e.g., <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + N</kbd>)</li>
              <li>Add shortcut for deleting a note (e.g., <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + D</kbd>)</li>
              <li>Add shortcut for switching between folders (e.g., <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + Tab</kbd>)</li>
              <li>Add shortcut for searching notes (e.g., <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + F</kbd>)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shortcuts;
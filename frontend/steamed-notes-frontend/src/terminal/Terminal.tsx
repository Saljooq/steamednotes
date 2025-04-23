import React, { useState, useEffect, useRef } from 'react';

// Interfaces for type safety
interface HistoryEntry {
  prompt?: string;
  input?: string;
  command?: string;
  output?: string;
}

interface FileEntry {
  name: string;
  content: string;
}

interface VimEditorProps {
  fileName: string;
  initialContent: string;
  onSave: (fileName: string, content: string) => void;
  onQuit: () => void;
}

// VimEditor Component
const VimEditor: React.FC<VimEditorProps> = ({ fileName, initialContent, onSave, onQuit }) => {
  const [content, setContent] = useState<string>(initialContent || '');
  const [command, setCommand] = useState<string>('');
  const [mode, setMode] = useState<'normal' | 'command'>('normal');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'normal') {
      if (e.key === ':') {
        setMode('command');
        setCommand(':');
        e.preventDefault();
      }
    } else if (mode === 'command') {
      if (e.key === 'Enter') {
        processCommand();
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        setCommand(command.slice(0, -1));
      } else if (e.key.length === 1) {
        setCommand(command + e.key);
      }
      e.preventDefault();
    }
  };

  const processCommand = () => {
    if (command === ':w') {
      onSave(fileName, content);
      setCommand('');
      setMode('normal');
    } else if (command === ':q') {
      onQuit();
    } else if (command === ':wq') {
      onSave(fileName, content);
      onQuit();
    } else {
      setCommand('');
      setMode('normal');
    }
  };

  return (
    <div className="h-screen w-full bg-black p-6 font-mono text-green-400 flex flex-col">
      <div className="flex-1 bg-black">
        <div className="text-green-600 mb-2">{fileName || 'Untitled'}</div>
        {mode === 'normal' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[calc(100%-2rem)] bg-black text-green-400 outline-none resize-none font-mono"
            onKeyDown={handleKeyDown}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            placeholder="Start typing... (Press : for commands)"
          />
        ) : (
          <div className="flex">
            <span className="text-green-600 mr-2">:</span>
            <input
              type="text"
              value={command}
              onKeyDown={handleKeyDown}
              className="bg-black outline-none flex-1 text-green-400 caret-green-400 font-mono"
              ref={inputRef as React.RefObject<HTMLInputElement>}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};

// TerminalLogin Component
const TerminalLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeField, setActiveField] = useState<'email' | 'password'>('email');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const introText = [
    'Welcome to GrokOS 1.0.0',
    'GrokOS - Powered by xAI',
    'Type your credentials to log in.',
    ''
  ];

  useEffect(() => {
    setHistory(introText.map(line => ({ output: line })));
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, field: 'email' | 'password') => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      if (field === 'email') {
        setHistory([...history, { prompt: 'Email: ', input: e.currentTarget.value }]);
        setActiveField('password');
        passwordRef.current?.focus();
      } else if (field === 'password') {
        setHistory([...history, { prompt: 'Password: ', input: '••••••••' }]);
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    const validEmail = 'user@example.com';
    const validPassword = 'password123';

    if (email === validEmail && password === validPassword) {
      setIsLoggedIn(true);
      setHistory([]);
    } else {
      setHistory([
        ...history,
        { prompt: 'Email: ', input: email },
        { prompt: 'Password: ', input: '••••••••' },
        { output: 'Login failed: Invalid email or password' }
      ]);
      setError('Invalid email or password');
      setEmail('');
      setPassword('');
      setActiveField('email');
      emailRef.current?.focus();
    }
  };

  if (isLoggedIn) {
    return <TerminalInterface />;
  }

  return (
    <div className="h-screen w-full bg-black p-6 font-mono text-green-400 flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {history.map((entry, index) => (
          <div key={index}>
            {entry.prompt && (
              <div className="flex">
                <span className="text-green-600 mr-2">{entry.prompt}</span>
                <span>{entry.input}</span>
              </div>
            )}
            {entry.output && <div className="ml-6">{entry.output}</div>}
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <span className="text-green-600 mr-2">
          {activeField === 'email' ? 'Email: ' : 'Password: '}
        </span>
        {activeField === 'email' ? (
          <input
            type="text"
            value={email}
            onChange={handleEmailChange}
            onKeyPress={(e) => handleKeyPress(e, 'email')}
            ref={emailRef}
            className="bg-black outline-none flex-1 text-green-400 caret-green-400"
            autoFocus
          />
        ) : (
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onKeyPress={(e) => handleKeyPress(e, 'password')}
            ref={passwordRef}
            className="bg-black outline-none flex-1 text-green-400 caret-green-400"
            autoFocus
          />
        )}
      </div>
      {error && <div className="mt-2 text-red-400">{error}</div>}
    </div>
  );
};

// TerminalInterface Component
const TerminalInterface: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [editingFile, setEditingFile] = useState<{ name: string; content: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      setHistory([...history, { command: input, output: processCommand(input) }]);
      setCommandHistory([input, ...commandHistory]);
      setInput('');
      setHistoryIndex(-1);
      inputRef.current?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(newIndex === -1 ? '' : commandHistory[newIndex]);
      }
    }
  };

  const processCommand = (cmd: string): string => {
    const [command, ...args] = cmd.trim().split(/\s+/);
    switch (command.toLowerCase()) {
      case 'help':
        return 'Available commands: help, clear, whoami, logout, ls, cat, vim';
      case 'clear':
        setHistory([]);
        return '';
      case 'whoami':
        return 'You are a logged-in user!';
      case 'logout':
        window.location.reload();
        return 'Logging out...';
      case 'ls':
        return files.length ? files.map(f => f.name).join(' ') : 'dir empty';
      case 'cat':
        if (args.length !== 1) return 'Usage: cat <filename>';
        const file = files.find(f => f.name === args[0]);
        return file ? file.content : `cat: ${args[0]}: No such file`;
      case 'vim':
        if (args.length !== 1) return 'Usage: vim <filename>';
        const existingFile = files.find(f => f.name === args[0]);
        setEditingFile({ name: args[0], content: existingFile ? existingFile.content : '' });
        return '';
      default:
        return `Command not found: ${command}`;
    }
  };

  const handleVimSave = (fileName: string, content: string) => {
    setFiles(prevFiles => {
      const existingFileIndex = prevFiles.findIndex(f => f.name === fileName);
      if (existingFileIndex >= 0) {
        const newFiles = [...prevFiles];
        newFiles[existingFileIndex] = { name: fileName, content };
        return newFiles;
      }
      return [...prevFiles, { name: fileName, content }];
    });
    setHistory([...history, { output: `File ${fileName} saved` }]);
  };

  const handleVimQuit = () => {
    setEditingFile(null);
    inputRef.current?.focus();
  };

  if (editingFile) {
    return (
      <VimEditor
        fileName={editingFile.name}
        initialContent={editingFile.content}
        onSave={handleVimSave}
        onQuit={handleVimQuit}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-black p-6 font-mono text-green-400 flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4" ref={historyRef}>
        {history.map((entry, index) => (
          <div key={index}>
            {entry.command && (
              <div className="flex">
                <span className="text-green-600 mr-2">$</span>
                <span>{entry.command}</span>
              </div>
            )}
            {entry.output && <div className="ml-6">{entry.output}</div>}
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <span className="text-green-600 mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          className="bg-black outline-none flex-1 text-green-400 caret-green-400"
          autoFocus
        />
      </div>
    </div>
  );
};

// Main Terminal Component
const Terminal: React.FC = () => {
  return <TerminalLogin />;
};

export default Terminal;
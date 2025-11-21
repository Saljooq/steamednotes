import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

type Props = {
  initials?: string
  onLogout: () => void
}

const getInitials = (name: string): string => {
  // Remove extra spaces and split by spaces or special characters
  const parts = name.trim().split(/[\s.@]+/).filter(part => part.length > 0);
  
  // Take first two parts, get first letter of each, and convert to uppercase
  const initials = parts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");
  
  // Return at least one initial, or empty string if no valid parts
  return initials || "";
};

const UserMenu: React.FC<Props> = ({ initials = getInitials(localStorage.getItem("username") || "?"), onLogout }) => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold hover:opacity-90"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-yellow-100 border border-yellow-300 rounded shadow-md z-50">
          <button
            onClick={() => {
              navigate('/sessions', { state: { from: location.pathname } })
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-yellow-200 text-sm border-b border-yellow-200"
          >
            📱 Sessions
          </button>
          <button
            onClick={() => {
              navigate('/change-password', { state: { from: location.pathname } })
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-yellow-200 text-sm border-b border-yellow-200"
          >
            🔐 Change Password
          </button>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 hover:bg-yellow-200 text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu

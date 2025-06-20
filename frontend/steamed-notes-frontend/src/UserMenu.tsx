import React, { useState, useRef, useEffect } from 'react'

type Props = {
  initials?: string
  onLogout: () => void
}

const UserMenu: React.FC<Props> = ({ initials = 'SA', onLogout }) => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-md z-50">
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu

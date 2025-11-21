import React, { useState, useEffect } from 'react'

interface Session {
  id: number
  user_id: number
  device_name: string
  device_type: string
  browser_name: string
  browser_version: string
  os_name: string
  os_version: string
  ip_address: string
  user_agent: string
  created_at: string
  last_used_at: string
  expires_at: string
  is_active: boolean
}

interface SessionManagerProps {
  onClose: () => void
  onBack?: () => void
}

const SessionManager: React.FC<SessionManagerProps> = ({ onClose, onBack }) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      console.log('Fetching sessions...')
      const response = await fetch('/api/sessions', {
        credentials: 'include'
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Sessions data:', data)
      setSessions(data)
      
      // Get current session ID from a cookie or local storage if needed
      // For now, we'll assume the most recently used session is the current one
      if (data.length > 0) {
        const currentSession = data.reduce((latest: Session, session: Session) => 
          new Date(session.last_used_at) > new Date(latest.last_used_at) ? session : latest
        )
        setCurrentSessionId(currentSession.id)
      }
    } catch (err) {
      console.error('Fetch sessions error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/sessions?session_id=${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete session')
      }
      
      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    }
  }

  const deleteAllOtherSessions = async () => {
    try {
      const response = await fetch('/api/sessions/others', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete other sessions')
      }
      
      // Keep only the current session
      if (currentSessionId) {
        setSessions(sessions.filter(s => s.id === currentSessionId))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete other sessions')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return '📱'
      case 'tablet':
        return '📱'
      case 'desktop':
      default:
        return '💻'
    }
  }

  const getBrowserIcon = (browserName: string) => {
    switch (browserName.toLowerCase()) {
      case 'chrome':
        return '🌐'
      case 'firefox':
        return '🦊'
      case 'safari':
        return '🧭'
      case 'edge':
        return '📘'
      default:
        return '🌍'
    }
  }

  const isCurrentSession = (sessionId: number) => {
    return sessionId === currentSessionId
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-yellow-100 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">Loading sessions...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-100 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-sm flex items-center gap-1"
              >
                ← Back
              </button>
            )}
            <h2 className="text-xl font-bold">Active Sessions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={deleteAllOtherSessions}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            disabled={sessions.length <= 1}
          >
            Sign out all other sessions
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active sessions found</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`border rounded-lg p-4 ${
                  isCurrentSession(session.id) 
                    ? 'border-yellow-600 bg-yellow-200' 
                    : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getDeviceIcon(session.device_type)}</span>
                      <span className="text-lg">{getBrowserIcon(session.browser_name)}</span>
                      <span className="font-medium">
                        {session.device_name || 'Unknown Device'}
                      </span>
                      {isCurrentSession(session.id) && (
                        <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                          Current Session
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <strong>Browser:</strong> {session.browser_name} {session.browser_version}
                      </div>
                      <div>
                        <strong>OS:</strong> {session.os_name} {session.os_version}
                      </div>
                      <div>
                        <strong>IP Address:</strong> {session.ip_address || 'Unknown'}
                      </div>
                      <div>
                        <strong>Created:</strong> {formatDate(session.created_at)}
                      </div>
                      <div>
                        <strong>Last Used:</strong> {formatDate(session.last_used_at)}
                      </div>
                      <div>
                        <strong>Expires:</strong> {formatDate(session.expires_at)}
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrentSession(session.id) && (
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-yellow-300">
          <p className="text-sm text-gray-600">
            Sessions are automatically extended to 7 days when you use the app. 
            Sessions expire after 7 days of inactivity.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SessionManager
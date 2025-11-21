import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ChangePassword from './ChangePassword'

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Get the previous path for back navigation
  const getBackPath = () => {
    const state = location.state as { from?: string }
    return state?.from || '/rooms'
  }

  const handleBack = () => {
    navigate(getBackPath())
  }

  const handleClose = () => {
    navigate(getBackPath())
  }

  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,_#e0e0e0_25px,_#e0e0e0_26px)] flex flex-col items-center justify-center p-4">
      <ChangePassword onClose={handleClose} onBack={handleBack} />
    </div>
  )
}

export default ChangePasswordPage
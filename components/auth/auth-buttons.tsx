'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoginDialog } from './login-dialog'
import { SignUpDialog } from './signup-dialog'
import { useAuth } from '@/lib/context/auth-context'
import { UserNav } from './user-nav'

export function AuthButtons() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const { user } = useAuth()

  if (user) {
    return <UserNav />
  }

  return (
    <div className="fixed bottom-4 left-4 flex gap-2 z-50">
      <Button
        variant="outline"
        onClick={() => setShowLogin(true)}
        className="shadow-lg"
      >
        Log In
      </Button>
      <Button
        variant="default"
        onClick={() => setShowSignUp(true)}
        className="shadow-lg"
      >
        Sign Up
      </Button>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
      <SignUpDialog open={showSignUp} onOpenChange={setShowSignUp} />
    </div>
  )
}

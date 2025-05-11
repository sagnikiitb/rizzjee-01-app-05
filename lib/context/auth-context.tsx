'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/lib/types/user'

interface AuthContextType {
  user: User | null
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (phone: string, password: string) => {
    // Here you would typically make an API call to verify credentials
    // For now, we'll simulate it with localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const user = storedUsers.find(
      (u: User) => u.phone === phone && u.password === password
    )
    if (user) {
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...userData }
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const updatedUsers = storedUsers.map((u: User) =>
      u.id === user.id ? updatedUser : u
    )

    localStorage.setItem('users', JSON.stringify(updatedUsers))
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

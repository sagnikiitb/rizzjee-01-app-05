'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface SignUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignUpDialog({ open, onOpenChange }: SignUpDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        createdAt: new Date()
      }

      // Store in localStorage (replace with your database logic)
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))

      toast.success('Account created successfully!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create account')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Name"
            value={formData.name}
            onChange={e =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
          <Input
            placeholder="Phone Number"
            value={formData.phone}
            onChange={e =>
              setFormData({ ...formData, phone: e.target.value })
            }
            maxLength={10}
            pattern="\d{10}"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={e =>
              setFormData({ ...formData, password: e.target.value })
            }
            maxLength={15}
            required
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={e =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            maxLength={15}
            required
          />
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
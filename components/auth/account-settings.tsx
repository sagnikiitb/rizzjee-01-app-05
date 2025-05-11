'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AccountSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSettings({ open, onOpenChange }: AccountSettingsProps) {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      await updateUser({
        name: formData.name,
        phone: formData.phone,
        ...(formData.newPassword && { password: formData.newPassword })
      })
      toast.success('Account updated successfully!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update account')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
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
            placeholder="Current Password"
            value={formData.password}
            onChange={e =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <Input
            type="password"
            placeholder="New Password (optional)"
            value={formData.newPassword}
            onChange={e =>
              setFormData({ ...formData, newPassword: e.target.value })
            }
            maxLength={15}
          />
          {formData.newPassword && (
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={e =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              maxLength={15}
              required
            />
          )}
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { Home, Book, Atom } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: Book
  },
  {
    name: 'Physics Simulations',
    href: '/simulations',
    icon: Atom
  },
  {
    name: 'About Exams',
    href: '/about-exams',
    icon: Book
  }
]

export function NavigationSidebar() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-4 bg-background/80 backdrop-blur-sm p-4 rounded-r-2xl border-r border-y shadow-lg">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg transition-all duration-300',
                'hover:scale-110 hover:bg-accent hover:shadow-md',
                'group relative',
                isActive && 'bg-accent/50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="absolute left-12 bg-popover text-popover-foreground px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap shadow-sm">
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test database connection and create tables
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Chat" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "messages" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
    )`

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Chat_userId_idx" ON "Chat"("userId")`

    // Create a test record
    await prisma.chat.upsert({
      where: { id: 'test' },
      update: {},
      create: {
        id: 'test',
        userId: 'system',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ status: 'Database initialized successfully' })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 })
  }
}

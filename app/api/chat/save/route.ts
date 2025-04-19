import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { chatId, messages } = await request.json()
    const timestamp = new Date().toISOString()
    
    // Using anonymous user ID as seen in your page.tsx
    const userId = 'anonymous'

    if (!chatId || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await prisma.chat.upsert({
      where: { id: chatId },
      update: {
        messages: messages.map((msg: any) => ({
          ...msg,
          timestamp: timestamp
        })),
        updatedAt: new Date()
      },
      create: {
        id: chatId,
        userId,
        messages: messages.map((msg: any) => ({
          ...msg,
          timestamp: timestamp
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, chat: result })
  } catch (error) {
    console.error('[CHAT SAVE API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save chat' },
      { status: 500 }
    )
  }
}

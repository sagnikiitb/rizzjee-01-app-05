import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const userId = 'sagnikiitb' // Replace with actual auth logic

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId parameter' },
        { status: 400 }
      )
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId
      }
    })

    if (!chat) {
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({ messages: chat.messages })
  } catch (error) {
    console.error('[CHAT LOAD API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load chat' },
      { status: 500 }
    )
  }
}

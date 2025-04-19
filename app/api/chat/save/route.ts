import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Simple in-memory request deduplication
const processingRequests = new Map<string, Promise<any>>()

export async function POST(request: Request) {
  try {
    const { chatId, messages } = await request.json()
    const timestamp = new Date().toISOString()
    
    if (!chatId || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a unique key for this request
    const requestKey = `${chatId}-${timestamp}`

    // Check if this request is already being processed
    if (processingRequests.has(requestKey)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Request already in progress' 
      })
    }

    // Create a promise for this request
    const requestPromise = (async () => {
      try {
        // Check if table exists, if not return a specific error
        const tableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'Chat'
          );
        `
        
        if (!tableExists) {
          return NextResponse.json({
            error: 'Database not initialized. Please contact administrator.',
            code: 'DB_NOT_INITIALIZED'
          }, { status: 503 })
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
            userId: 'anonymous',
            messages: messages.map((msg: any) => ({
              ...msg,
              timestamp: timestamp
            })),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        return NextResponse.json({ success: true, chat: result })
      } catch (error: any) {
        if (error?.code === 'P2021') {  // Table does not exist
          return NextResponse.json({
            error: 'Database not initialized. Please contact administrator.',
            code: 'DB_NOT_INITIALIZED'
          }, { status: 503 })
        }
        throw error
      }
    })()

    // Store the promise in the map
    processingRequests.set(requestKey, requestPromise)

    // Wait for the request to complete
    const response = await requestPromise

    // Clean up
    processingRequests.delete(requestKey)

    return response
  } catch (error) {
    console.error('[CHAT SAVE API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save chat',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

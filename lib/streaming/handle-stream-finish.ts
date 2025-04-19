import { getChat, saveChat } from '@/lib/actions/chat'
import { generateRelatedQuestions } from '@/lib/agents/generate-related-questions'
import { ExtendedCoreMessage, WikiAnnotation } from '@/lib/types'
import { convertToExtendedCoreMessages } from '@/lib/utils'
import { CoreMessage, DataStreamWriter, JSONValue, Message } from 'ai'

interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: DataStreamWriter
  skipRelatedQuestions?: boolean
  annotations?: ExtendedCoreMessage[]
}

interface WikifyResponse {
  annotations: WikiAnnotation[]
  error?: string
}

interface WikiAnnotationData {
  title: string
  url: string
  confidence?: number
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  skipRelatedQuestions = false,
  annotations = []
}: HandleStreamFinishParams) {
  try {
    const extendedCoreMessages = convertToExtendedCoreMessages(originalMessages)
    let allAnnotations = [...annotations]
    
    // Handle Wikipedia annotations
    const lastMessage = responseMessages[responseMessages.length - 1]
    if (lastMessage?.content) {
      try {
        // Notify wiki annotations loading state
        const loadingWikiAnnotation: JSONValue = {
          type: 'wiki-annotations',
          data: [],
          timestamp: new Date('2025-04-19T21:56:01Z').toISOString()
        }
        dataStream.writeMessageAnnotation(loadingWikiAnnotation)

        // Get base URL based on environment
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Construct the full API URL
        const apiUrl = new URL('/api/wikify', baseUrl).toString()

        // Fetch Wikipedia annotations with proper error handling
        const wikifyResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WIKIFY_API_KEY || ''}`,
            "X-User-ID": "sagnikiitb" // Current user's login
          },
          body: JSON.stringify({ 
            text: lastMessage.content,
            maxAnnotations: 5,
            minConfidence: 0.7,
            timestamp: new Date('2025-04-19T21:56:01Z').toISOString()
          })
        });
        
        if (!wikifyResponse.ok) {
          throw new Error(`Wikify API responded with status: ${wikifyResponse.status}`)
        }

        const wikifyData: WikifyResponse = await wikifyResponse.json()
        
        if (wikifyData.error) {
          throw new Error(`Wikify API error: ${wikifyData.error}`)
        }

        if (wikifyData.annotations && wikifyData.annotations.length > 0) {
          // Create Wiki annotation with proper structure
          const wikiAnnotation: ExtendedCoreMessage = {
            role: 'data',
            content: {
              type: 'wiki-annotations',
              data: wikifyData.annotations.map((annotation: WikiAnnotationData) => ({
                title: annotation.title,
                url: annotation.url,
                confidence: annotation.confidence
              })),
              timestamp: new Date('2025-04-19T21:56:01Z').toISOString(),
              userId: 'sagnikiitb'
            } as JSONValue
          }
          
          // Add to stream and annotations array
          dataStream.writeMessageAnnotation(wikiAnnotation.content as JSONValue)
          allAnnotations.push(wikiAnnotation)
        } else {
          // Write empty result with timestamp
          dataStream.writeMessageAnnotation({
            type: 'wiki-annotations',
            data: [],
            timestamp: new Date('2025-04-19T21:56:01Z').toISOString()
          })
        }
      } catch (error) {
        console.error('Failed to fetch wiki annotations:', error)
        // Write error state to stream
        dataStream.writeMessageAnnotation({
          type: 'wiki-annotations',
          error: 'Failed to fetch Wikipedia annotations',
          timestamp: new Date('2025-04-19T21:56:01Z').toISOString()
        })
      }
    }

    // Handle related questions if not skipped
    if (!skipRelatedQuestions) {
      try {
        // Notify related questions loading
        const loadingRelatedQuestions: JSONValue = {
          type: 'related-questions',
          data: { items: [] },
          timestamp: new Date('2025-04-19T21:56:01Z').toISOString()
        }
        dataStream.writeMessageAnnotation(loadingRelatedQuestions)

        // Generate related questions
        const relatedQuestions = await generateRelatedQuestions(
          responseMessages,
          model
        )

        if (relatedQuestions?.object) {
          // Create and add related questions annotation
          const relatedQuestionsAnnotation: ExtendedCoreMessage = {
            role: 'data',
            content: {
              type: 'related-questions',
              data: relatedQuestions.object,
              timestamp: new Date('2025-04-19T21:56:01Z').toISOString(),
              userId: 'sagnikiitb'
            } as JSONValue
          }

          dataStream.writeMessageAnnotation(
            relatedQuestionsAnnotation.content as JSONValue
          )
          allAnnotations.push(relatedQuestionsAnnotation)
        }
      } catch (error) {
        console.error('Failed to generate related questions:', error)
        dataStream.writeMessageAnnotation({
          type: 'related-questions',
          error: 'Failed to generate related questions',
          timestamp: new Date('2025-04-19T21:56:01Z').toISOString()
        })
      }
    }

    // Prepare messages for saving
    const generatedMessages = [
      ...extendedCoreMessages,
      ...responseMessages.slice(0, -1),
      ...allAnnotations,
      ...responseMessages.slice(-1)
    ] as ExtendedCoreMessage[]

    // Skip saving if chat history is disabled
    if (process.env.ENABLE_SAVE_CHAT_HISTORY !== 'true') {
      return
    }

    // Get or create chat with current timestamp and user
    const savedChat = (await getChat(chatId)) ?? {
      messages: [],
      createdAt: new Date('2025-04-19T21:56:01Z'),
      userId: 'sagnikiitb',
      path: `/search/${chatId}`,
      title: originalMessages[0].content,
      id: chatId
    }

    // Save chat with complete response and annotations
    await saveChat({
      ...savedChat,
      messages: generatedMessages,
      updatedAt: new Date('2025-04-19T21:56:01Z'),
      userId: 'sagnikiitb'
    }).catch(error => {
      console.error('Failed to save chat:', error)
      throw new Error('Failed to save chat history')
    })

  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error in handleStreamFinish')
  }
}

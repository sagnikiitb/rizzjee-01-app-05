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
  timestamp?: string
  user?: string
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
  const currentUser = 'sagnikiitb'
  const currentTimestamp = '2025-04-20 00:38:05' // Current timestamp from your system

  try {
    const extendedCoreMessages = convertToExtendedCoreMessages(originalMessages)
    let allAnnotations = [...annotations]
    
    // Handle Wikipedia annotations
    const lastMessage = responseMessages[responseMessages.length - 1]
    if (lastMessage?.content) {
      try {
        // Notify wiki annotations loading state
        const loadingWikiAnnotation: JSONValue = {
          type: 'wikipedia-references',
          data: [],
          timestamp: currentTimestamp,
          user: currentUser
        }
        dataStream.writeMessageAnnotation(loadingWikiAnnotation)

        // Use the correct API endpoint based on environment
        const apiBase = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';
        const apiUrl = `${apiBase}/api/wikify`;

        console.log(`[handleStreamFinish] Calling Wikify API at: ${apiUrl}`);

        // Fetch Wikipedia annotations
        const wikifyResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            text: lastMessage.content,
            timestamp: currentTimestamp,
            user: currentUser
          })
        });
        
        if (!wikifyResponse.ok) {
          throw new Error(`Wikify API responded with status: ${wikifyResponse.status}`)
        }

        const wikifyData: WikifyResponse = await wikifyResponse.json()
        console.log('[handleStreamFinish] Received Wikify response:', wikifyData);
        
        if (wikifyData.error) {
          throw new Error(`Wikify API error: ${wikifyData.error}`)
        }

        if (wikifyData.annotations && wikifyData.annotations.length > 0) {
          // Create Wiki annotation with proper structure
          const wikiAnnotation: ExtendedCoreMessage = {
            role: 'data',
            content: {
              type: 'wikipedia-references',
              data: {
                annotations: wikifyData.annotations.map((annotation: WikiAnnotationData) => ({
                  title: annotation.title,
                  url: annotation.url,
                  confidence: annotation.confidence
                }))
              },
              timestamp: currentTimestamp,
              user: currentUser
            } as JSONValue
          }
          
          console.log('[handleStreamFinish] Created wiki annotation:', wikiAnnotation);
          dataStream.writeMessageAnnotation(wikiAnnotation.content as JSONValue)
          allAnnotations.push(wikiAnnotation)
        } else {
          console.log('[handleStreamFinish] No annotations found in Wikify response');
          dataStream.writeMessageAnnotation({
            type: 'wikipedia-references',
            data: { annotations: [] },
            timestamp: currentTimestamp,
            user: currentUser
          })
        }
      } catch (error) {
        console.error('[handleStreamFinish] Failed to fetch wiki annotations:', error)
        dataStream.writeMessageAnnotation({
          type: 'wikipedia-references',
          error: 'Failed to fetch Wikipedia annotations',
          timestamp: currentTimestamp,
          user: currentUser
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
          timestamp: currentTimestamp,
          user: currentUser
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
              timestamp: currentTimestamp,
              user: currentUser
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
          timestamp: currentTimestamp,
          user: currentUser
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

    // Get or create chat
    const savedChat = (await getChat(chatId)) ?? {
      messages: [],
      createdAt: new Date(),
      userId: currentUser,
      path: `/search/${chatId}`,
      title: originalMessages[0].content,
      id: chatId
    }

    // Save chat with complete response and annotations
    await saveChat({
      ...savedChat,
      messages: generatedMessages,
      updatedAt: new Date(),
      userId: currentUser
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

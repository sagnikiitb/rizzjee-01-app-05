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
    
    // Handle Wikipedia annotations first
    const lastMessage = responseMessages[responseMessages.length - 1]
    if (lastMessage?.content) {
      try {
        // Notify wiki annotations loading
        const loadingWikiAnnotation: JSONValue = {
          type: 'wiki-annotations',
          data: []
        }
        dataStream.writeMessageAnnotation(loadingWikiAnnotation)

        // Fetch Wikipedia annotations
        const wikifyResponse = await fetch("/api/wikify", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WIKIFY_API_KEY || ''}`
          },
          body: JSON.stringify({ 
            text: lastMessage.content,
            maxAnnotations: 5, // Limit number of annotations
            minConfidence: 0.7 // Only get high-confidence matches
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
              data: wikifyData.annotations.map(annotation => ({
                title: annotation.title,
                url: annotation.url
              }))
            } as JSONValue
          }
          
          // Add to stream and save in annotations array
          dataStream.writeMessageAnnotation(wikiAnnotation.content as JSONValue)
          allAnnotations.push(wikiAnnotation)
        } else {
          // If no annotations found, write empty result
          dataStream.writeMessageAnnotation({
            type: 'wiki-annotations',
            data: []
          })
        }
      } catch (error) {
        console.error('Failed to fetch wiki annotations:', error)
        // Write error state to stream
        dataStream.writeMessageAnnotation({
          type: 'wiki-annotations',
          error: 'Failed to fetch Wikipedia annotations'
        })
      }
    }

    // Handle related questions if not skipped
    if (!skipRelatedQuestions) {
      try {
        // Notify related questions loading
        const loadingRelatedQuestions: JSONValue = {
          type: 'related-questions',
          data: { items: [] }
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
              data: relatedQuestions.object
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
          error: 'Failed to generate related questions'
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
      userId: 'anonymous',
      path: `/search/${chatId}`,
      title: originalMessages[0].content,
      id: chatId
    }

    // Save chat with all annotations
    await saveChat({
      ...savedChat,
      messages: generatedMessages,
      updatedAt: new Date('2025-04-19T21:42:29Z') // Using the current timestamp
    }).catch(error => {
      console.error('Failed to save chat:', error)
      throw new Error('Failed to save chat history')
    })

  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    // Ensure the error is properly propagated
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error in handleStreamFinish')
  }
}

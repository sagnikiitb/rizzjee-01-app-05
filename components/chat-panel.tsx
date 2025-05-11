'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Mistral } from '@mistralai/mistralai'
import { Message } from 'ai'
import { ArrowUp, MessageCirclePlus, Paperclip, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { toast } from 'sonner'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchModeToggle } from './search-mode-toggle'
import { Button } from './ui/button'
import { IconLogo } from './ui/icons'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
}

const LANGUAGES = [
  { label: 'Hinglish', value: 'Hinglish' },
  { label: 'English', value: 'English' },
  { label: 'Hindi', value: 'Hindi (देवनागरी)' },
  { label: 'Bhojpuri', value: 'Bhojpuri' },
  { label: 'Punjabi', value: 'Punjabi' },
  { label: 'Marathi', value: 'Marathi' },
  { label: 'Gujarati', value: 'Gujarati' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Kannada', value: 'Kannada' },
  { label: 'Malayalam', value: 'Malayalam' },
  { label: 'Urdu', value: 'Urdu (اردو)' },
  { label: 'Bengali', value: 'Bengali (বাংলা)' },
  { label: 'Odia', value: 'Odia (ଓଡ଼ିଆ)' },
  { label: 'Assamese', value: 'Assamese (অসমীয়া)' },
  { label: 'Maithili', value: 'Maithili' },
  { label: 'Dogri', value: 'Dogri' },
  { label: 'Kashmiri', value: 'Kashmiri (کٕشمیری)' },
  { label: 'Manipuri', value: 'Manipuri (মণিপুরী)' },
  { label: 'Santali', value: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)' },
  { label: 'Sindhi', value: 'Sindhi (سنڌي)' }
]

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  models
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    router.push('/')
  }

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: `${query}\n\nPlease answer in ${selectedLanguage} only.`
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Custom handleSubmit to append language instruction
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim().length === 0) return
    append({
      role: 'user',
      content: `${input}\n\nPlease answer in ${selectedLanguage} only.`
    })
    handleInputChange({
      target: { value: '' }
    } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = reader.result as string
        resolve(base64String)
      }
      reader.onerror = error => {
        reject(error)
      }
    })
  }

  // OCR Upload handlers
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Clear any previous selection
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // Validate file type
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf'
      ]
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a PDF or image file (JPEG/PNG).')
      }

      // Validate file size (e.g., 10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_SIZE) {
        throw new Error('File too large. Maximum size is 10MB.')
      }

      // Get API key
      const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY
      if (!apiKey) {
        throw new Error('Mistral API key not found in environment variables.')
      }

      // Convert file to base64 data URL
      const dataUrl = await fileToBase64(file)

      // Create Mistral client
      const client = new Mistral({ apiKey })

      // Process OCR directly using the Mistral client
      const ocrResponse = await client.ocr.process({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          documentUrl: dataUrl
        },
        includeImageBase64: false
      })

      // Extract text from OCR response
      const ocrText = ocrResponse.pages.map(page => page.markdown).join('\n\n')

      // Add the extracted text to the chat
      append({
        role: 'user',
        content: `[Uploaded document: ${file.name}]\n\n${ocrText}\n\nPlease answer in ${selectedLanguage} only.`
      })

      toast.success('Document successfully processed!')
    } catch (error: any) {
      console.error('Error during OCR processing:', error)

      // Add error message to chat
      append({
        role: 'user',
        content: `[Attempted to upload: ${file.name}]`
      })
      append({
        role: 'system',
        content: `OCR failed: ${
          error?.message || 'Unknown error processing document'
        }`
      })

      toast.error(
        error instanceof Error ? error.message : 'Failed to process document'
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn(
        'mx-auto w-full',
        messages.length > 0
          ? 'fixed bottom-0 left-0 right-0 bg-background'
          : 'fixed bottom-8 left-0 right-0 top-6 flex flex-col items-center justify-center'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-10 flex flex-col items-center gap-4">
          <IconLogo className="size-12 text-muted-foreground" />
          <p className="text-center text-3xl font-semibold">
            How can I help you today?
          </p>
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className={cn(
          'max-w-3xl w-full mx-auto',
          messages.length > 0 ? 'px-2 pb-4' : 'px-6'
        )}
      >
        <div className="relative flex flex-col w-full gap-2 bg-muted rounded-3xl border border-input">
          {/* Language Selector */}
          <div className="flex items-center gap-2 px-4 pt-4">
            <label htmlFor="language-select" className="text-sm font-medium">
              Language:
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask a question..."
            spellCheck={false}
            value={input}
            className="resize-none w-full min-h-12 bg-transparent border-0 p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => {
              handleInputChange(e)
              setShowEmptyScreen(e.target.value.length === 0)
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault()
                  return
                }
                e.preventDefault()
                const textarea = e.target as HTMLTextAreaElement
                textarea.form?.requestSubmit()
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <ModelSelector models={models || []} />
              <SearchModeToggle />
            </div>
            <div className="flex items-center gap-2">
              {/* OCR Upload Button */}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={handleUploadClick}
                disabled={uploading}
                title="Upload photo or PDF for OCR"
              >
                {uploading ? (
                  <span className="animate-pulse text-xs">...</span>
                ) : (
                  <Paperclip size={20} />
                )}
              </Button>
              <input
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
              />
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 rounded-full group"
                  type="button"
                  disabled={isLoading}
                >
                  <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                </Button>
              )}
              <Button
                type={isLoading ? 'button' : 'submit'}
                size={'icon'}
                variant={'outline'}
                className={cn(isLoading && 'animate-pulse', 'rounded-full')}
                disabled={input.length === 0 && !isLoading}
                onClick={isLoading ? stop : undefined}
              >
                {isLoading ? <Square size={20} /> : <ArrowUp size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn(showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}
      </form>
    </div>
  )
}

'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Mistral } from '@mistralai/mistralai'
import { Message } from 'ai'
import { ArrowUp, MessageCirclePlus, Mic, MicOff, Paperclip, Square } from 'lucide-react'
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
  { label: 'Hinglish', value: 'Hinglish', code: 'en' },
  { label: 'English', value: 'English', code: 'en' },
  { label: 'Hindi', value: 'Hindi (देवनागरी)', code: 'hi' },
  { label: 'Bhojpuri', value: 'Bhojpuri', code: 'hi' },
  { label: 'Punjabi', value: 'Punjabi', code: 'pa' },
  { label: 'Marathi', value: 'Marathi', code: 'mr' },
  { label: 'Gujarati', value: 'Gujarati', code: 'gu' },
  { label: 'Tamil', value: 'Tamil', code: 'ta' },
  { label: 'Telugu', value: 'Telugu', code: 'te' },
  { label: 'Kannada', value: 'Kannada', code: 'kn' },
  { label: 'Malayalam', value: 'Malayalam', code: 'ml' },
  { label: 'Urdu', value: 'Urdu (اردو)', code: 'ur' },
  { label: 'Bengali', value: 'Bengali (বাংলা)', code: 'bn' },
  { label: 'Odia', value: 'Odia (ଓଡ଼ିଆ)', code: 'or' },
  { label: 'Assamese', value: 'Assamese (অসমীয়া)', code: 'as' },
  { label: 'Maithili', value: 'Maithili', code: 'hi' },
  { label: 'Dogri', value: 'Dogri', code: 'hi' },
  { label: 'Kashmiri', value: 'Kashmiri (کٕشمیری)', code: 'ks' },
  { label: 'Manipuri', value: 'Manipuri (মণিপুরী)', code: 'mni' },
  { label: 'Santali', value: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)', code: 'sat' },
  { label: 'Sindhi', value: 'Sindhi (سنڌي)', code: 'sd' }
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
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)

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

  // Get language code for transcription API
  const getLanguageCode = (languageValue: string): string => {
    const language = LANGUAGES.find(lang => lang.value === languageValue)
    return language?.code || 'en'
  }

  // Start voice recording
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create media recorder
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      setAudioChunks([])
      
      // Set up event handlers
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }
      
      // Auto-stop recording after 30 seconds
      const timeout = setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording()
          toast.info('Recording stopped after 30 seconds')
        }
      }, 30000)
      
      setRecordingTimeout(timeout)
      
      // Start recording
      recorder.start(200)
      setIsRecording(true)
      toast.success('Recording started')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Failed to access microphone')
    }
  }
  
  // Stop voice recording and transcribe
  const stopRecording = async () => {
    if (!mediaRecorder) return
    
    // Clear auto-stop timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout)
      setRecordingTimeout(null)
    }
    
    // Only proceed if we're actually recording
    if (mediaRecorder.state === 'recording') {
      // Stop the recorder
      mediaRecorder.stop()
      setIsRecording(false)
      
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      
      // Wait for final chunks to be collected
      setTimeout(async () => {
        if (audioChunks.length === 0) {
          toast.error('No audio recorded')
          return
        }
        
        setIsTranscribing(true)
        
        try {
          // Create audio blob
          // Create audio blob
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          
          // Create form data for API request
          const formData = new FormData()
          // The third argument sets the filename, so the backend receives a File-like object
          formData.append('file', audioBlob, 'recording.webm')
          formData.append('language', getLanguageCode(selectedLanguage))
          
          // Before fetch call: log properties that exist on Blob
          console.log('Sending audio file:', {
            // name is not available on Blob, but you know what you set as filename
            filename: 'recording.webm',
            size: audioBlob.size,
            type: audioBlob.type
          })
          
          // Send to transcription API
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })
          
          console.log('Response status:', response.status)
          
          if (!response.ok) {
            throw new Error('Transcription failed')
          }
          
          const result = await response.json()
          

          
          if (result.text) {
            // Append transcribed text to current input
            const newValue = input ? `${input} ${result.text}`.trim() : result.text
            handleInputChange({
              target: { value: newValue }
            } as React.ChangeEvent<HTMLTextAreaElement>)
            
            // Focus the input field
            if (inputRef.current) {
              inputRef.current.focus()
            }
            
            toast.success('Transcription added to input')
          } else {
            toast.warning('No speech detected')
          }
        } catch (error) {
          console.error('Transcription error:', error)
          toast.error('Failed to transcribe audio')
        } finally {
          setIsTranscribing(false)
          setAudioChunks([])
        }
      }, 300)
    }
  }
  
  // Toggle recording state
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Clean up recording resources on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeout) {
        clearTimeout(recordingTimeout)
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mediaRecorder, recordingTimeout])

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
              {/* Voice Input Button */}
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  isRecording && "bg-red-500 hover:bg-red-600 text-white",
                  isTranscribing && "animate-pulse"
                )}
                onClick={toggleRecording}
                disabled={isTranscribing}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? (
                  <MicOff size={20} />
                ) : isTranscribing ? (
                  <span className="text-xs">...</span>
                ) : (
                  <Mic size={20} />
                )}
              </Button>

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

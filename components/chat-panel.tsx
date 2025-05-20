'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Mistral } from '@mistralai/mistralai'
import { Message } from 'ai'
import { ArrowUp, MessageCirclePlus, Paperclip, Square, Mic } from 'lucide-react'
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

// Voice recorder hook for audio capture and sending to /api/transcribe
function useVoiceRecorder(onTranscription: (text: string) => void, selectedLanguageCode: string) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Audio recording not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendAudioToTranscribe(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      alert('Failed to start recording: ' + err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToTranscribe = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      // Send ISO code or similar — map selectedLanguage to whisper language code if needed
      formData.append('language', selectedLanguageCode)

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        onTranscription(data.text)
      } else {
        toast.error(data.error || 'Failed to transcribe audio.')
      }
    } catch (error) {
      toast.error('Error sending audio: ' + (error as Error).message)
    }
  }

  return { isRecording, startRecording, stopRecording }
}

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

  // Map UI language selection to Whisper language code
  const languageCodeMap: Record<string, string> = {
    Hinglish: 'en', // approximate
    English: 'en',
    Hindi: 'hi',
    Bhojpuri: 'bh',
    Punjabi: 'pa',
    Marathi: 'mr',
    Gujarati: 'gu',
    Tamil: 'ta',
    Telugu: 'te',
    Kannada: 'kn',
    Malayalam: 'ml',
    Urdu: 'ur',
    Bengali: 'bn',
    Odia: 'or',
    Assamese: 'as',
    Maithili: 'mai',
    Dogri: 'doi',
    Kashmiri: 'ks',
    Manipuri: 'mni',
    Santali: 'sat',
    Sindhi: 'sd'
  }

  // Initialize voice recorder hook with current selected language code
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder(
    transcribedText => {
      append({
        role: 'user',
        content: `${transcribedText}\n\nPlease answer in ${selectedLanguage} only.`
      })
    },
    languageCodeMap[selectedLanguage] || 'en'
  )

  //... continuing to next message for full code
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      setShowEmptyScreen(true)
    } else {
      setShowEmptyScreen(false)
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (!isLoading && isFirstRender.current) {
      isFirstRender.current = false
    }
  }, [isLoading])

  // Handle enter key submit but allow shift+enter for new lines, also block if composition active
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!enterDisabled) {
        handleSubmit(e as any)
      }
    }
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size should be less than 20MB.')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      append({
        role: 'user',
        content: `Uploaded file content:\n${text}\n\nPlease answer in ${selectedLanguage} only.`
      })
      setUploading(false)
    }
    reader.onerror = () => {
      toast.error('Failed to read file.')
      setUploading(false)
    }
    reader.readAsText(file)
    e.target.value = '' // reset input to allow same file reupload
  }

  return (
    <section className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        <ModelSelector models={models ?? []} />
        <SearchModeToggle />
        <select
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
          className="border rounded px-2 py-1"
          aria-label="Select language"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {showEmptyScreen ? (
        <EmptyScreen submitMessage={submitMessage} />
      ) : (
        <div className="flex-1 overflow-auto px-4 py-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'my-2 p-3 rounded-md',
                msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
              )}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && <p className="text-gray-500">Loading...</p>}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center border-t border-gray-300 p-2 space-x-2"
      >
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            'p-2 rounded-full',
            isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
          )}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          disabled={isLoading}
        >
          <Mic size={20} />
        </button>

        <Textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Type your message or use the microphone..."
          minRows={1}
          maxRows={6}
          disabled={isLoading}
          className="flex-grow resize-none border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
          spellCheck={false}
          aria-label="Message input"
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={onFileInputChange}
          accept=".txt,.pdf"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-md hover:bg-gray-200"
          aria-label="Upload file"
          title="Upload file"
          disabled={uploading || isLoading}
        >
          <Paperclip size={20} />
        </button>

        {isLoading ? (
          <Button variant="secondary" onClick={stop} aria-label="Stop generating">
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()} aria-label="Send message">
            <ArrowUp size={20} />
          </Button>
        )}
      </form>
    </section>
  )
}

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

// Optional utility function for converting to API language codes
const languageToCode: Record<string, string> = {
  Hinglish: 'hi',
  English: 'en',
  Hindi: 'hi',
  Bhojpuri: 'bho',
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

  // Mic recording related state
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendRecording(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Mic access denied or recording failed:', error)
      toast.error('Microphone access is needed to record voice.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendRecording = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', languageToCode[selectedLanguage] || 'en')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Transcription failed.')

      const transcript = data.transcript?.trim()
      if (transcript) {
        handleInputChange({
          target: {
            value: input + (input.length > 0 ? ' ' : '') + transcript
          }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      } else {
        toast.error('No speech detected.')
      }
    } catch (err: any) {
      console.error('Transcription error:', err)
      toast.error(err?.message || 'Failed to transcribe audio.')
    }
  }
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
              {/* Mic Button */}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn('rounded-full', isRecording && 'bg-red-100')}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                <Mic className={cn('size-4', isRecording && 'text-red-500 animate-pulse')} />
              </Button>
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

import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    // 1. Log all formData entries
    console.log('Received form data entries:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: File (${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`- ${key}: ${value}`)
      }
    }
    const audioFile = formData.get('file') as File | null
    const language = formData.get('language') as string | null || 'en'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }
    // 2. Verify audioFile properties
    console.log('Audio file details:', {
      exists: !!audioFile,
      name: audioFile?.name || 'null',
      size: audioFile?.size || 'null',
      type: audioFile?.type || 'null',
      lastModified: audioFile?.lastModified || 'null'
    })

    // Convert the File (Web API) to a Blob and then to a ReadableStream for OpenAI
    // Note: Next.js 13+ fetch API supports passing File directly in formData, so just use audioFile

    // Create new FormData to send to OpenAI whisper endpoint
    const openaiForm = new FormData()
    openaiForm.append('file', audioFile, (audioFile as any).name || 'audio.webm')
    openaiForm.append('model', 'gpt-4o-transcribe')
    openaiForm.append('language', language)
    openaiForm.append('temperature', '0')
    openaiForm.append('prompt', 'You are transcribing audio to text for a STEM Student. Transcribe the following audio precisely without adding phrases like "thanks for watching" or other hallucinations.')
                      

    // Call OpenAI transcription endpoint
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: openaiForm as any // Node FormData compatible
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error }, { status: response.status })
    }

    const json = await response.json()
    // json.text contains the transcription result

    return NextResponse.json({ text: json.text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

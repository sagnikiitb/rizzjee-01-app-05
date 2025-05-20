import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import { OpenAI } from 'openai'

export const config = {
  api: {
    bodyParser: false
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    const language = formData.get('language')?.toString() || 'english'

    if (!audio) return NextResponse.json({ error: 'No audio file sent' }, { status: 400 })

    // Save audio file temporarily
    const buffer = Buffer.from(await audio.arrayBuffer())
    const tempPath = `/tmp/audio-${Date.now()}.webm`
    await fs.writeFile(tempPath, buffer)

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: await fs.createReadStream(tempPath) as any,
      model: 'whisper-1',
      language: mapToISOCode(language)
    })

    await fs.unlink(tempPath) // Clean up temp file

    return NextResponse.json({ transcript: transcription.text })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: error.message || 'Failed to transcribe' }, { status: 500 })
  }
}

function mapToISOCode(language: string): string {
  const mapping: Record<string, string> = {
    'Hindi (देवनागरी)': 'hi',
    Hinglish: 'hi',
    English: 'en',
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
  return mapping[language] || 'en'
}

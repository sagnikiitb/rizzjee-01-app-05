import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import * as fs from 'fs/promises'
import path from 'path'
import os from 'os'
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

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
	//var audioFile = audioFile_input
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('Audio file details:', {
      exists: !!audioFile,
      name: audioFile?.name || 'null',
      size: audioFile?.size || 'null',
      type: audioFile?.type || 'null',
      lastModified: audioFile?.lastModified || 'null'
    })
  const correctedFile = new File(
  [await audioFile.arrayBuffer()], // original file contents
  audioFile.name || 'recording.webm', // preserve name
  { type: 'audio/webm' } // force correct MIME type
)

    console.log('Corrected file details:', {
      exists: !!correctedFile,
      name: correctedFile?.name || 'null',
      size: correctedFile?.size || 'null',
      type: correctedFile?.type || 'null',
      lastModified: correctedFile?.lastModified || 'null'
    })

const response = await openai.audio.transcriptions.create({
  file: correctedFile,
  model: "whisper-1",
  response_format: "text",
  prompt: "You are transcribing audio to text for a STEM Student. Transcribe the following audio precisely without adding phrases like 'thanks for watching' or other hallucinations.",
});
        console.log(response);

    return NextResponse.json({ text: response });

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

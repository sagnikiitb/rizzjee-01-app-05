'use server'

import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    console.log('File info:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Try direct transcription first
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });

      return NextResponse.json({ text: transcription });
    } catch (directError) {
      console.log('Direct transcription failed:', directError);
      
      // If direct fails, try creating a new File with proper MIME type
      const buffer = await file.arrayBuffer();
      const audioFile = new File([buffer], 'audio.webm', { 
        type: 'audio/webm' 
      });

      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text',
        });

        return NextResponse.json({ text: transcription });
      } catch (webmError) {
        console.log('WebM transcription failed:', webmError);
        
        // Last resort: try with audio/wav MIME type
        const wavFile = new File([buffer], 'audio.wav', { 
          type: 'audio/wav' 
        });

        const transcription = await openai.audio.transcriptions.create({
          file: wavFile,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text',
        });

        return NextResponse.json({ text: transcription });
      }
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

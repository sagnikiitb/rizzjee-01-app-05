'use server'

import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function convertWebmToMp3(webmBuffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `input-${Date.now()}.webm`);
  const outputPath = join(tmpdir(), `output-${Date.now()}.mp3`);

  await writeFile(inputPath, webmBuffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .save(outputPath)
      .on('end', async () => {
        try {
          const mp3Buffer = await readFile(outputPath);
          await unlink(inputPath);
          await unlink(outputPath);
          resolve(mp3Buffer);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', async (err) => {
        await unlink(inputPath).catch(() => {});
        await unlink(outputPath).catch(() => {});
        reject(err);
      });
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file received' }, { status: 400 });
  }

  const webmBuffer = Buffer.from(await file.arrayBuffer());
  const mp3Buffer = await convertWebmToMp3(webmBuffer);

  const audioFile = await openai.files.create({
    file: mp3Buffer,
    purpose: 'transcription',
    name: 'audio.mp3',
  });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  });

  return NextResponse.json({ text: transcription });
}


// app/api/transcribe/route.ts

import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join("/tmp", file.name);
    fs.writeFileSync(filePath, buffer);

    // Prepare OpenAI API call
    const openaiForm = new FormData();
    openaiForm.append("file", fs.createReadStream(filePath));
    openaiForm.append("model", "whisper-1");
    openaiForm.append("language", "auto"); // or "hi", "ta", etc. for forced Indic language

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...openaiForm.getHeaders(),
      },
      body: openaiForm,
    });

    // Cleanup and respond
    fs.unlinkSync(filePath);
    const data = await response.json();
    return Response.json({ transcription: data.text || "" });

  } catch (err) {
    console.error("Transcription error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

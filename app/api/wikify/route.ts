import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text in request body' }, { status: 400 });
    }
    // Simply return the text unchanged, disabling additional wikification.
    return NextResponse.json({ wikifiedHTML: text });
  } catch (error) {
    console.error('Error in wikifier API route:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

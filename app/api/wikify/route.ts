import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text in request body' }, { status: 400 });
    }

    const userKey = process.env.WIKIFIER_USER_KEY;
    if (!userKey) {
      return NextResponse.json(
        { error: 'WIKIFIER_USER_KEY not set in environment variables' },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.append('userKey', userKey);
    params.append('text', text);
    params.append('lang', 'en');
    params.append('pageRankSqThreshold', '0.5');
    params.append('applyPageRankSqThreshold', 'true');
    params.append('nTopDfValuesToIgnore', '100');
    params.append('nWordsToIgnoreFromList', '200');

    const wikifierUrl = `https://www.wikifier.org/annotate-article?${params.toString()}`;
    const response = await fetch(wikifierUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Wikifier API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ wikifiedHTML: result.wikifiedHTML || text });
  } catch (error) {
    console.error('Error fetching Wikifier:', error);
    return NextResponse.json({ error: 'Failed to fetch Wikifier API' }, { status: 500 });
  }
}https://github.com/sagnikiitb/rizzjee-01-app-05/blob/dev/app/api/wikify/route.ts

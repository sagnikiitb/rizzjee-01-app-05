import { NextRequest, NextResponse } from "next/server";

// Export the config for Edge Runtime
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const currentUser = 'sagnikiitb';
  const currentTimestamp = new Date().toISOString();
  
  try {
    console.log(`[WIKIFY API] Received POST request from user ${currentUser} at ${currentTimestamp}`);

    // Check if method is allowed
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Parse JSON payload from request
    const reqBody = await request.json();
    console.log(`[WIKIFY API] Request payload received from ${currentUser}`);

    const { text } = reqBody;
    if (!text) {
      console.error("[WIKIFY API] Error: 'text' is missing in the request body");
      return NextResponse.json(
        { error: "Missing text in request body" },
        { status: 400 }
      );
    }

    // Retrieve the environment variable for Wikifier API key
    const userKey = process.env.WIKIFIER_USER_KEY;
    if (!userKey) {
      console.error("[WIKIFY API] Error: External WIKIFIER_USER_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "WIKIFIER_USER_KEY External not set in environment variables" },
        { status: 500 }
      );
    }

    // Construct the parameters for Wikifier API request
    const params = new URLSearchParams({
      userKey,
      text,
      lang: 'auto',
      pageRankSqThreshold: '0.5',
      applyPageRankSqThreshold: 'true',
      nTopDfValuesToIgnore: '100',
      nWordsToIgnoreFromList: '200',
      timestamp: currentTimestamp
    });

    // Make request to Wikifier service
    const wikifierUrl = `https://www.wikifier.org/annotate-article?${params.toString()}`;
    console.log(`[WIKIFY API] Sending request to Wikifier service for user ${currentUser}`);

    const response = await fetch(wikifierUrl, { 
      method: "GET",
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`[WIKIFY API] Wikifier response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WIKIFY API] Wikifier service error:", errorText);
      return NextResponse.json(
        { error: `Wikifier service error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[WIKIFY API] Processing Wikifier response data for user ${currentUser}`);

    // Process annotations
    let annotations: { title: string; url: string; confidence?: number }[] = [];
    if (data.annotations && Array.isArray(data.annotations)) {
      annotations = data.annotations.map((annotation: any) => ({
        title: annotation.title || annotation.articleTitle,
        url: annotation.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(annotation.articleTitle)}`,
        confidence: annotation.pageRank || annotation.confidence || undefined
      }));
    } else if (data.wikifiedHTML) {
      const regex = /<a[^>]+href="https:\/\/en\.wikipedia\.org\/wiki\/([^">]+)"[^>]*>([^<]+)<\/a>/g;
      const found = new Map<string, { url: string; confidence?: number }>();
      let match;
      while ((match = regex.exec(data.wikifiedHTML)) !== null) {
        const pageTitle = decodeURIComponent(match[1].replace(/_/g, " "));
        if (!found.has(pageTitle)) {
          found.set(pageTitle, {
            url: `https://en.wikipedia.org/wiki/${match[1]}`,
            confidence: undefined
          });
        }
      }
      annotations = Array.from(found, ([title, { url, confidence }]) => ({ 
        title, 
        url, 
        confidence 
      }));
    }

    // Sort by confidence and limit results
    annotations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const limitedAnnotations = annotations.slice(0, 5);

    console.log(`[WIKIFY API] Returning ${limitedAnnotations.length} annotations for user ${currentUser}`);

    // Return the processed annotations
    return NextResponse.json({
  type: 'wikipedia-references',
  data: {
    annotations: limitedAnnotations.map(annotation => ({
      title: annotation.title,
      url: annotation.url,
      confidence: annotation.confidence
    }))
  },
  timestamp: currentTimestamp,
  user: currentUser
}, {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
});


  } catch (error) {
    console.error(`[WIKIFY API] Internal server error for user ${currentUser}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("[WIKIFY API] Received a POST request to /api/wikify");

    // Check authorization header
    const authHeader = request.headers.get('Authorization');
    const expectedApiKey = process.env.WIKIFY_API_KEY;
    
    if (!authHeader || !expectedApiKey || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedApiKey) {
      console.error("[WIKIFY API] Authorization failed: Invalid or missing API key");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse JSON payload from request.
    const reqBody = await request.json();
    console.log("[WIKIFY API] Request payload:", reqBody);

    const { text } = reqBody;
    if (!text) {
      console.error("[WIKIFY API] Error: 'text' is missing in the request body.");
      return NextResponse.json(
        { error: "Missing text in request body" },
        { status: 400 }
      );
    }

    // Retrieve the environment variable for Wikifier API key.
    const userKey = process.env.WIKIFIER_USER_KEY;
    if (!userKey) {
      console.error("[WIKIFY API] Error: WIKIFIER_USER_KEY is not set in environment variables.");
      return NextResponse.json(
        { error: "WIKIFIER_USER_KEY not set in environment variables" },
        { status: 500 }
      );
    }

    const currentTimestamp = new Date('2025-04-19T22:03:29Z').toISOString();
    console.log(`[WIKIFY API] Processing request at ${currentTimestamp}`);
    console.log("[WIKIFY API] Using valid WIKIFIER_USER_KEY. Constructing request parameters...");

    // Construct the parameters for Wikifier API GET request
    const params = new URLSearchParams();
    params.append("userKey", userKey);
    params.append("text", text);
    params.append("lang", "auto");
    params.append("pageRankSqThreshold", "0.5");
    params.append("applyPageRankSqThreshold", "true");
    params.append("nTopDfValuesToIgnore", "100");
    params.append("nWordsToIgnoreFromList", "200");
    params.append("timestamp", currentTimestamp);

    const wikifierUrl = `https://www.wikifier.org/annotate-article?${params.toString()}`;
    console.log(`[WIKIFY API] Preparing to fetch annotations using GET method`);

    const response = await fetch(wikifierUrl, { 
      method: "GET",
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log("[WIKIFY API] Received response from Wikifier:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WIKIFY API] Received non-OK response from Wikifier API.", errorText);
      return NextResponse.json(
        { error: `Wikifier API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[WIKIFY API] Data received from Wikifier");

    // Process the response data to extract annotations
    let annotations: { title: string; url: string; confidence?: number }[] = [];
    if (data.annotations && Array.isArray(data.annotations)) {
      console.log("[WIKIFY API] Processing annotations from data.annotations");
      annotations = data.annotations.map((annotation: any) => ({
        title: annotation.title || annotation.articleTitle,
        url: annotation.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(annotation.articleTitle)}`,
        confidence: annotation.pageRank || annotation.confidence || undefined
      }));
    } else if (data.wikifiedHTML) {
      console.log("[WIKIFY API] Extracting annotations from wikifiedHTML");
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

    // Sort by confidence (if available) and limit to top 5
    annotations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const limitedAnnotations = annotations.slice(0, 5);

    console.log("[WIKIFY API] Returning annotations:", {
      count: limitedAnnotations.length,
      timestamp: currentTimestamp
    });

    return NextResponse.json({
      annotations: limitedAnnotations,
      timestamp: currentTimestamp
    });

  } catch (error) {
    console.error("[WIKIFY API] Internal error processing wikification:", error);
    return NextResponse.json(
      { error: "Internal error processing wikification" },
      { status: 500 }
    );
  }
}

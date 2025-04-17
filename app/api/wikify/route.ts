import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("[WIKIFY API] Received a POST request to /api/wikify");

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

    console.log("[WIKIFY API] Using valid WIKIFIER_USER_KEY. Constructing request parameters...");

    // Construct the parameters for Wikifier API GET request (per their docs).
    const params = new URLSearchParams();
    params.append("userKey", userKey);
    params.append("text", text);
    params.append("lang", "en");
    params.append("pageRankSqThreshold", "0.5");
    params.append("applyPageRankSqThreshold", "true");
    params.append("nTopDfValuesToIgnore", "100");
    params.append("nWordsToIgnoreFromList", "200");

    // According to Wikifier docs, the API expects GET syntax.
    const wikifierUrl = `https://www.wikifier.org/annotate-article?${params.toString()}`;
    console.log(`[WIKIFY API] Preparing to fetch annotations using GET method with URL: ${wikifierUrl}`);

    // Explicitly use GET for the external Wikifier API call.
    const response = await fetch(wikifierUrl, { method: "GET" });
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
    console.log("[WIKIFY API] Data received from Wikifier:", data);

    // Process the response data to extract annotations.
    let annotations: { title: string; url: string }[] = [];
    if (data.annotations && Array.isArray(data.annotations)) {
      console.log("[WIKIFY API] Annotations found in data.annotations.");
      annotations = data.annotations;
    } else if (data.wikifiedHTML) {
      console.log("[WIKIFY API] data.wikifiedHTML found. Attempting to extract annotations via regex.");
      // Fallback: use regex to extract Wikipedia links from wikified HTML.
      const regex = /<a[^>]+href="https:\/\/en\.wikipedia\.org\/wiki\/([^">]+)"[^>]*>([^<]+)<\/a>/g;
      const found = new Map<string, string>(); // Using Map to avoid duplicates.
      let match;
      while ((match = regex.exec(data.wikifiedHTML)) !== null) {
        const pageTitle = decodeURIComponent(match[1].replace(/_/g, " "));
        if (!found.has(pageTitle)) {
          found.set(pageTitle, `https://en.wikipedia.org/wiki/${match[1]}`);
        }
      }
      annotations = Array.from(found, ([title, url]) => ({ title, url }));
      console.log("[WIKIFY API] Extracted annotations:", annotations);
    } else {
      console.warn("[WIKIFY API] No annotations or wikifiedHTML found in response.");
    }

    // Limit to only the top 6 annotations.
    const limitedAnnotations = annotations.slice(0, 6);
    console.log("[WIKIFY API] Returning limited annotations:", limitedAnnotations);

    return NextResponse.json({ annotations: limitedAnnotations });
  } catch (error) {
    console.error("[WIKIFY API] Internal error processing wikification:", error);
    return NextResponse.json(
      { error: "Internal error processing wikification." },
      { status: 500 }
    );
  }
}

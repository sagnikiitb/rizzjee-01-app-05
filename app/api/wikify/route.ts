import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json(
        { error: "Missing text in request body" },
        { status: 400 }
      );
    }

    const userKey = process.env.WIKIFIER_USER_KEY;
    if (!userKey) {
      return NextResponse.json(
        { error: "WIKIFIER_USER_KEY not set in environment variables" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.append("userKey", userKey);
    params.append("text", text);
    params.append("lang", "en");
    params.append("pageRankSqThreshold", "0.5");
    params.append("applyPageRankSqThreshold", "true");
    params.append("nTopDfValuesToIgnore", "100");
    params.append("nWordsToIgnoreFromList", "200");

    // Call Wikifier API to get annotations
    const wikifierUrl = `https://www.wikifier.org/annotate-article?${params.toString()}`;
    const response = await fetch(wikifierUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Wikifier API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Assume the Wikifier API returns an object with a property "annotations"
    // which is an array of annotation objects.
    // If not provided by default, we attempt to extract keywords from "wikifiedHTML".
    let annotations = [];
    if (data.annotations && Array.isArray(data.annotations)) {
      annotations = data.annotations;
    } else if (data.wikifiedHTML) {
      // Fallback: extract all Wikipedia links from wikifiedHTML using a regex.
      // This regex matches <a href="https://en.wikipedia.org/wiki/Some_Title" ...>Some Title</a>
      const regex = /<a[^>]+href="https:\/\/en\.wikipedia\.org\/wiki\/([^">]+)"[^>]*>([^<]+)<\/a>/g;
      const found = new Map<string, string>(); // Avoid duplicates
      let match;
      while ((match = regex.exec(data.wikifiedHTML)) !== null) {
        const pageTitle = decodeURIComponent(match[1].replace(/_/g, " "));
        if (!found.has(pageTitle)) {
          // Construct the full URL for consistency
          found.set(pageTitle, `https://en.wikipedia.org/wiki/${match[1]}`);
        }
      }
      annotations = Array.from(found, ([title, url]) => ({ title, url }));
    }

    // Return only the top 6 annotations as required.
    return NextResponse.json({
      annotations: annotations.slice(0, 6)
    });
  } catch (error) {
    console.error("Error in wikifier route:", error);
    return NextResponse.json(
      { error: "Internal error processing wikification." },
      { status: 500 }
    );
  }
}

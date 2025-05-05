import fetch from 'node-fetch';

/**
 * Sends the provided text to the Wikifier API and returns HTML with automatically
 * hyperlinked keywords.
 *
 * The Wikifier API is used to automatically detect and annotate keywords, linking
 * them to their corresponding Wikipedia pages.
 *
 * The parameters below have been fine-tuned to help limit keyword annotation to about
 * the top 5-6 relevant terms. You can adjust these if needed:
 * - pageRankSqThreshold: "0.5"
 * - applyPageRankSqThreshold: "true"
 * - nTopDfValuesToIgnore: "100"
 * - nWordsToIgnoreFromList: "200"
 *
 * Note: Ensure that the environment variable WIKIFIER_USER_KEY is properly set.
 *
 * @param text - The text content to be wikified.
 * @returns A Promise that resolves to the wikified HTML string.
 */
export async function wikifyText(text: string): Promise<string> {
  const endpoint = "https://www.wikifier.org/annotate-article";
  const userKey = "ckvptrewuhewnehyeswpsdamqyffrd";

  if (!userKey) {
    throw new Error("Wikifier userKey is not set in environment variables.");
  }
  
  const params = new URLSearchParams();
  params.append("userKey", userKey);
  params.append("text", text);
  params.append("lang", "en");
  // Parameters tuned for optimal keyword extraction
  params.append("pageRankSqThreshold", "0.5");
  params.append("applyPageRankSqThreshold", "true");
  params.append("nTopDfValuesToIgnore", "100");
  params.append("nWordsToIgnoreFromList", "200");

  const apiUrl = `${endpoint}?${params.toString()}`;
  try {
    const response = await fetch('/api/wikify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Internal Wikify API error: ${errorText}`);
    }
    
    const data = await response.json();
    return data.wikifiedHTML || text;
  } catch (error) {
    console.error('Wikifier API request failed:', error);
    throw new Error('Failed to wikify the provided text. See logs for details.');
  }
}

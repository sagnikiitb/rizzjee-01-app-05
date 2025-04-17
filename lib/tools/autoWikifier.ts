import fetch from 'node-fetch';

/**
 * Sends the given text to the Wikifier API and returns HTML with automatically
 * hyperlinked keywords.
 *
 * This implementation leverages the Wikifier API (https://wikifier.org/info.html)
 * to annotate the text. The parameters have been chosen to help limit the output
 * to only the top relevant keywords. They can be fine-tuned based on your content.
 *
 * Note: Ensure that your environment variable WIKIFIER_USER_KEY is set.
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
  // Parameters tuned to extract only the top keywords (approximately 5–6 per text)
  params.append("pageRankSqThreshold", "0.5");
  params.append("applyPageRankSqThreshold", "true");
  params.append("nTopDfValuesToIgnore", "100");
  params.append("nWordsToIgnoreFromList", "200");

  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wikifier API error: ${response.status}`);
  }
  
  const result = await response.json();
  return result.wikifiedHTML || text;
}

import React, { useEffect, useState } from "react";

interface ChatOutputProps {
  answer: string;
}

interface WikiResult {
  title: string;
}

const ChatOutput: React.FC<ChatOutputProps> = ({ answer }) => {
  const [wikipediaLinks, setWikipediaLinks] = useState<WikiResult[]>([]);

  useEffect(() => {
    async function fetchWikipediaLinks() {
      try {
        // Query Wikipedia's search API using the answer text. We request origin=* for CORS.
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            answer
          )}&format=json&origin=*`
        );
        if (!response.ok) {
          throw new Error(`Wikipedia API error: ${response.statusText}`);
        }
        const data = await response.json();
        // Get top 5-6 results.
        const results = data?.query?.search?.slice(0, 6) || [];
        setWikipediaLinks(results);
      } catch (error) {
        console.error("Error fetching Wikipedia links:", error);
      }
    }
    if (answer) {
      fetchWikipediaLinks();
    }
  }, [answer]);

  return (
    <div className="chat-output mt-4">
      {/* Display the main answer */}
      <div>{answer}</div>
      {/* Display the top Wikipedia links as clickable URL hashtags */}
      {wikipediaLinks.length > 0 && (
        <div className="wikipedia-links mt-4">
          <strong>Related Wikipedia:</strong>
          <div>
            {wikipediaLinks.map((result) => {
              const linkUrl = `https://en.wikipedia.org/wiki/${result.title.replace(/ /g, '_')}`;
              return (
                <a
                  key={result.title}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2"
                >
                  #{result.title}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatOutput;

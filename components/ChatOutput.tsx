import React, { useEffect, useState } from "react";

interface Annotation {
  title: string;
  url: string;
}

interface ChatOutputProps {
  answer: string;
}

const ChatOutput: React.FC<ChatOutputProps> = ({ answer }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState<string>("");

  // Simple hash function to uniquely identify an answer string.
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  useEffect(() => {
    const answerHash = hashCode(answer);
    const localStorageKey = `wiki-annotations-${answerHash}`;
    console.log("[ChatOutput] Checking localStorage for computed annotations with key:", localStorageKey);
    const stored = localStorage.getItem(localStorageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log("[ChatOutput] Found cached annotations in localStorage:", parsed);
          setAnnotations(parsed);
          return;
        }
      } catch (e) {
        console.error("[ChatOutput] Error parsing stored annotations:", e);
      }
    }

    // If not found in localStorage, call the /api/wikify endpoint once.
    (async () => {
      try {
        console.log("[ChatOutput] Fetching annotations for answer text via /api/wikify");
        const response = await fetch("/api/wikify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: answer }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Wikify API error: ${errorText}`);
        }
        const data = await response.json();
        console.log("[ChatOutput] Received data from /api/wikify:", data);
        if (data.annotations && Array.isArray(data.annotations)) {
          const computedAnnotations = data.annotations.slice(0, 6);
          console.log("[ChatOutput] Computed annotations:", computedAnnotations);
          setAnnotations(computedAnnotations);
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(computedAnnotations));
            console.log("[ChatOutput] Cached annotations in localStorage with key:", localStorageKey);
          } catch (e) {
            console.error("[ChatOutput] Failed to store annotations in localStorage:", e);
          }
        } else {
          console.warn("[ChatOutput] No annotations found in API response.");
          setAnnotations([]);
        }
      } catch (err: any) {
        console.error("[ChatOutput] Error while fetching annotations:", err);
        setError("Unable to retrieve Wikipedia keywords.");
      }
    })();
  }, [answer]);

  return (
    <div className="chat-output mt-4">
      {error ? (
        <div className="error-message text-red-500">{error}</div>
      ) : (
        <div className="wikipedia-keywords">
          {annotations.map((annotation) => (
            <a
              key={annotation.title}
              href={annotation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 text-blue-500 underline"
            >
              #{annotation.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatOutput;

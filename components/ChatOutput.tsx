import React, { useEffect, useState } from "react";

interface Annotation {
  title: string;
  url: string;
}

interface ChatOutputProps {
  answer: string;
}

const ChatOutput: React.FC<ChatOutputProps> = ({ answer }) => {
  // This state will hold the top 5-6 annotations (keywords with URLs)
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        // Call our wikifier API route which is expected to return a JSON object
        // with an "annotations" array containing { title, url } objects.
        const response = await fetch("/api/wikify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: answer }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Wikify API error: ${errorText}`);
        }
        const data = await response.json();
        if (data.annotations && Array.isArray(data.annotations)) {
          // Limit to top 5-6 annotations.
          setAnnotations(data.annotations.slice(0, 6));
        } else {
          // If no annotations provided, clear any previous ones.
          setAnnotations([]);
        }
      } catch (err: any) {
        console.error("Wikifier error:", err);
        setError("Unable to retrieve Wikipedia keywords.");
        setAnnotations([]);
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

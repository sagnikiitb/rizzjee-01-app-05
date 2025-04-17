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

  useEffect(() => {
    (async () => {
      try {
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
        // Expecting annotations array in the JSON output, limit to 5-6 items.
        if (data.annotations && Array.isArray(data.annotations)) {
          setAnnotations(data.annotations.slice(0, 6));
        } else {
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

import React, { useEffect, useState } from "react";

interface Annotation {
  title: string;
  url: string;
}

interface ChatOutputProps {
  // The full assistant message object which may have been augmented with annotations.
  message: { role: string; content: string; annotations?: Annotation[] };
  messages: any[];
  setMessages: (messages: any[]) => void;
}

const ChatOutput: React.FC<ChatOutputProps> = ({ message, messages, setMessages }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // If annotations are already computed and stored in the message, use them.
    if (message.annotations && message.annotations.length > 0) {
      console.log("[ChatOutput] Using existing annotations from message.");
      setAnnotations(message.annotations);
      return;
    }

    // Otherwise, call /api/wikify only once to compute annotations.
    (async () => {
      try {
        console.log("[ChatOutput] Fetching annotations for the complete assistant message.");
        const response = await fetch("/api/wikify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: message.content }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Wikify API error: ${errorText}`);
        }
        const data = await response.json();
        if (data.annotations && Array.isArray(data.annotations)) {
          const computedAnnotations = data.annotations.slice(0, 6);
          console.log("[ChatOutput] Received annotations:", computedAnnotations);
          setAnnotations(computedAnnotations);
          // Update the engine's conversation history so that the annotations are saved persistently.
          const updatedMessages = messages.map((msg) => {
            if (msg === message) {
              return { ...msg, annotations: computedAnnotations };
            }
            return msg;
          });
          setMessages(updatedMessages);
        } else {
          console.warn("[ChatOutput] No annotations found in API response.");
          setAnnotations([]);
        }
      } catch (err: any) {
        console.error("[ChatOutput] Wikifier error:", err);
        setError("Unable to retrieve Wikipedia keywords.");
      }
    })();
  }, [message, messages, setMessages]);

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

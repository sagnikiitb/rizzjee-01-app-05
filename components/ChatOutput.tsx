import React, { useEffect, useState } from "react";

interface ChatOutputProps {
  answer: string;
}

const ChatOutput: React.FC<ChatOutputProps> = ({ answer }) => {
  const [wikifiedAnswer, setWikifiedAnswer] = useState<string>(answer);
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
        if (data.wikifiedHTML && data.wikifiedHTML !== wikifiedAnswer) {
          setWikifiedAnswer(data.wikifiedHTML);
        }
      } catch (err: any) {
        console.error("Wikifier error:", err);
        setError("Unable to process wikification.");
        setWikifiedAnswer(answer);
      }
    })();
  }, [answer]);

  return (
    <div className="chat-output mt-4">
      {error && <div className="error-message text-red-500">{error}</div>}
      <div dangerouslySetInnerHTML={{ __html: wikifiedAnswer }} />
    </div>
  );
};

export default ChatOutput;

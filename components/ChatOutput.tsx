import React, { useEffect, useState } from "react"
import { wikifyText } from "@/lib/tools/autoWikifier"

interface ChatOutputProps {
  answer: string
}

const ChatOutput: React.FC<ChatOutputProps> = ({ answer }) => {
  const [wikifiedAnswer, setWikifiedAnswer] = useState<string>(answer)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // When the answer prop changes, fetch the wikified content.
    (async () => {
      try {
        const wikified = await wikifyText(answer)
        // Only update state if the result differs from the current state.
        if (wikified !== wikifiedAnswer) {
          setWikifiedAnswer(wikified)
        }
      } catch (err: any) {
        console.error("Wikifier error:", err)
        setError("Unable to process wikification.")
        // Optionally reset to original answer.
        setWikifiedAnswer(answer)
      }
    })()
  }, [answer]) // Only re-run when `answer` changes

  return (
    <div className="chat-output mt-4">
      {error && <div className="error-message text-red-500">{error}</div>}
      <div dangerouslySetInnerHTML={{ __html: wikifiedAnswer }} />
    </div>
  )
}

export default ChatOutput

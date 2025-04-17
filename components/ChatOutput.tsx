import React, { useEffect, useState } from "react"
import { wikifyText } from "@/lib/tools/autoWikifier"

interface ChatOutputProps {
  answer: string
}

const ChatOutput: React.FC<ChatOutputProps> = ({ answer }) => {
  const [wikifiedAnswer, setWikifiedAnswer] = useState<string>(answer)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    (async () => {
      try {
        const wikified = await wikifyText(answer)
        setWikifiedAnswer(wikified)
      } catch (err: any) {
        console.error("Wikifier error:", err)
        setError("Unable to process wikification.")
        setWikifiedAnswer(answer)
      }
    })()
  }, [answer])

  return (
    <div className="chat-output mt-4">
      {error && <div className="error-message text-red-500">{error}</div>}
      <div dangerouslySetInnerHTML={{ __html: wikifiedAnswer }} />
    </div>
  )
}

export default ChatOutput

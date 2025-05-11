import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const exampleMessages = [
  {
    heading: 'What is the best strategy to solve complex Physics problems?',
    message: 'What is the best strategy to solve complex Physics problems?'
  },
  {
    heading: 'Which books and resources are best for STEM and JEE preparation?',
    message: 'Which books and resources are best for STEM and JEE preparation?'
  },
  {
    heading: 'What is the smartest scientific way to manage my daily study schedule?',
    message: 'What is the smartest scientific way to manage my daily study schedule?'
  },
  {
    heading: 'What are the most common technical mistakes to avoid in the JEE exam?',
    message: 'What are the most common technical mistakes to avoid in the JEE exam?'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-2 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

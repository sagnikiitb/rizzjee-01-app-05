'use client'

import { Button } from '@/components/ui/button'
import { Mistral } from '@mistralai/mistralai'
import { Paperclip } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

// Create a page component with OCR functionality
export default function OcrPage() {
  const [uploading, setUploading] = useState(false)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Opens the file picker dialog
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Clear any previous selection
      fileInputRef.current.click()
    }
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // The result contains the data URL with format prefix (like "data:application/pdf;base64,")
        // We'll use the full data URL as required by the Mistral API
        const base64String = reader.result as string
        resolve(base64String)
      }
      reader.onerror = error => {
        reject(error)
      }
    })
  }

  // Handles the OCR submission when a file is selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Start uploading
    setUploading(true)
    setOcrText(null)

    try {
      // Validate file type
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf'
      ]
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a PDF or image file (JPEG/PNG).')
      }

      // Validate file size (e.g., 10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_SIZE) {
        throw new Error('File too large. Maximum size is 10MB.')
      }

      // Get API key
      const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY
      if (!apiKey) {
        throw new Error(
          'Mistral API key not found. Set NEXT_PUBLIC_MISTRAL_API_KEY in your .env file.'
        )
      }

      // Convert file to base64 data URL
      const dataUrl = await fileToBase64(file)

      // Create Mistral client
      const client = new Mistral({ apiKey })

      // Process OCR directly using the Mistral client
      const ocrResponse = await client.ocr.process({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          documentUrl: dataUrl // This already includes the "data:application/pdf;base64," prefix
        },
        includeImageBase64: false // Set to true if you want the image data in the response
      })

      // Set extracted text
      setOcrText(ocrResponse.pages[0].markdown)
      console.log('OCR Response:', ocrResponse)
      toast.success('Document successfully processed!')
    } catch (error) {
      console.error('Error during OCR processing:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to process document'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">OCR Document Scanner</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="mb-4 text-gray-600">
          Upload an image or PDF document to extract text using OCR.
        </p>
        <div className="flex justify-center mb-6">
          <Button
            type="button"
            className="flex items-center gap-2"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <Paperclip size={20} />
            {uploading ? 'Processing...' : 'Upload Document'}
          </Button>
          <input
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {ocrText && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Extracted Text:</h2>
            <div className="bg-gray-50 p-4 rounded border max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{ocrText}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

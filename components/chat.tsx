'use client' //Tells this component is client-side ONLY in Next.js syntax

import { CHAT_ID } from '@/lib/constants' //@ refers to root project dir, that is, 'rizzjee-01-app-05/'
//Import  CHAT_ID type definition from constants
import { Model } from '@/lib/types/models'
//Import Model type definition
import { Message, useChat } from 'ai/react' // 'ai' is an external npm module in package.json : "ai": "^4.1.61"
// Import Message type and useChat hook from Vercel's AI SDK
import { toast } from 'sonner' //'sonner' is also an external npm module in package.json. https://emilkowal.ski/ui/building-a-toast-component  
// Import toast notifications
import { ChatMessages } from './chat-messages' // . refers to loacl relative dir; 'rizzjee-01-app-05/components/'
// Import chat messages DISPLAY component
import { ChatPanel } from './chat-panel' // Import chat INPUT panel component
import { useEffect, useCallback, useRef } from 'react' // Import React hooks

/**
 * Main Chat component that handles chat functionality and UI
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the chat session
 * @param {Message[]} props.savedMessages - Previously saved messages to initialize chat with
 * @param {string} props.query - Initial query to populate chat input
 * @param {Model[]} props.models - Available chat models
 */

export function Chat({
  id, // Define just the names of all the props/arguments
  savedMessages = [], // Default to empty array if no saved messages
  query,
  models
}: {
  id: string //Define the types of the named props here
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  // Create a ref to track database initialization status
  // useRef prevents unnecessary re-renders and persists across component renders
  const dbInitialized = useRef(false) //useRef, useState are hooks. useRef returns a mutable pointer/reference to object (call by reference); useState returns an entire copy (call by value)
  //useRef saves memory, time and compute; and makes sure the UI is not re-rendered everytime the object is modified
  //useRef returns just one attribute/property of the obejct called 'current' One can only modify through <object>.current syntax, this ensures code safety
  //'false' just means right now the reference pointer is NULL
  const currentUser = 'sagnikiitb'
  
  // Initialize database on first load
  
  /**
   * Effect hook to initialize the database on component first load
   * Makes an API call to /api/init-db and handles any errors
   */
  useEffect(() => {
    const initDatabase = async () => {
      if (dbInitialized.current) return  // Prevent multiple initializations
      
      try {
        const response = await fetch('/api/init-db') //fetch from /api/init-db PORT
        //basically connects with my Prisma db
        if (!response.ok) {
          throw new Error('Failed to initialize database') //if no db, then get PORT error
        }
        dbInitialized.current = true //if db there, set the pointer to 'true',that is not-null
        // abhi bhi, the pointer is not pointing to the prisma db yet
        // we just PINGED (POST Req) the endpoint of the db to confirm if it at all exists or not
      } catch (error) {
        console.error('Database initialization failed:', error)
        toast.error('Failed to initialize chat system')
      }
    }

    initDatabase() //calls the initDatabase pointer object constructor
  }, []) //for now, point initDatabase to a empty array
  // Empty dependency array means this runs once on mount
  /**
   * Initialize chat functionality using the useChat hook from Vercel's AI SDK
   * This provides core chat functionality including message management and API communication
   */

  const {
    messages, // Array of chat messages
    input, // Current input value
    handleInputChange, // Handler for input changes
    handleSubmit, // Handler for form submission
    isLoading, // Loading state indicator
    setMessages,  // Function to update messages
    stop,   // Function to stop message generation
    append, // Function to append new messages
    data, // Additional data from chat
    setData // Function to update additional data
    //Defines the names of the props
  } = useChat({
    //And this defines the types of the named props
    initialMessages: savedMessages, //variable 'initialMessages' is of type 'savedMessages'
    id: CHAT_ID, //variable 'id' is of type 'CHAT_ID'
    body: {
      id //Define a "type-of-types" defined as 'body' which is a collection of only one type defined as 'id'
    },
    onFinish: async (message) => {
      // Update URL and save messages when chat response finishes
      // This is also a prop, this is a prop function!
      // To be more precise, this is the template/boilerplate definition of a prop function
      // of function type "onFinish" which is
      // an async callback function that takes in a parameter named 'message' 
      window.history.replaceState({}, '', `/search/${id}`)
      //window.history.replaceState() updates the browser's URL
        //without creating a new entry in the history (so the back button won't go to the previous URL)
      await saveMessages([...messages, message])
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    }
  })

  const saveMessages = useCallback(async (messagesToSave: Message[]) => {
    try {
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          messages: messagesToSave,
          timestamp: new Date().toISOString(),
          user: currentUser
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        if (data.code === 'DB_NOT_INITIALIZED') {
          await fetch('/api/init-db')
          return await saveMessages(messagesToSave)
        }
        throw new Error(data.error || 'Failed to save messages')
      }
    } catch (error) {
      console.error('Error saving messages:', error)
      toast.error('Failed to save chat messages')
    }
  }, [id])

  // Save messages when component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        saveMessages(messages)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (messages.length > 0) {
        handleBeforeUnload()
      }
    }
  }, [messages, saveMessages])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  return (
    <div className="flex flex-col w-full max-w-3xl pt-14 pb-40 mx-auto stretch">
      <ChatMessages
        messages={messages}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
      />
      <ChatPanel
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        stop={stop}
        query={query}
        append={append}
        models={models}
      />
    </div>
  )
}

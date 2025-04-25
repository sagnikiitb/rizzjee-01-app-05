'use client' //Tells this component is client-side ONLY in Next.js syntax

import { CHAT_ID } from '@/lib/constants' //@ refers to root project dir, that is, 'rizzjee-01-app-05/'
//Import  CHAT_ID constant from constants
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
  // Define just the names of all the props/arguments
  
  id, 
  savedMessages = [], // Default to empty array if no saved messages
  query,
  models
}: {
//Define the types of the named props here
  
  id: string  // 'id' is of type 'string' This is a compulsory param!
  savedMessages?: Message[] //The ? marks that the thing is optional
  //'savedMessages'  is an optional param of type 'Message[]' array
  query?: string // 'query' is an optional param of type 'string' 
  models?: Model[] //'models' is a optional param of type 'Model[]' array
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
  useEffect(() => { //'useEffect' is a sub arrow function inside main function 'Chat'
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
    // In the main Chat() function; 'id' is defined to be of type 'string'
    // Over here, in this subfunction, we  upgrade the type definition to be of type 'CHAT_ID'
    // This ensures more type safety and makes code more specific (perhaps?)
    body: {
      id //Define a "type-of-types"/ kind of like C++ structs. We name it "body"
      // It has only one param, called "id" of type CHAT_ID
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
      /**
      * window.history.replaceState(<1st param>={},<2nd param>= '',<3rd param>= `/search/${id}`)
      * <1st param> = {} (State Object)
      * This is a JavaScript object that contains data you want to associate with the new history entry
      * In this case, it's an empty object {} for now
      * You can use this to store any serializable data that you might want to access later
      * <2nd param> = '' (Title)
      * This is the title parameter, which is currently unused in most browsers
      * It's typically passed as an empty string '' as browsers ignore it for security reasons
      * <3rd param> = /search/${id} (URL):
      * This is the new URL you want to show in the browser's address bar
      * Uses template literal syntax to create a dynamic URL
      * ${id} is a variable interpolation that gets replaced with the actual value of id
      * That is, ${id} is the Stringify'ed version of the variable 'id' of type 'CHAT_ID
      */
      await saveMessages([...messages, message])
      // await saveMessages([...messages, message]) saves all existing messages plus the new message
      // This weird syntax is called the "Spread" operator 
    //The [...messages, message] syntax uses the spread operator to create a new array
      //with all existing messages plus the new one
      /**
      * Remember this type definition at the beginning of useEffect() ?
      * const {
      * messages, // Array of chat messages 
      * .. rest of code }
      */

      //This syntax is just saying ki 'messages' waali array pe ek aur message variable add karo

    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`) //if error, then throw notification
    }
  })
  // A Toast is just a small notification/error message which is non-intrusive, that is,
  // doesn't hinder the main flow of the program


  
  /**
   * Function to save messages to the backend
   * Uses useCallback to memoize the function (fancy word: pointer waali thing basically)
   * and prevent unnecessary re-renders
   * @param {Message[]} messagesToSave - Array of messages to be saved
   */
  const saveMessages = useCallback(async (messagesToSave: Message[]) => {
    try {
      const response = await fetch('/api/chat/save', { //POST req to '/api/chat/save' URL/endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', //tell ki what you're about to POST is going to be a JSON file
        },
        body: JSON.stringify({ //Define the structure of the JSON file
          chatId: id, //Variable 'chatId' in this going-to-be-posted JSON file is  'id'
          // 'id' itself is of type 'CHAT_ID'
          //BE VERY CAREFUL, PAUSE, READ ABOVE AGAIN!
          //Type of types is a very real thing in Typescript
          messages: messagesToSave, //
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

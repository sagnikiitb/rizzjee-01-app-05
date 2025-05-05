# Understanding Promises in TypeScript

TypeScript Promises provide a powerful way to work with asynchronous operations. This document explores Promises in TypeScript using examples from this repository to demonstrate real-world applications.

## Table of Contents

1. [Introduction to Promises](#introduction-to-promises)
2. [Promise Syntax in TypeScript](#promise-syntax-in-typescript)
3. [Async/Await Pattern](#asyncawait-pattern)
4. [Error Handling with Promises](#error-handling-with-promises)
5. [Common Promise Patterns](#common-promise-patterns)
6. [Promise Chaining](#promise-chaining)
7. [Promise.all and Parallel Operations](#promiseall-and-parallel-operations)
8. [TypeScript-specific Promise Features](#typescript-specific-promise-features)
9. [Best Practices](#best-practices)
10. [Advanced Topics](#advanced-topics)

## Introduction to Promises

Promises in TypeScript represent asynchronous operations that will complete in the future. They provide a cleaner alternative to callback-based approaches, making asynchronous code more readable and manageable.

A Promise is an object that represents a value that might not be available yet but will be resolved at some point in the future, or rejected with a reason (error).

## Promise Syntax in TypeScript

### Basic Promise Type Declaration

In TypeScript, Promises are generic types that specify the type of value they will resolve to:

```typescript
// A Promise that resolves to a SearchResults object
function search(query: string): Promise<SearchResults> {
  // Implementation...
}

// A Promise that resolves to an array of Chat objects
async function getChats(userId?: string | null): Promise<Chat[]> {
  // Implementation...
}
```

### Creating Promises

Though rarely needed directly (as most APIs return Promises already), you can create new Promises:

```typescript
function customFetch(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        if (response.ok) {
          resolve(response);
        } else {
          reject(new Error(`HTTP error: ${response.status}`));
        }
      })
      .catch(error => reject(error));
  });
}
```

## Async/Await Pattern

The async/await pattern is a syntactic sugar over Promises that makes asynchronous code look and behave more like synchronous code. This repository extensively uses async/await.

### Example from lib/tools/search.ts:

```typescript
// Declaring an async function with Promise<SearchResults> return type
export async function search(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  return searchTool.execute(
    {
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    },
    {
      toolCallId: 'search',
      messages: []
    }
  )
}

// Using async/await to handle Promise resolution
async function searxngSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiUrl = process.env.SEARXNG_API_URL
  if (!apiUrl) {
    throw new Error('SEARXNG_API_URL is not set in the environment variables')
  }

  try {
    // Construct the URL with query parameters
    const url = new URL(`${apiUrl}/search`)
    // ... parameter setup ...

    // Await the fetch Promise
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SearXNG API error (${response.status}):`, errorText)
      throw new Error(
        `SearXNG API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    // Await the JSON parsing Promise
    const data: SearXNGResponse = await response.json()

    // ... process and return results ...
  } catch (error) {
    console.error('SearXNG API error:', error)
    throw error
  }
}
```

## Error Handling with Promises

### Try/Catch with Async/Await

The repository uses try/catch blocks with async/await for elegant error handling:

```typescript
// From lib/actions/chat.ts
export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const redis = await getRedis()
    const chats = await redis.zrange(getUserChatKey(userId), 0, -1, {
      rev: true
    })

    // ... further processing ...

    return results
      .filter((result): result is Record<string, any> => {
        // ... filtering logic ...
      })
      .map(chat => {
        // ... mapping logic ...
      })
  } catch (error) {
    return [] // Gracefully handle errors
  }
}
```

### Promise Catch Method

When not using async/await, the `.catch()` method handles Promise rejections:

```typescript
fetchData()
  .then(data => processData(data))
  .catch(error => {
    console.error('Error fetching data:', error)
    return fallbackData // Provide fallback data
  })
```

## Common Promise Patterns

### Sequential Async Operations

From lib/tools/search.ts - multiple await calls in sequence:

```typescript
// From tavilySearch function
const response = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    api_key: apiKey,
    query,
    // ... other parameters ...
  })
})

if (!response.ok) {
  throw new Error(
    `Tavily API error: ${response.status} ${response.statusText}`
  )
}

// After the first await completes, proceed to the next operation
const data = await response.json()
```

### Conditional Promise Execution

The repository uses conditional execution based on configuration:

```typescript
// From lib/tools/search.ts
try {
  if (searchAPI === 'searxng' && effectiveSearchDepth === 'advanced') {
    // API route for advanced SearXNG search
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/advanced-search`, {
      // ... request details ...
    })
    if (!response.ok) {
      throw new Error(
        `Advanced search API error: ${response.status} ${response.statusText}`
      )
    }
    searchResult = await response.json()
  } else {
    searchResult = await (searchAPI === 'tavily'
      ? tavilySearch
      : searchAPI === 'exa'
      ? exaSearch
      : searxngSearch)(
      filledQuery,
      max_results,
      effectiveSearchDepth === 'advanced' ? 'advanced' : 'basic',
      include_domains,
      exclude_domains
    )
  }
} catch (error) {
  console.error('Search API error:', error)
  searchResult = {
    results: [],
    query: filledQuery,
    images: [],
    number_of_results: 0
  }
}
```

## Promise Chaining

Promise chaining allows for sequential operations where each step depends on the previous one.

```typescript
// Example of Promise chaining from lib/streaming/tool-execution.ts
// Generate tool selection using XML format
const toolSelectionResponse = await generateText({
  model: getModel(model),
  system: `You are an intelligent assistant...`,
  messages: coreMessages
})

// Parse the tool selection XML using the search schema
const toolCall = parseToolCallXml(toolSelectionResponse.text, searchSchema)

if (!toolCall || toolCall.tool === '') {
  return { toolCallDataAnnotation: null, toolCallMessages: [] }
}

// ... set up tool call annotation ...

// Support for search tool only for now
const searchResults = await search(
  toolCall.parameters?.query ?? '',
  toolCall.parameters?.max_results,
  toolCall.parameters?.search_depth as 'basic' | 'advanced',
  toolCall.parameters?.include_domains ?? [],
  toolCall.parameters?.exclude_domains ?? []
)

// ... further processing with the search results ...
```

## Promise.all and Parallel Operations

`Promise.all` executes multiple Promises concurrently and waits for all to complete. This is useful for operations that can run in parallel.

Example from lib/actions/chat.ts:

```typescript
// From getChats function
const results = await Promise.all(
  chats.map(async chatKey => {
    const chat = await redis.hgetall(chatKey)
    return chat
  })
)
```

## TypeScript-specific Promise Features

### Generic Type Parameters

TypeScript's Promise implementation uses generics to specify the resolved value type:

```typescript
// Promise<SearchResults> specifies that this function returns a Promise
// that will resolve to a SearchResults object
export async function search(
  query: string,
  // ... other parameters ...
): Promise<SearchResults> {
  // Implementation...
}
```

### Union Types with Promises

TypeScript allows for union types with Promises, enabling flexible return types:

```typescript
// A function that might return data or null
async function getChat(id: string): Promise<Chat | null> {
  // Implementation...
}
```

### Type Guards with Promises

The codebase uses type guards to narrow down Promise results:

```typescript
// From lib/actions/chat.ts
return results
  .filter((result): result is Record<string, any> => {
    if (result === null || Object.keys(result).length === 0) {
      return false
    }
    return true
  })
  .map(chat => {
    // Now TypeScript knows that result is Record<string, any>
    const plainChat = { ...chat }
    // ... further processing ...
    return plainChat as Chat
  })
```

## Best Practices

### Always Specify Return Types

```typescript
// Good practice - return type is explicitly specified
async function getRedis(): Promise<RedisWrapper> {
  return await getRedisClient()
}

// Avoid - implicit return type
async function getRedis() {
  return await getRedisClient()
}
```

### Handle Errors Appropriately

```typescript
// From lib/tools/search.ts
try {
  // Attempt async operations
  // ...
} catch (error) {
  // Log the error
  console.error('Search API error:', error)
  // Provide sensible defaults
  searchResult = {
    results: [],
    query: filledQuery,
    images: [],
    number_of_results: 0
  }
}
```

### Avoid Unnecessary async/await

```typescript
// Unnecessary await - adding an extra Promise cycle
async function unnecessaryExample() {
  return await someOtherAsyncFunction()
}

// Better - directly return the Promise
async function betterExample() {
  return someOtherAsyncFunction()
}
```

### Clean Up Resources

Ensure resources are properly released, especially in error scenarios:

```typescript
async function exampleWithCleanup() {
  let connection = null
  try {
    connection = await getConnection()
    return await connection.query(...)
  } catch (error) {
    console.error('Query error:', error)
    throw error
  } finally {
    // Always close the connection, even if an error occurred
    if (connection) {
      await connection.close()
    }
  }
}
```

## Advanced Topics

### Cancellation

While JavaScript Promises don't natively support cancellation, you can implement abort controller patterns:

```typescript
async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const { signal } = controller
  
  // Set timeout to abort
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, { signal })
    clearTimeout(timeout)
    return await response.json()
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}
```

### Promise Queuing and Throttling

For APIs with rate limits, implement queuing:

```typescript
class RequestQueue {
  private queue: (() => Promise<any>)[] = []
  private processing = false
  private rateLimit = 1000 // ms between requests
  
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      if (!this.processing) {
        this.processQueue()
      }
    })
  }
  
  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }
    
    this.processing = true
    const request = this.queue.shift()!
    
    try {
      await request()
    } catch (error) {
      console.error('Queue processing error:', error)
    }
    
    // Wait for rate limit
    await new Promise(resolve => setTimeout(resolve, this.rateLimit))
    
    // Process next item
    this.processQueue()
  }
}
```

### Testing Promises

When testing async code, use frameworks that support Promise-based assertions:

```typescript
// Example using Jest
test('search returns results', async () => {
  const results = await search('TypeScript', 5)
  expect(results.query).toBe('TypeScript')
  expect(results.results.length).toBeLessThanOrEqual(5)
})

// Testing error scenarios
test('search handles errors', async () => {
  await expect(search('', 5)).rejects.toThrow()
})
```

## Conclusion

Promises in TypeScript provide a powerful mechanism for handling asynchronous operations with type safety. This repository demonstrates many patterns and best practices for working with Promises efficiently.

By understanding these patterns and applying them appropriately, you can write clean, maintainable asynchronous code that takes full advantage of TypeScript's type system while avoiding common pitfalls.
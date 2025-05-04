# Search Types in TypeScript

This document explains the search-related types defined in `lib/types/index.ts` and illustrates their relationships.

## Type Relationships in TypeScript

Before diving into the specific types, let's understand three key relationship patterns in TypeScript:

### 1. Inheritance Relationships

In TypeScript, inheritance represents an "is-a" relationship, typically implemented using the `extends` keyword:

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}
```

Key characteristics:
- Dog "is an" Animal (+ more)
- The child type (Dog) includes all properties of the parent (Animal)
- Used with interfaces and classes
- Creates a strong coupling between types
- Follows the Liskov Substitution Principle - a Dog can be used wherever an Animal is expected

### 2. Extension Relationships

Extension represents a type transformation, typically using intersection types with the `&` operator:

```typescript
type CoreMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ExtendedMessage = Omit<CoreMessage, 'role'> & {
  role: CoreMessage['role'] | 'system';
  metadata?: any;
}
```

Key characteristics:
- Creates a new type that builds upon another
- Can selectively override properties from the original type
- More flexible than inheritance as it allows modifications
- Often used with utility types like `Omit<T, K>`, `Pick<T, K>`, etc.
- No runtime relationship, purely a compile-time concept

### 3. Composition Relationships

Composition represents a "has-a" relationship, where one type contains instances of another:

```typescript
interface SearchResults {
  items: SearchResultItem[];
  metadata: SearchMetadata;
}
```

Key characteristics:
- SearchResults "has" SearchResultItems
- Types reference each other but remain separate
- Creates loose coupling between types
- Promotes reusability and modularity
- Follows the principle of composition over inheritance

## Search Types Diagram

```
Search Types Diagram
===================

Basic Result Types:
-----------------
SearchResultItem   ────┐       ┌── SearXNGResult
  │                    │       │    title: string
  │ title: string      │       │    url: string
  │ url: string        │       │    content: string
  │ content: string    │       │    img_src?: string
  │                    │       │    publishedDate?: string
  │                    │       │    score?: number
  │                    │       │
  │               Related but independent result types
  │                    │       │
ExaSearchResultItem    │       │    SearXNGImageResult = string
  │                    │       │    
  │ score: number      │       │
  │ title: string      │       │
  │ id: string         │       │
  │ url: string        │       │
  │ publishedDate: Date│       │
  │ author: string     │       │
  │                    │       │
  │                    │       │
SerperSearchResultItem ┘       │
  │                            │
  │ title: string              │
  │ link: string               │
  │ snippet: string            │
  │ imageUrl: string           │
  │ duration: string           │
  │ source: string             │
  │ channel: string            │
  │ date: string               │
  │ position: number           │


Image Result Types:
-----------------
SearchResultImage
  │
  ├── string (URL only)
  │
  └── {
        url: string
        description: string
        number_of_results?: number
      }


Search Results Containers:
------------------------
                  ┌── uses ──┐
SearchResults     │          │     SearXNGSearchResults
  │              \/          \/      │
  │ images: SearchResultImage[]      │ images: SearXNGImageResult[]
  │ results: SearchResultItem[]      │ results: SearchResultItem[]  ─────┐
  │ number_of_results?: number       │ number_of_results?: number        │ Uses same result type
  │ query: string                    │ query: string                     │
  │                                                                      │
  │                                                                      │
  │                                  SearXNGResponse                     │
  │                                   │                                  │
  │                                   │ query: string                    │
  │                                   │ number_of_results: number        │
  │                                   │ results: SearXNGResult[]  ───────┘
  │                                                             Different result type 
  │
  │
ExaSearchResults                     SerperSearchResults    
  │                                   │                 
  │ results: ExaSearchResultItem[]    │ searchParameters: {
  │                                   │   q: string
                                      │   type: string
                                      │   engine: string
                                      │ }
                                      │ videos: SerperSearchResultItem[]
```

## Search Types Detailed Explanation

### Result Item Types

Four independent search result item types exist without inheritance relationships:

1. **`SearchResultItem`**: The basic generic search result
   ```typescript
   export type SearchResultItem = {
     title: string
     url: string
     content: string
   }
   ```

2. **`ExaSearchResultItem`**: Exa-specific result with additional metadata
   ```typescript
   export type ExaSearchResultItem = {
     score: number
     title: string
     id: string
     url: string
     publishedDate: Date
     author: string
   }
   ```

3. **`SerperSearchResultItem`**: Video-specific result structure
   ```typescript
   export type SerperSearchResultItem = {
     title: string
     link: string
     snippet: string
     imageUrl: string
     duration: string
     source: string
     channel: string
     date: string
     position: number
   }
   ```

4. **`SearXNGResult`**: SearXNG-specific result format
   ```typescript
   export interface SearXNGResult {
     title: string
     url: string
     content: string
     img_src?: string
     publishedDate?: string
     score?: number
   }
   ```

### Image Result Types

1. **`SearchResultImage`**: [[Kim/UnionTypes | Union type]] for flexible image representation
   ```typescript
   export type SearchResultImage =
     | string
     | {
         url: string
         description: string
         number_of_results?: number
       }
   ```

2. **`SearXNGImageResult`**: Simple string alias for SearXNG images
   ```typescript
   export type SearXNGImageResult = string
   ```

### Results Container Types

These types use composition to structure search results:

1. **`SearchResults`**: Generic results container
   ```typescript
   export type SearchResults = {
     images: SearchResultImage[]
     results: SearchResultItem[]
     number_of_results?: number
     query: string
   }
   ```

2. **`ExaSearchResults`**: Exa-specific results container
   ```typescript
   export type ExaSearchResults = {
     results: ExaSearchResultItem[]
   }
   ```

3. **`SerperSearchResults`**: Video search results container
   ```typescript
   export type SerperSearchResults = {
     searchParameters: {
       q: string
       type: string
       engine: string
     }
     videos: SerperSearchResultItem[]
   }
   ```

4. **`SearXNGSearchResults`**: SearXNG results in standard format
   ```typescript
   export type SearXNGSearchResults = {
     images: SearXNGImageResult[]
     results: SearchResultItem[]
     number_of_results?: number
     query: string
   }
   ```

5. **`SearXNGResponse`**: Alternative SearXNG response format
   ```typescript
   export interface SearXNGResponse {
     query: string
     number_of_results: number
     results: SearXNGResult[]
   }
   ```

## Key Insights

1. **Composition over Inheritance**: These types primarily use composition relationships rather than inheritance. For example, `SearchResults` contains arrays of `SearchResultItem` and `SearchResultImage`.

2. **Type Reuse**: Some types are reused across different result containers. For example, `SearchResultItem` is used in both `SearchResults` and `SearXNGSearchResults`.

3. **Provider-Specific Types**: Each search provider (SearXNG, Exa, Serper) has its own specialized result types that capture their unique response formats.

4. **Union Types for Flexibility**: `SearchResultImage` uses a union type to handle both simple string URLs and more complex object structures with descriptions.

5. **No Direct Inheritance**: Despite similarities between result types (e.g., `SearchResultItem` and `SearXNGResult` both have title, url, and content), they don't use inheritance relationships, maintaining independence between different provider implementations.
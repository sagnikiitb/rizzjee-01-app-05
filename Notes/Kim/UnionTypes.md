# Understanding TypeScript Union Types

Union types are one of TypeScript's most powerful features, allowing variables to hold values of multiple types. This document provides a comprehensive explanation of union types, with practical examples, best practices, and common pitfalls.

## Basic Syntax

A union type uses the vertical bar (`|`) to specify that a value can be one of several types:

```typescript
type StringOrNumber = string | number;

let value: StringOrNumber;
value = "hello";  // Valid
value = 42;       // Valid
value = true;     // Error: Type 'boolean' is not assignable to type 'StringOrNumber'
```

## Real-World Example

The following example from our codebase demonstrates a practical use of union types:

```typescript
// If include_images_description is true, the images will be an array of { url: string, description: string }
// Otherwise, the images will be an array of strings
export type SearchResultImage =
  | string
  | {
      url: string
      description: string
      number_of_results?: number
    }
```

This union type allows `SearchResultImage` to be either:
1. A simple string (representing an image URL)
2. An object with image metadata including URL, description, and optional result count

### Using the Union Type

```typescript
// Valid usage of the union type
const simpleImage: SearchResultImage = "https://example.com/image.jpg";

const detailedImage: SearchResultImage = {
  url: "https://example.com/image.jpg",
  description: "A beautiful landscape"
};

const detailedImageWithCount: SearchResultImage = {
  url: "https://example.com/image.jpg",
  description: "A beautiful landscape",
  number_of_results: 5
};
```

## Working with Union Types

### Type Guards

When working with union types, you need to check which type you're dealing with before using type-specific properties or methods:

```typescript
function processImage(image: SearchResultImage): string {
  // Type guard
  if (typeof image === "string") {
    // TypeScript knows image is a string here
    return `Processing image URL: ${image}`;
  } else {
    // TypeScript knows image is an object with url and description
    return `Processing image: ${image.url} - ${image.description}`;
  }
}
```

### Narrowing with Discriminated Unions

For more complex unions, use a "discriminant property" to distinguish between types:

```typescript
type Circle = {
  kind: "circle";
  radius: number;
};

type Rectangle = {
  kind: "rectangle";
  width: number;
  height: number;
};

type Shape = Circle | Rectangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // TypeScript knows shape is Circle here
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // TypeScript knows shape is Rectangle here
      return shape.width * shape.height;
  }
}
```

## Best Use Cases for Union Types

Union types excel in several scenarios:

1. **API Responses with Multiple Formats**: Like our `SearchResultImage` example where the API might return different data structures.

2. **Optional Properties vs Different Shapes**: Instead of making all properties optional, use a union to represent distinct states.

   ```typescript
   // Instead of this (harder to validate)
   type UserOptional = {
     id: number;
     name?: string;
     email?: string;
     guest?: boolean;
   };

   // Prefer this (clearer intent)
   type RegisteredUser = {
     id: number;
     name: string;
     email: string;
   };
   
   type GuestUser = {
     id: number;
     guest: true;
   };
   
   type User = RegisteredUser | GuestUser;
   ```

3. **Function Parameters with Multiple Valid Types**:

   ```typescript
   function formatValue(value: string | number | Date): string {
     if (typeof value === "string") return value;
     if (typeof value === "number") return value.toFixed(2);
     return value.toISOString();
   }
   ```

4. **State Management**: Representing different states of a component or process.

   ```typescript
   type LoadingState = { status: "loading" };
   type SuccessState = { status: "success"; data: any };
   type ErrorState = { status: "error"; error: Error };
   
   type State = LoadingState | SuccessState | ErrorState;
   ```

## Common Syntactical Errors

### 1. Accessing Properties Without Type Guards

```typescript
// WRONG - TypeScript error
function showImage(image: SearchResultImage) {
  console.log(image.url); // Error: Property 'url' does not exist on type 'string'
}

// CORRECT
function showImage(image: SearchResultImage) {
  if (typeof image === "string") {
    console.log(image); // image is a string URL
  } else {
    console.log(image.url); // image is an object with url
  }
}
```

### 2. Incomplete Type Guards

```typescript
// WRONG - Incomplete type checking
function processItem(item: string | number | boolean) {
  if (typeof item === "string") {
    return item.toUpperCase();
  } else {
    // Error: item could be number OR boolean here
    return item.toString(); // .toString() doesn't exist on all remaining types
  }
}

// CORRECT
function processItem(item: string | number | boolean) {
  if (typeof item === "string") {
    return item.toUpperCase();
  } else if (typeof item === "number") {
    return item.toString();
  } else {
    return item ? "true" : "false";
  }
}
```

### 3. Assigning Incompatible Types

```typescript
// WRONG
const image: SearchResultImage = { url: "https://example.com/image.jpg" };
// Error: Missing required property 'description'

// CORRECT
const image: SearchResultImage = { 
  url: "https://example.com/image.jpg", 
  description: "An example image" 
};
```

## Recommended Usage and Patterns

### 1. Using Type Predicates for Custom Type Guards

```typescript
function isDetailedImage(image: SearchResultImage): image is { url: string; description: string } {
  return typeof image !== "string";
}

function processImage(image: SearchResultImage) {
  if (isDetailedImage(image)) {
    // TypeScript knows image has url and description
    console.log(image.description);
  }
}
```

### 2. Exhaustiveness Checking

```typescript
type Status = "pending" | "processing" | "success" | "failed";

function processStatus(status: Status): string {
  switch (status) {
    case "pending":
      return "Waiting to start";
    case "processing":
      return "In progress";
    case "success":
      return "Completed successfully";
    case "failed":
      return "Error occurred";
    default: {
      // This ensures you handle all cases
      const exhaustiveCheck: never = status;
      return exhaustiveCheck;
    }
  }
}
```

### 3. Converting Between Union Variants

In our `SearchResultImage` example, the codebase normalizes the union type to a consistent format:

```typescript
function normalizeImages(images: SearchResultImage[]): { url: string; description: string }[] {
  return images.map(image => {
    if (typeof image === "string") {
      return {
        url: image,
        description: "" // Default empty description
      };
    }
    return image;
  });
}
```

### 4. Tagged/Discriminated Unions for Complex Cases

```typescript
type Success<T> = {
  type: "success";
  data: T;
};

type Failure = {
  type: "failure";
  error: Error;
};

type Result<T> = Success<T> | Failure;

function handleResult<T>(result: Result<T>): void {
  if (result.type === "success") {
    console.log(result.data);
  } else {
    console.error(result.error);
  }
}
```

## Advanced Applications

### 1. Conditional Types with Unions

```typescript
type Flatten<T> = T extends Array<infer U> ? U : T;

type StringOrNumberArray = string | number[];
type FlattenedType = Flatten<StringOrNumberArray>; // string | number
```

### 2. Mapped Types with Unions

```typescript
type Events = "click" | "hover" | "focus";
type EventHandlers = { [E in Events]: (event: E) => void };
```

### 3. Utility Types for Unions

```typescript
// Extract only object types from a union
type ExtractObjectTypes<T> = T extends object ? T : never;
type ObjectImageType = ExtractObjectTypes<SearchResultImage>; // Only the object variant
```

## Performance and Bundle Size Considerations

Union types have no runtime cost and exist purely for TypeScript's static type checking. They're compiled away during the build process.

However, code that handles different variants of union types (type guards, switch statements) will remain in your JavaScript output and can affect bundle size if you have complex handling logic.

## Further Reading

1. [TypeScript Handbook: Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
2. [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
3. [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
4. [Advanced TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
5. [TypeScript Deep Dive: Union Types](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
6. [Effective TypeScript: 62 Specific Ways to Improve Your TypeScript](https://effectivetypescript.com/) (Book by Dan Vanderkam)

## Conclusion

Union types offer a powerful way to model different shapes of data and handle multiple potential types safely. They provide flexibility while still maintaining type safety, making them one of TypeScript's most valuable features for building robust applications.

When used correctly—with proper type guards and exhaustiveness checking—union types help catch errors at compile time that would otherwise manifest as runtime bugs.
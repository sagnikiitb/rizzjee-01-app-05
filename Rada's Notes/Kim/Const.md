# The `const` Keyword in TypeScript

This document provides a comprehensive exploration of the `const` keyword in TypeScript, covering its various uses, behaviors, and best practices.

## Table of Contents

1. [Basic Variable Declaration](#basic-variable-declaration)
2. [The `const` Assertion](#the-const-assertion)
3. [Object Properties with `const`](#object-properties-with-const)
4. [`const` in Loops and Blocks](#const-in-loops-and-blocks)
5. [`const enum`](#const-enum)
6. [`const` Type Parameters](#const-type-parameters)
7. [`as const` with Template Literals](#as-const-with-template-literals)
8. [`declare const`](#declare-const)
9. [Best Practices](#best-practices)
10. [Common Errors](#common-errors)
11. [Advanced Usage](#advanced-usage)
12. [Further References](#further-references)

## Basic Variable Declaration

The most fundamental use of `const` is for declaring variables whose reference cannot be reassigned.

```typescript
const name = "Alice";
name = "Bob"; // Error: Cannot assign to 'name' because it is a constant.

// For objects and arrays, the reference is constant, not the contents
const user = { name: "Alice", age: 30 };
user.age = 31; // Valid - we're modifying a property, not reassigning the variable
user = { name: "Bob", age: 25 }; // Error - cannot reassign the constant
```

### Key Behaviors:

1. `const` variables must be initialized at declaration time.
2. `const` enforces that the variable binding (the reference) is immutable.
3. The actual value, especially for objects and arrays, remains mutable.
4. `const` has block scope, like `let`.

### Contrast with `let` and `var`:

```typescript
let letVar = 1;
letVar = 2; // Valid - let variables can be reassigned

var varVar = 1;
varVar = 2; // Valid - var variables can be reassigned
```

## The `const` Assertion

TypeScript 3.4 introduced `const` assertions with the `as const` syntax. This transforms:

1. Literal expressions to literal types
2. Array literals to readonly tuples
3. Object literals to readonly objects with literal property types

```typescript
// Without as const
const colors = ["red", "green", "blue"];
// Type is string[] - mutable array of strings

// With as const
const colorsConst = ["red", "green", "blue"] as const;
// Type is readonly ["red", "green", "blue"] - readonly tuple with literal types

// Object literals
const user = { name: "Alice", role: "admin" };
// Type is { name: string; role: string; }

const userConst = { name: "Alice", role: "admin" } as const;
// Type is { readonly name: "Alice"; readonly role: "admin"; }
```

### Key Behaviors:

1. Creates the most specific type possible from literal expressions.
2. Makes all properties and array elements readonly recursively.
3. Converts mutable arrays to readonly tuples.
4. Preserves literal types instead of widening them.

## Object Properties with `const`

While `const` prevents reassigning a variable, it doesn't make object properties immutable. To achieve immutable properties:

```typescript
// Readonly properties
interface User {
  readonly id: number;
  name: string;
}

const user: User = { id: 1, name: "Alice" };
user.name = "Bob"; // Valid
user.id = 2; // Error: Cannot assign to 'id' because it is a read-only property.

// Readonly objects
const userReadonly: Readonly<User> = { id: 1, name: "Alice" };
userReadonly.name = "Bob"; // Error: Cannot assign to 'name' because it is a read-only property.
```

### Using `Object.freeze()`:

```typescript
const frozenUser = Object.freeze({ id: 1, name: "Alice" });
frozenUser.name = "Bob"; // Runtime error in strict mode, silently fails otherwise
```

## `const` in Loops and Blocks

`const` can be used in loop declarations and block scopes:

```typescript
// Block scope
{
  const blockScoped = "only visible in this block";
}
// blockScoped is not accessible here

// For loops
for (const i of [1, 2, 3]) {
  console.log(i); // i is constant within each iteration
}

// For-in loops
const obj = { a: 1, b: 2 };
for (const key in obj) {
  // key is constant for each iteration
  console.log(`${key}: ${obj[key]}`);
}
```

For classic `for` loops, use `let` instead of `const` if you need to increment the counter:

```typescript
for (let i = 0; i < 10; i++) {
  // i must be a let, not const, because it changes
  console.log(i);
}
```

## `const enum`

TypeScript supports `const enum` declarations which are completely removed during compilation and replaced with their values:

```typescript
// Regular enum
enum Direction {
  North,
  East,
  South,
  West
}

// Const enum
const enum DirectionConst {
  North,
  East,
  South,
  West
}

const dir = Direction.North; // Compiles to: var dir = Direction.North;
const dirConst = DirectionConst.North; // Compiles to: var dirConst = 0;
```

### Key Behaviors:

1. `const enum` members are inlined at all usage sites.
2. No runtime object is created for a `const enum`.
3. More efficient than regular enums but can't be used in all scenarios.
4. Cannot be used with computed members unless the computed value is a compile-time constant.

## `const` Type Parameters

TypeScript 5.0 introduced `const` type parameters, allowing more precise inference for literal types:

```typescript
// Without const type parameter
function firstElement<T>(arr: T[]) {
  return arr[0];
}
const numbers = [1, 2, 3] as const;
const first = firstElement(numbers); 
// Type of first is number, not 1

// With const type parameter
function firstElementConst<const T>(arr: T[]) {
  return arr[0];
}
const firstConst = firstElementConst(numbers);
// Type of firstConst is 1
```

This feature helps retain literal types through generic function calls.

## `as const` with Template Literals

`as const` works well with template literal types:

```typescript
const base = "https://example.com" as const;
const endpoints = {
  users: `${base}/users`,
  posts: `${base}/posts`
} as const;

// Type of endpoints.users is "https://example.com/users"
// Not just string
```

## `declare const`

Used in declaration files (`.d.ts`) to declare constants that exist at runtime but without providing an implementation:

```typescript
// In a .d.ts file
declare const VERSION: string;
declare const CONFIG: {
  readonly apiUrl: string;
  readonly timeout: number;
};
```

## Best Practices

### 1. Prefer `const` by Default

Use `const` for all variable declarations unless you specifically need to reassign the variable. This enforces immutable bindings and makes your code more predictable.

### 2. Use `as const` for Literal Collections

When working with literal values that shouldn't change and should maintain their specific types:

```typescript
const PERMISSIONS = ["read", "write", "admin"] as const;
type Permission = typeof PERMISSIONS[number]; // "read" | "write" | "admin"
```

### 3. Combine with `readonly` for Immutable Data

```typescript
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly retries: readonly number[];
}
```

### 4. Use `const` Type Parameters for Generic Functions with Literal Types

```typescript
function createPair<const T, const U>(first: T, second: U) {
  return [first, second] as const;
}

const pair = createPair("hello", 42);
// Type is readonly ["hello", 42]
```

### 5. Use `const enum` for Performance-Critical Code

When working with enums in performance-sensitive code, prefer `const enum` for its optimized output.

## Common Errors

### 1. Mistaking `const` for Deep Immutability

```typescript
const user = { name: "Alice", preferences: { theme: "dark" } };
user.preferences.theme = "light"; // This works! const doesn't make object properties immutable
```

**Solution**: Use `as const`, `readonly`, or `Object.freeze()` for deeper immutability.

### 2. Forgetting to Initialize

```typescript
const username; // Error: 'const' declarations must be initialized.
```

**Solution**: Always initialize const variables at declaration time.

### 3. Shadowing Constants

```typescript
const MAX_ITEMS = 100;

function process() {
  const MAX_ITEMS = 200; // Shadows outer MAX_ITEMS, potential confusion
  // ...
}
```

**Solution**: Be aware of scope and avoid reusing constant names.

### 4. Using `const enum` with Module Transpilers

```typescript
// This may cause problems with certain bundlers or with --isolatedModules
const enum Status { Active, Inactive }
export { Status };
```

**Solution**: Use regular `enum` for exports or configure your tooling appropriately.

### 5. Misunderstanding Type Widening

```typescript
const id = 1; // Type is 1 (literal type)
let id = 1;   // Type is number (widened)
```

**Solution**: Use `as const` to preserve literal types where needed.

## Advanced Usage

### 1. Using `const` with Destructuring

```typescript
const { name, age } = person;
const [first, ...rest] = array;

// Nested destructuring
const { user: { id, role } } = response;
```

### 2. Recursive Readonly Types

For deep immutability, use recursive readonly types:

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object 
    ? DeepReadonly<T[P]> 
    : T[P]
};

const config: DeepReadonly<Config> = {
  server: {
    port: 8080,
    host: "localhost"
  },
  timeout: 5000
};
```

### 3. Using `const` with Discriminated Unions

```typescript
type Action = 
  | { readonly type: "INCREMENT"; readonly amount: number }
  | { readonly type: "DECREMENT"; readonly amount: number }
  | { readonly type: "RESET" };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "INCREMENT":
      return state + action.amount;
    case "DECREMENT":
      return state - action.amount;
    case "RESET":
      return 0;
  }
}

// Create action with as const
const incrementAction = { type: "INCREMENT", amount: 5 } as const;
```

### 4. Combining `const` Assertions with Mapped Types

```typescript
const httpMethods = ["GET", "POST", "PUT", "DELETE"] as const;
type HttpMethod = typeof httpMethods[number];

// Create a type with all HTTP methods as keys
type ApiDefinition = {
  [M in HttpMethod]: string[];
};

const api: ApiDefinition = {
  GET: ["/users", "/posts"],
  POST: ["/users", "/posts"],
  PUT: ["/users/:id", "/posts/:id"],
  DELETE: ["/users/:id", "/posts/:id"]
};
```

### 5. Using `const` with Conditional Types

```typescript
type ElementOf<T> = T extends ReadonlyArray<infer E> ? E : never;

const tuple = [1, "hello", true] as const;
type Elements = ElementOf<typeof tuple>; // 1 | "hello" | true
```

## Further References

1. [TypeScript Handbook: Basic Types](https://www.typescriptlang.org/docs/handbook/basic-types.html)
2. [TypeScript Handbook: Literal Types](https://www.typescriptlang.org/docs/handbook/literal-types.html)
3. [TypeScript Handbook: const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
4. [TypeScript Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
5. [TypeScript 5.0: const Type Parameters](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#const-type-parameters)
6. [TypeScript Deep Dive: Readonly](https://basarat.gitbook.io/typescript/type-system/readonly)
7. [TypeScript 4.9: Auto-accessors](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#auto-accessors-in-classes)
8. [MDN Web Docs: const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
9. [Effective TypeScript: 62 Specific Ways to Improve Your TypeScript](https://effectivetypescript.com/) (Book by Dan Vanderkam)

## Conclusion

The `const` keyword in TypeScript is a versatile tool that goes far beyond simple variable declarations. It can be used to create immutable bindings, precise literal types, optimized enums, and more. Understanding the various applications of `const` enables you to write more type-safe, predictable, and optimized TypeScript code.
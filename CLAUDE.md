# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `npm run build`
- Development server: `npm run dev --turbo`
- Lint: `npm run lint`
- Start: `npm run start`

## Code Style

### Formatting
- Use Prettier with config (semi: false, singleQuote: true, tabWidth: 2)
- LF line endings, no trailing commas
- Arrow functions with avoid parens: `x => x`, not `(x) => x`

### Imports
Follow this order in all files:
1. React imports
2. Next.js imports
3. Third-party modules
4. Types imports
5. Local imports (@/lib, @/components, etc.)
6. Relative imports (./)

### TypeScript
- Use strict type checking
- Prefer explicit return types on functions
- Use proper error handling with type guards

### Component Style
- Use functional components with hooks
- Follow naming conventions: PascalCase for components
- UI components in components/ui/ directory
- Use the cn() utility for className composition
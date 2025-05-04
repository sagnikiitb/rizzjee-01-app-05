# Repository Structure

This document provides a human-readable overview of the repository structure.

## Root Directory

- **CLAUDE.md** - Guidelines for Claude Code AI assistant
- **CODE_OF_CONDUCT.md** - Project code of conduct
- **CONTRIBUTING.md** - Contribution guidelines
- **Dockerfile** - Docker configuration for containerization
- **LICENSE** - Project license information
- **README.md** - Project overview and documentation
- **docker-compose.yaml** - Docker Compose configuration
- **middleware.ts** - Next.js middleware
- **next.config.mjs** - Next.js configuration
- **package.json** - NPM package configuration
- **postcss.config.mjs** - PostCSS configuration
- **prettier.config.js** - Prettier formatting configuration
- **searxng-limiter.toml** - SearXNG rate limiter configuration
- **searxng-settings.yml** - SearXNG search engine settings
- **tailwind.config.ts** - Tailwind CSS configuration
- **tsconfig.json** - TypeScript configuration

## App Directory (Next.js App Router)

- **app/**
  - **api/** - API routes
    - **advanced-search/route.ts** - Advanced search API endpoint
    - **chat/route.ts** - Chat API endpoint
  - **search/** - Search pages
    - **[id]/page.tsx** - Dynamic search result page
    - **page.tsx** - Search page
  - **share/** - Share pages
    - **[id]/page.tsx** - Dynamic share page
  - **favicon.ico** - Site favicon
  - **globals.css** - Global CSS styles
  - **layout.tsx** - Root layout component
  - **opengraph-image.png** - OpenGraph image for social sharing
  - **page.tsx** - Home page

## Components Directory

- **components/**
  - **ui/** - Reusable UI components
    - **alert-dialog.tsx** - Alert dialog component
    - **avatar.tsx** - Avatar component
    - **badge.tsx** - Badge component
    - **button.tsx** - Button component
    - **card.tsx** - Card component
    - **carousel.tsx** - Carousel component
    - **checkbox.tsx** - Checkbox component
    - **codeblock.tsx** - Code block component
    - **collapsible.tsx** - Collapsible component
    - **command.tsx** - Command component
    - **dialog.tsx** - Dialog component
    - **dropdown-menu.tsx** - Dropdown menu component
    - **icons.tsx** - Icon components
    - **input.tsx** - Input component
    - **label.tsx** - Label component
    - **markdown.tsx** - Markdown rendering component
    - **popover.tsx** - Popover component
    - **select.tsx** - Select component
    - **separator.tsx** - Separator component
    - **sheet.tsx** - Sheet component
    - **skeleton.tsx** - Skeleton loading component
    - **slider.tsx** - Slider component
    - **sonner.tsx** - Toast notification component
    - **spinner.tsx** - Loading spinner component
    - **status-indicator.tsx** - Status indicator component
    - **switch.tsx** - Switch component
    - **textarea.tsx** - Textarea component
    - **toggle.tsx** - Toggle component
    - **tooltip.tsx** - Tooltip component
  - **answer-section.tsx** - Answer section component
  - **chat-messages.tsx** - Chat messages component
  - **chat-panel.tsx** - Chat panel component
  - **chat-share.tsx** - Chat sharing component
  - **chat.tsx** - Main chat component
  - **clear-history.tsx** - Clear history component
  - **collapsible-message.tsx** - Collapsible message component
  - **custom-link.tsx** - Custom link component
  - **default-skeleton.tsx** - Default skeleton loader
  - **empty-screen.tsx** - Empty state screen
  - **footer.tsx** - Footer component
  - **header.tsx** - Header component
  - **history-container.tsx** - History container component
  - **history-item.tsx** - History item component
  - **history-list.tsx** - History list component
  - **history-skeleton.tsx** - History skeleton loader
  - **history.tsx** - History component
  - **message-actions.tsx** - Message actions component
  - **message.tsx** - Message component
  - **mode-toggle.tsx** - Mode toggle component
  - **model-selector.tsx** - Model selector component
  - **reasoning-section.tsx** - Reasoning section component
  - **related-questions.tsx** - Related questions component
  - **render-message.tsx** - Message rendering component
  - **retrieve-section.tsx** - Retrieve section component
  - **search-mode-toggle.tsx** - Search mode toggle component
  - **search-results-image.tsx** - Image search results component
  - **search-results.tsx** - Search results component
  - **search-section.tsx** - Search section component
  - **section.tsx** - Section component
  - **sidebar.tsx** - Sidebar component
  - **theme-provider.tsx** - Theme provider component
  - **tool-badge.tsx** - Tool badge component
  - **tool-section.tsx** - Tool section component
  - **user-message.tsx** - User message component
  - **video-search-results.tsx** - Video search results component
  - **video-search-section.tsx** - Video search section component

## Lib Directory

- **lib/**
  - **actions/** - Server actions
    - **chat.ts** - Chat actions
  - **agents/** - AI agent implementations
    - **generate-related-questions.ts** - Related questions generator
    - **manual-researcher.ts** - Manual researcher agent
    - **researcher.ts** - Researcher agent
  - **config/** - Configuration files
    - **default-models.json** - Default models configuration
    - **models.ts** - Models configuration
  - **constants/** - Constant values
    - **index.ts** - Constants index
  - **hooks/** - React hooks
    - **use-copy-to-clipboard.ts** - Copy to clipboard hook
  - **redis/** - Redis configuration
    - **config.ts** - Redis client configuration
  - **schema/** - Schema definitions
    - **related.tsx** - Related content schema
    - **retrieve.tsx** - Retrieve schema
    - **search.tsx** - Search schema
  - **streaming/** - Streaming functionality
    - **create-manual-tool-stream.ts** - Manual tool stream creator
    - **create-tool-calling-stream.ts** - Tool calling stream creator
    - **handle-stream-finish.ts** - Stream finish handler
    - **parse-tool-call.ts** - Tool call parser
    - **tool-execution.ts** - Tool execution handler
    - **types.ts** - Streaming types
  - **tools/** - Tool implementations
    - **retrieve.ts** - Retrieve tool
    - **search.ts** - Search tool
    - **video-search.ts** - Video search tool
  - **types/** - TypeScript types
    - **index.ts** - Types index
    - **models.ts** - Model types
  - **utils/** - Utility functions
    - **context-window.ts** - Context window utilities
    - **cookies.ts** - Cookie utilities
    - **index.ts** - Utilities index
    - **registry.ts** - Registry utilities

## Public Directory

- **public/**
  - **config/** - Public configuration
    - **models.json** - Public models configuration
  - **images/** - Static images
    - **placeholder-image.png** - Placeholder image
  - **providers/logos/** - Provider logos
    - **anthropic.svg** - Anthropic logo
    - **azure.svg** - Azure logo
    - **deepseek.svg** - DeepSeek logo
    - **fireworks.svg** - Fireworks logo
    - **google.svg** - Google logo
    - **groq.svg** - Groq logo
    - **ollama.svg** - Ollama logo
    - **openai-compatible.svg** - OpenAI-compatible logo
    - **openai.svg** - OpenAI logo
    - **xai.svg** - XAI logo
  - **screenshot-2025-01-31.png** - Screenshot for documentation

## Docs Directory

- **docs/**
  - **CONFIGURATION.md** - Configuration documentation
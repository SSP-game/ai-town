# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Town is a virtual town simulation where AI characters live, chat, and socialize. It's built as a TypeScript/JavaScript application using Convex as the backend database and runtime platform. The project implements a real-time game engine that manages AI agents, conversations, movement, and world state.

## Core Architecture

### Backend (Convex)
- **Database & Runtime**: Uses Convex for all backend operations, database storage, and real-time updates
- **Game Engine**: Located in `convex/engine/` - manages simulation state, timing, and updates
- **AI Town Logic**: Located in `convex/aiTown/` - handles agents, conversations, movement, players, and world management
- **Agent System**: Located in `convex/agent/` - manages AI agent memory, conversations, and embeddings
- **Schema**: Database schemas defined in `convex/schema.ts` and various subdirectories

### Frontend
- **React + Vite**: Frontend built with React and Vite for development
- **PixiJS**: Game rendering powered by PixiJS for 2D graphics and animations
- **Real-time Updates**: Uses Convex's reactive query system for real-time data synchronization

### Key Components
- **Game Loop**: Real-time simulation runs in the backend with configurable tick intervals
- **AI Agents**: Autonomous characters with memory, personality, and conversation capabilities
- **World Map**: Tile-based 2D world with collision detection and pathfinding
- **Conversations**: Dynamic multi-agent conversations with LLM integration
- **Movement System**: Physics-based character movement with collision detection

## Development Commands

### Primary Development
- `npm run dev` - Run both frontend and backend in parallel
- `npm run dev:frontend` - Run only the frontend development server
- `npm run dev:backend` - Run only the Convex backend with live reloading
- `npm run predev` - Initialize Convex with sample data (run once)

### Build & Deployment
- `npm run build` - Build the frontend for production
- `npx convex deploy` - Deploy Convex functions to production
- `npx convex run init --prod` - Initialize production database

### Testing & Quality
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npx convex run testing:wipeAllTables` - Reset all database tables (destructive)
- `npx convex run testing:stop` - Stop the game engine
- `npx convex run testing:resume` - Resume the game engine
- `npx convex run testing:kick` - Restart engine if stuck

### Database Management
- `npx convex dashboard` - Open Convex dashboard for data inspection
- `npx convex export` - Export database snapshot
- `npx convex import --prod` - Import data to production

## LLM Configuration

The project supports multiple LLM providers. Configure via environment variables:

### Ollama (Default)
- `OLLAMA_HOST` - Ollama server URL (default: http://127.0.0.1:11434)
- `OLLAMA_MODEL` - Chat model name
- `OLLAMA_EMBEDDING_MODEL` - Embedding model name

### OpenAI
- `OPENAI_API_KEY` - API key
- `OPENAI_CHAT_MODEL` - Chat model (optional)
- `OPENAI_EMBEDDING_MODEL` - Embedding model (optional)

### Other Providers
- `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_EMBEDDING_MODEL`

**Important**: When changing LLM providers or embedding models, you must wipe the database since embeddings are provider-specific.

## Project Structure Notes

### Data Configuration
- `data/characters.ts` - Character definitions, personalities, and sprite assignments
- `data/gentle.js` - World map definition (generated from Tiled editor)
- `data/spritesheets/` - Character sprite definitions and animations

### Constants & Configuration  
- `convex/constants.ts` - Game timing, thresholds, and behavior parameters
- Key timing values: `TICK` (16ms), `STEP_INTERVAL` (1000ms), `CONVERSATION_DISTANCE` (1.3)

### Engine Architecture
- Game state managed through Convex's transactional database
- Real-time updates via scheduled functions and cron jobs
- Deterministic simulation with conflict resolution
- Automatic world pausing after 5 minutes of inactivity

## Customization Points

### Adding Characters
1. Update `data/characters.ts` with new character data
2. Create corresponding spritesheet in `data/spritesheets/`
3. Run `npx convex run testing:wipeAllTables` and `npm run dev` to reload

### Modifying World Map
1. Edit map in Tiled editor (requires 'bgtiles' and 'objmap' layers)
2. Export as JSON and run `node data/convertMap.js` to convert
3. Replace `data/gentle.js` with generated output

### Adjusting AI Behavior
- Modify constants in `convex/constants.ts`
- Edit agent logic in `convex/aiTown/agent.ts`
- Update conversation parameters in conversation-related files

## Important Notes

- Always run database wipe commands (`testing:wipeAllTables`) when changing character data
- The project requires Convex account for cloud deployment
- Local development uses file-based Convex for offline development
- Background music generation requires Replicate API token (optional)
- Docker setup available for self-hosted Convex backend
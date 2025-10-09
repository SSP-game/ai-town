# Experiment Branch – Gamified Psychology Experiment Plan

## Overview

- Convert the existing free-form social sandbox into a guided experiment flow.
- Participants complete a structured onboarding (account, profile, intro, questionnaire).
- A lobby coordinates batches of `minPlayers` and starts sessions automatically.
- Each session assigns a player-specific AI agent for an `pairedChatMinutes` lock-in chat.
- Movement/chat rules evolve across phases: onboarding → lobby → paired chat → free roam.

## High-Level Flow

1. **Account & Profile**
   - Email/password registration with verification rules.
   - Profile fields: nickname, gender, birth date, MBTI, short bio, avatar choice.
   - Server stores profile; metadata editable by designers via admin tools.
2. **Introduction & Questionnaire**
   - Player sees configurable introduction text.
   - Designer-managed question set (single/multi choice + free-text).
   - Responses stored per-player/per-session for later export.
3. **Lobby**
   - After onboarding, player enters lobby.
   - Ready button required; readiness timestamp recorded.
   - Lobby waits for `minPlayers` ready players; countdown visible.
4. **Paired Chat**
   - Auto-start pairs each ready player with a dedicated AI agent.
   - UI layout = map (left) + paired chat (right); movement disabled.
   - Session timer (N minutes) shown; chat transcripts retained.
5. **Free Roam**
   - When timer ends, movement lock lifted.
   - Players can move across map and converse freely with anyone/any agent.

## Data Model Changes

- `users` table additions:
  - `gender`, `dateOfBirth`, `mbti`, `bio`, `avatarId`, `profileCompletedAt`.
  - `experimentConsent: boolean`, `experimentCohort?: string`.
- New tables:
  - `experimentConfigs`: `{ slug, introduction, minPlayers, pairedChatMinutes, questionnaireVersion, createdAt }`.
  - `questionnaires`: `{ configId, order, question, type, options?, validation?, isActive }`.
  - `questionnaireResponses`: `{ userId, configId, questionId, answer, submittedAt }`.
  - `lobbies`: `{ configId, status, minPlayers, pairedChatMinutes, createdAt, startedAt?, completedAt? }`.
  - `lobbyPlayers`: `{ lobbyId, userId, readyAt?, onboardingCompletedAt, status }`.
  - `sessions`: `{ lobbyId, status, pairedChatEndsAt?, createdAt, transitionedAt? }`.
  - `sessionAgents`: `{ sessionId, userId, agentId, chatId, assignedAt }`.
- Movement gating stored either on player records (`movementLockedUntil`) or session metadata.

## Backend Work Items

### Authentication & Profile

- Extend `convex/users.ts` register mutation to collect profile fields.
- Add mutations for updating profile, saving questionnaire responses.
- Add query to fetch experiment configuration + questionnaire for clients.

### Lobby Management

- Implement `convex/experiment/lobby.ts`:
  - `joinLobby`, `setReady`, `watchLobby`, `tryStart`.
  - Handles readiness gating & atomic session start via transactions.
- Cron task to monitor sessions and unlock movement after timer.

### Agent Assignment & Chat

- Reuse/extend agent provisioning in `convex/aiTown`.
- Create helper to spawn/assign AI agents per player with matching bios.
- Generate private chat channels and restrict visibility.

### Movement Lock & Session State

- Store `movementLockedUntil` on player state.
- Guard movement mutations; ignore move inputs while locked.
- Publish session state via queries so frontend can conditionally render controls.

## Frontend Work Items

### Onboarding Wizard

- Replace general UI with stepper:
  1. Account creation/login.
  2. Profile form (nickname, gender, birth date, MBTI, bio, avatar).
  3. Introduction display (rich text).
  4. Questionnaire (multi-question form with validation).
  5. Review + continue into lobby.
- Persist progress locally to support accidental refresh (optional).

### Lobby Screen

- Show ready list/indicator, min players, countdown once threshold reached.
- Ready button disabled until onboarding complete; toggles readiness.
- Auto-transition to session view once lobby starts.

### Paired Chat View

- Map anchored left; highlight player's avatar + assigned agent.
- Right panel shows chat transcript + input; disable movement controls.
- Timer countdown & instructions visible; disable general chat UI.

### Free Roam Update

- After timer, restore movement controls and open general chat channel.
- Provide subtle toast announcing transition.

## Configuration & Admin

- Provide default experiment config seeded from `convex/init.ts`.
- Accept overrides via Convex env (`EXPERIMENT_MIN_PLAYERS`, `EXPERIMENT_CHAT_MINUTES`).
- Optional admin view (future) for monitoring lobby, exporting data.

## Testing & Validation

- Backend unit tests for lobby transitions, questionnaire persistence, movement locks.
- Frontend component tests for onboarding wizard and lobby state transitions.
- Manual scenario script:
  1. Register multiple accounts.
  2. Complete profile/questionnaire.
  3. Ready up; ensure auto-start.
  4. Confirm paired chat lock + timer release.

## Open Questions

- Should questionnaire responses be versioned per session or per user?
- Do we require email verification / consent flows?
- How are agents personalised (generic vs MBTI-aligned scripts)?
- Should late joiners be grouped into new lobby or queued for next run?


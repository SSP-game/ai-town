export const ACTION_TIMEOUT = 120_000; // more time for local dev
// export const ACTION_TIMEOUT = 60_000;// normally fine

export const IDLE_WORLD_TIMEOUT = 5 * 60 * 1000;
export const WORLD_HEARTBEAT_INTERVAL = 60 * 1000;

export const MAX_STEP = 10 * 60 * 1000;
export const TICK = 16;
export const STEP_INTERVAL = 1000;

export const PATHFINDING_TIMEOUT = 60 * 1000;
export const PATHFINDING_BACKOFF = 1000;
export const CONVERSATION_DISTANCE = 1.3;
export const MIDPOINT_THRESHOLD = 4;
export const TYPING_TIMEOUT = 15 * 1000;
export const COLLISION_THRESHOLD = 0.75;

// How many human players can be in a world at once.
export const MAX_HUMAN_PLAYERS = 8;

// Don't talk to anyone for 15s after having a conversation.
export const CONVERSATION_COOLDOWN = 15000;

// Don't do another activity for 10s after doing one.
export const ACTIVITY_COOLDOWN = 10_000;

// Don't talk to a player within 60s of talking to them.
export const PLAYER_CONVERSATION_COOLDOWN = 60000;

// Invite 80% of invites that come from other agents.
export const INVITE_ACCEPT_PROBABILITY = 0.8;

// Wait for 1m for invites to be accepted.
export const INVITE_TIMEOUT = 60000;

// Wait for another player to say something before jumping in.
export const AWKWARD_CONVERSATION_TIMEOUT = 60_000; // more time locally
// export const AWKWARD_CONVERSATION_TIMEOUT = 20_000;

// Leave a conversation after participating too long.
export const MAX_CONVERSATION_DURATION = 10 * 60_000; // more time locally
// export const MAX_CONVERSATION_DURATION = 2 * 60_000;

// Leave a conversation if it has more than 8 messages;
export const MAX_CONVERSATION_MESSAGES = 8;

// Wait for 1s after sending an input to the engine. We can remove this
// once we can await on an input being processed.
export const INPUT_DELAY = 1000;

// How many memories to get from the agent's memory.
// This is over-fetched by 10x so we can prioritize memories by more than relevance.
export const NUM_MEMORIES_TO_SEARCH = 3;

// Wait for at least two seconds before sending another message.
// Single chat: minimum interval between an agent's messages
export const MESSAGE_COOLDOWN = 5000;
// Group chat: speak less frequently to avoid spammy threads.
// Group chat: speak less frequently to avoid spammy threads.
export const GROUP_MESSAGE_COOLDOWN = 10000; // 10s between messages per agent
export const GROUP_SPEAK_PROBABILITY = 0.3;  // 30% chance to speak when eligible

// Don't run a turn of the agent more than once a second.
export const AGENT_WAKEUP_THRESHOLD = 1000;

// How old we let memories be before we vacuum them
export const VACUUM_MAX_AGE = 2 * 7 * 24 * 60 * 60 * 1000;
export const DELETE_BATCH_SIZE = 64;

export const HUMAN_IDLE_TOO_LONG = 15 * 60 * 1000; // 15 minutes for regular worlds

export const ACTIVITIES = [
  { description: 'reading a book', emoji: '📖', duration: 60_000 },
  { description: 'daydreaming', emoji: '🤔', duration: 60_000 },
  { description: 'gardening', emoji: '🥕', duration: 60_000 },
];

export const ENGINE_ACTION_DURATION = 30000;

// Bound the number of pathfinding searches we do per game step.
export const MAX_PATHFINDS_PER_STEP = 16;

export const DEFAULT_NAME = 'Me';

// Companion World Configuration
// Controls whether the Companion view uses a separate world instance
//
// Options:
// - false (DEFAULT): Shared world mode
//   * Companion map shows a filtered view of the main game world
//   * Only companion and user are visible on the map
//   * Chat interactions occur in the shared world and are visible in Game view
//   * Other players in Game view can see when user's companion is chatting
//
// - true: Separate world mode (FUTURE IMPLEMENTATION)
//   * Would create an isolated world instance for companion interaction
//   * User and companion meet in a private world
//   * Chat would be completely separate from the main game world
//   * Requires additional backend logic to create/manage separate world instances
//
// To change: Simply set this to true or false
export const COMPANION_SEPARATE_WORLD = true;

// Electronic fence for agents - tent area in upper right corner
export const AGENT_FENCE_BOUNDS = {
  // Define the tent area where agents are allowed to move
  // Map dimensions: 64x48 tiles (indices 0-63, 0-47)
 minX: 32,
  maxX: 56,
  minY: 0,
  maxY: 17,

};

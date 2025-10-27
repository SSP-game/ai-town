import { query } from './_generated/server';
import { Id } from './_generated/dataModel';

export const debugLobbyState = query({
  args: {},
  handler: async (ctx) => {
    // Get all lobbies
    const lobbies = await ctx.db.query('lobbies').collect();

    // Get all lobby players with user info
    const lobbyPlayersWithUsers = await Promise.all(
      lobbies.map(async (lobby) => {
        const players = await ctx.db
          .query('lobbyPlayers')
          .withIndex('lobbyId', (q) => q.eq('lobbyId', lobby._id))
          .collect();

        const playersWithUserInfo = await Promise.all(
          players.map(async (player) => {
            const user = await ctx.db.get(player.userId);
            return {
              ...player,
              userNickname: user?.nickname || 'Unknown',
              userName: user?.name || 'Unknown',
            };
          })
        );

        return {
          ...lobby,
          players: playersWithUserInfo,
        };
      })
    );

    // Get all worlds and their status
    const worlds = await ctx.db.query('worlds').collect();
    const worldStatuses = await Promise.all(
      worlds.map(async (world) => {
        const status = await ctx.db
          .query('worldStatus')
          .withIndex('worldId', (q) => q.eq('worldId', world._id))
          .first();

        return {
          worldId: world._id,
          world: world,
          status: status,
          playerCount: world.players.length,
          agentCount: world.agents.length,
          conversationCount: world.conversations.length,
        };
      })
    );

    // Get all active users
    const activeUsers = await ctx.db
      .query('users')
      .withIndex('isActive', (q) => q.eq('isActive', true))
      .collect();

    return {
      lobbies: lobbyPlayersWithUsers,
      worlds: worldStatuses,
      activeUsers: activeUsers.map(u => ({
        id: u._id,
        nickname: u.nickname,
        name: u.name,
        lastLoginAt: u.lastLoginAt,
        selectedCompanion: u.selectedCompanion,
      })),
      summary: {
        totalLobbies: lobbies.length,
        waitingLobbies: lobbies.filter(l => l.status === 'waiting').length,
        matchedLobbies: lobbies.filter(l => l.status === 'matched').length,
        activeLobbies: lobbies.filter(l => l.status === 'active').length,
        totalWorlds: worlds.length,
        totalActiveUsers: activeUsers.length,
      }
    };
  },
});
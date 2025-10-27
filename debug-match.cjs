const { ConvexHttpClient } = require('convex/browser');

async function debugMatch() {
  const client = new ConvexHttpClient('http://127.0.0.1:3210');

  try {
    console.log('=== Debugging Match Creation ===\n');

    // Check active lobbies
    const lobbies = await client.query('api:lobby.listAll');
    console.log(`Active lobbies: ${lobbies.length}`);

    for (const lobby of lobbies) {
      console.log(`\n=== Lobby ===`);
      console.log(`ID: ${lobby._id}`);
      console.log(`Status: ${lobby.status}`);
      console.log(`World ID: ${lobby.worldId}`);
      console.log(`Human Slots Required: ${lobby.humanSlotsRequired}`);
      console.log(`Include Companions: ${lobby.includeCompanions}`);
      console.log(`Additional Agents: ${lobby.additionalAgents}`);

      if (lobby.worldId) {
        // Check world state
        const worldState = await client.query('api:world.worldState', { worldId: lobby.worldId });
        if (worldState) {
          console.log(`\n=== World State ===`);
          console.log(`Players: ${worldState.players.length}`);
          console.log(`Agents: ${worldState.agents.length}`);

          console.log('\nPlayers:');
          worldState.players.forEach((player, index) => {
            console.log(`  ${index + 1}. ${player.description?.name || 'Unknown'} (${player.human ? 'Human' : 'AI'}) - Character: ${player.character}`);
          });

          console.log('\nAgents:');
          worldState.agents.forEach((agent, index) => {
            console.log(`  ${index + 1}. ${agent.description?.name || 'Unknown'} - Character: ${agent.character}`);
          });
        }
      }
    }

    // Check lobby players
    const lobbyPlayers = await client.query('api:lobby.listAllPlayers');
    console.log(`\n=== Lobby Players ===`);
    console.log(`Total lobby players: ${lobbyPlayers.length}`);

    lobbyPlayers.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.nickname || 'Unknown'} - Status: ${player.status}`);
      console.log(`      Character: ${player.character}`);
      console.log(`      Companion: ${player.companionId || 'None'}`);
    });

  } catch (error) {
    console.error('Error debugging match:', error.message);
  }
}

debugMatch();
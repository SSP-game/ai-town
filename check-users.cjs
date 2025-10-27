const { ConvexHttpClient } = require('convex/browser');

async function checkUsers() {
  const client = new ConvexHttpClient('http://127.0.0.1:3210');

  try {
    console.log('Checking all users in the database...\n');

    // Get all users
    const users = await client.query('api:users.listAll');

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`=== User ${index + 1} ===`);
      console.log(`User ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nickname: ${user.nickname}`);
      console.log(`Member since: ${new Date(user._creationTime).toLocaleString()}`);

      if (user.firstName) console.log(`First name: ${user.firstName}`);
      if (user.lastName) console.log(`Last name: ${user.lastName}`);
      if (user.selectedCharacter) console.log(`Selected character: ${user.selectedCharacter}`);
      if (user.selectedCompanion) console.log(`Selected companion: ${user.selectedCompanion}`);

      console.log('');
    });

    // Also check if there are any active lobbies
    const lobbies = await client.query('api:lobby.listAll');
    console.log(`\nActive lobbies: ${lobbies.length}`);

    lobbies.forEach((lobby, index) => {
      console.log(`\n=== Lobby ${index + 1} ===`);
      console.log(`Lobby ID: ${lobby._id}`);
      console.log(`Status: ${lobby.status}`);
      console.log(`Players in lobby: ${lobby.players?.length || 0}`);
      if (lobby.worldId) console.log(`World ID: ${lobby.worldId}`);
    });

  } catch (error) {
    console.error('Error checking users:', error.message);
  }
}

checkUsers();
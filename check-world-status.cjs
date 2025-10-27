const { ConvexHttpClient } = require('convex/browser');

async function checkWorldStatus() {
  const client = new ConvexHttpClient('http://127.0.0.1:3210');

  try {
    console.log('Checking default world status...');

    // Check if there are any worlds
    const worlds = await client.query('worlds');
    console.log('Total worlds found:', worlds.length);

    if (worlds.length > 0) {
      const defaultWorld = worlds.find(w => w.isDefault);
      console.log('Default world:', defaultWorld ? defaultWorld._id : 'None found');

      // Check first world details
      const firstWorld = worlds[0];
      console.log('First world ID:', firstWorld._id);
      console.log('First world status:', firstWorld.status);
    }

    // Check lobby status
    const lobbies = await client.query('lobbies');
    console.log('Active lobbies:', lobbies.length);

  } catch (error) {
    console.error('Error checking world status:', error.message);
  }
}

checkWorldStatus();
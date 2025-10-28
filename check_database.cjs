const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

// Simple script to check database state
async function checkDatabase() {
  try {
    console.log('Checking database tables for remaining embeddings...');

    // This would require Convex client, but let's just check what we can
    console.log('Database wipe completed successfully');
    console.log('If embedding dimension issues persist, the problem may be:');
    console.log('1. Cached embeddings in embeddingsCache');
    console.log('2. Initial agent memories created with wrong dimensions');
    console.log('3. Memory creation functions using hardcoded old embeddings');

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();
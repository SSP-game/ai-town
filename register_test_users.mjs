import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV file
const csvPath = path.join(__dirname, 'test_users.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');
const users = lines.slice(1).map(line => {
  const values = line.split(',');
  return {
    email: values[0],
    password: values[1],
    nickname: values[2]
  };
});

console.log('Found', users.length, 'users to register:\n');

// Register each user
for (const user of users) {
  try {
    console.log(`Registering ${user.nickname} (${user.email})...`);

    const response = await fetch('http://127.0.0.1:3210/api/mutation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'users:register',
        args: {
          email: user.email,
          password: user.password,
          nickname: user.nickname
        },
        format: 'convex_encoded_json'
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log(`✅ Successfully registered ${user.nickname}`);
      console.log(`   User ID: ${result.value.userId}\n`);
    } else {
      console.log(`❌ Failed to register ${user.nickname}`);
      console.log(`   Error: ${result.errorMessage}\n`);
    }
  } catch (error) {
    console.log(`❌ Error registering ${user.nickname}:`, error.message, '\n');
  }
}

console.log('Registration complete!');

const { ConvexHttpClient } = require('convex/browser');

async function testRegistration() {
  const client = new ConvexHttpClient('http://127.0.0.1:3210');

  const testUsers = [
    {
      email: 'alice@example.com',
      password: 'test123',
      nickname: 'Alice'
    },
    {
      email: 'bob@example.com',
      password: 'test123',
      nickname: 'Bob'
    },
    {
      email: 'charlie@example.com',
      password: 'test123',
      nickname: 'Charlie'
    }
  ];

  console.log('=== 测试用户注册 ===\n');

  for (const user of testUsers) {
    try {
      console.log(`尝试登录用户: ${user.email}`);

      // 先尝试登录
      try {
        const loginResult = await client.mutation('login', {
          email: user.email,
          password: user.password
        });

        if (loginResult && loginResult.userId) {
          console.log(`✅ 用户登录成功: ${user.nickname}`);
          console.log(`   用户ID: ${loginResult.userId}`);
          console.log(`   邮箱: ${loginResult.email}`);
          console.log('');
          continue;
        }
      } catch (loginError) {
        console.log(`登录失败，尝试注册: ${loginError.message}`);
      }

      // 如果登录失败，尝试注册
      try {
        const registerResult = await client.mutation('register', {
          email: user.email,
          password: user.password,
          nickname: user.nickname
        });

        if (registerResult && registerResult.userId) {
          console.log(`✅ 用户注册成功: ${user.nickname}`);
          console.log(`   用户ID: ${registerResult.userId}`);

          // 注册成功后立即登录
          const loginResult = await client.mutation('login', {
            email: user.email,
            password: user.password
          });

          if (loginResult && loginResult.userId) {
            console.log(`   登录成功，获取到用户信息`);
            console.log(`   邮箱: ${loginResult.email}`);
            console.log(`   昵称: ${loginResult.nickname}`);
          }
        }
      } catch (registerError) {
        console.log(`❌ 注册失败: ${registerError.message}`);
      }

    } catch (error) {
      console.log(`❌ 处理用户失败: ${error.message}`);
    }
    console.log(''); // 空行分隔
  }

  console.log('=== 测试完成 ===');
  console.log('\n推荐使用的测试用户:');
  console.log('1. alice@example.com / test123 (昵称: Alice)');
  console.log('2. bob@example.com / test123 (昵称: Bob)');
  console.log('3. charlie@example.com / test123 (昵称: Charlie)');
}

testRegistration().catch(console.error);
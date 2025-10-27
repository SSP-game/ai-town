const { ConvexHttpClient } = require('convex/browser');

async function createTestUsers() {
  const client = new ConvexHttpClient('http://127.0.0.1:3210');

  const testUsers = [
    {
      email: 'test1@aitown.test',
      password: 'password123',
      nickname: 'TestPlayer1',
      firstName: 'Test',
      lastName: 'Player One'
    },
    {
      email: 'test2@aitown.test',
      password: 'password123',
      nickname: 'TestPlayer2',
      firstName: 'Test',
      lastName: 'Player Two'
    },
    {
      email: 'demo1@aitown.test',
      password: 'password123',
      nickname: 'DemoOne',
      firstName: 'Demo',
      lastName: 'User One'
    },
    {
      email: 'demo2@aitown.test',
      password: 'password123',
      nickname: 'DemoTwo',
      firstName: 'Demo',
      lastName: 'User Two'
    },
    {
      email: 'player1@aitown.test',
      password: 'password123',
      nickname: 'PlayerOne',
      firstName: 'Player',
      lastName: 'One'
    },
    {
      email: 'player2@aitown.test',
      password: 'password123',
      nickname: 'PlayerTwo',
      firstName: 'Player',
      lastName: 'Two'
    }
  ];

  console.log('=== 创建测试用户 ===\n');

  const createdUsers = [];

  for (const user of testUsers) {
    try {
      console.log(`正在创建用户: ${user.email}...`);

      const result = await client.mutation('api:users.register', {
        email: user.email,
        password: user.password,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName
      });

      if (result && result.userId) {
        console.log(`✅ 成功创建用户: ${user.nickname} (${user.email})`);
        createdUsers.push({
          ...user,
          userId: result.userId,
          createdAt: new Date().toISOString(),
          status: 'created'
        });
      } else {
        console.log(`⚠️ 用户可能已存在: ${user.email}`);
        // 尝试登录获取用户信息
        try {
          const loginResult = await client.mutation('api:users.login', {
            email: user.email,
            password: user.password
          });
          if (loginResult && loginResult.userId) {
            createdUsers.push({
              ...user,
              userId: loginResult.userId,
              createdAt: 'existing',
              status: 'existing'
            });
            console.log(`✅ 用户已存在并登录成功: ${user.nickname}`);
          }
        } catch (loginError) {
          console.log(`❌ 用户登录失败: ${user.email} - ${loginError.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ 创建用户失败: ${user.email} - ${error.message}`);

      // 如果用户已存在，尝试登录
      if (error.message.includes('Email already registered') || error.message.includes('Nickname already taken')) {
        try {
          const loginResult = await client.mutation('api:users.login', {
            email: user.email,
            password: user.password
          });
          if (loginResult && loginResult.userId) {
            createdUsers.push({
              ...user,
              userId: loginResult.userId,
              createdAt: 'existing',
              status: 'existing'
            });
            console.log(`✅ 用户已存在并登录成功: ${user.nickname}`);
          }
        } catch (loginError) {
          console.log(`❌ 用户登录失败: ${user.email} - ${loginError.message}`);
        }
      }
    }
    console.log(''); // 空行分隔
  }

  // 保存用户信息到文件
  const fs = require('fs');
  const credentialsData = {};

  createdUsers.forEach(user => {
    const key = user.email.replace(/[@.]/g, '_');
    credentialsData[key] = {
      email: user.email,
      password: user.password,
      nickname: user.nickname,
      userId: user.userId,
      status: user.status,
      createdAt: user.createdAt,
      firstName: user.firstName,
      lastName: user.lastName
    };
  });

  try {
    fs.writeFileSync('./test-users-new.json', JSON.stringify(credentialsData, null, 2));
    console.log('✅ 用户信息已保存到 test-users-new.json');
  } catch (error) {
    console.log('❌ 保存用户信息失败:', error.message);
  }

  // 显示总结
  console.log('\n=== 用户创建总结 ===');
  console.log(`总共处理: ${testUsers.length} 个用户`);
  console.log(`成功创建/验证: ${createdUsers.length} 个用户`);

  console.log('\n=== 可用的测试用户 ===');
  createdUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.nickname}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   密码: ${user.password}`);
    console.log(`   状态: ${user.status === 'created' ? '新创建' : '已存在'}`);
    console.log('');
  });

  console.log('\n=== 推荐的匹配测试组合 ===');
  if (createdUsers.length >= 2) {
    console.log(`组合1: ${createdUsers[0].nickname} + ${createdUsers[1].nickname}`);
    console.log(`组合2: ${createdUsers[2] ? createdUsers[2].nickname : ''} + ${createdUsers[3] ? createdUsers[3].nickname : ''}`);
  }
}

createTestUsers().catch(console.error);
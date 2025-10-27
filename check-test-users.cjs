const { ConvexHttpClient } = require('convex/browser');

async function checkTestUsers() {
  const client = new ConvexHttpClient('http://127.0.0.1:3210');

  try {
    console.log('=== 查看所有测试用户 ===\n');

    // 获取所有用户
    const users = await client.query('api:users.listAll');

    if (!users || users.length === 0) {
      console.log('没有找到任何用户');
      return;
    }

    console.log(`找到 ${users.length} 个用户:\n`);

    users.forEach((user, index) => {
      console.log(`=== 用户 ${index + 1} ===`);
      console.log(`昵称: ${user.nickname}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`用户ID: ${user.userId}`);
      console.log(`角色: ${user.selectedCharacter || '未选择'}`);
      console.log(`伴侣: ${user.selectedCompanion || '未选择'}`);
      console.log(`注册时间: ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`最后登录: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '从未登录'}`);
      console.log(`状态: ${user.isActive ? '活跃' : '未激活'}`);
      console.log('');
    });

    // 检查测试凭证文件
    try {
      const fs = require('fs');
      const testCredentials = JSON.parse(fs.readFileSync('./ai-town-test-credentials.json', 'utf8'));

      console.log('=== 测试凭证文件中的用户 ===');
      Object.entries(testCredentials).forEach(([key, credentials]) => {
        console.log(`${key}:`);
        console.log(`  邮箱: ${credentials.email}`);
        console.log(`  密码: ${credentials.password}`);
        console.log(`  昵称: ${credentials.nickname}`);
        if (credentials.character) {
          console.log(`  角色: ${credentials.character}`);
        }
        console.log('');
      });
    } catch (error) {
      console.log('没有找到测试凭证文件或读取失败');
    }

  } catch (error) {
    console.error('查询用户失败:', error.message);
  }
}

checkTestUsers();
# AI Town 测试用户信息

## 测试用户账号

以下是已创建的5个测试用户账号，您可以使用这些账号登录系统进行测试：

| 序号 | 昵称 (Nickname) | 邮箱 (Email) | 密码 (Password) | 用户ID |
|------|----------------|--------------|-----------------|---------|
| 1 | Alice | alice.test@aitown.com | password123 | m970x3b7s9dqkdtyx32ncgq1n97tetsw |
| 2 | Bob | bob.test@aitown.com | password123 | m97cmaqgvv6g1p3zgtrga682397tefee |
| 3 | Charlie | charlie.test@aitown.com | password123 | m97fsge10fs404r35ta2j9qf157tfe4k |
| 4 | Diana | diana.test@aitown.com | password123 | m97cef2tjzk20jv0t3s3er69vd7tf26n |
| 5 | Eve | eve.test@aitown.com | password123 | m974e1nztejg442ppx2czwzvt57tepye |

## 登录说明

1. 访问 AI Town 应用
2. 点击右下角的 "Login" 按钮
3. 输入邮箱和密码
4. 点击 "Login" 完成登录

## 注意事项

- 所有测试用户的密码都是：`password123`
- 这些账号仅用于测试目的
- 用户数据存储在 Convex 数据库中
- 原始用户数据保存在 `test_users.csv` 文件中

## 相关文件

- `test_users.csv` - 测试用户数据（CSV格式）
- `register_test_users.mjs` - 批量注册用户的脚本

## 如何添加更多测试用户

1. 编辑 `test_users.csv` 文件，添加新的用户信息
2. 运行命令：`node register_test_users.mjs`
3. 查看注册结果

## 测试完成时间

创建时间：2025-10-30
状态：✅ 所有用户注册成功

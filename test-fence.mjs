import { chromium } from 'playwright';

async function testAgentFence() {
  console.log('Starting Playwright test for Agent Fence...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 导航到游戏页面
    console.log('Navigating to game...');
    await page.goto('http://localhost:5173/ai-town');

    // 等待页面加载
    console.log('Waiting for page to load...');
    await page.waitForTimeout(5000);

    // 检查是否显示了围栏警告标签
    console.log('Checking for fence warning label...');
    const fenceLabel = await page.$('#agent-fence-label');
    if (fenceLabel) {
      const labelText = await fenceLabel.textContent();
      console.log('✅ Fence label found:', labelText);
    } else {
      console.log('⚠️ Fence label NOT found - make sure VITE_SHOW_DEBUG_UI is set');
    }

    // 截图查看当前状态
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'fence-test-initial.png', fullPage: true });
    console.log('Screenshot saved as fence-test-initial.png');

    // 等待一段时间观察agent移动
    console.log('Waiting 30 seconds to observe agent movement...');
    await page.waitForTimeout(30000);

    // 再次截图
    console.log('Taking second screenshot...');
    await page.screenshot({ path: 'fence-test-after-30s.png', fullPage: true });
    console.log('Screenshot saved as fence-test-after-30s.png');

    // 尝试从控制台获取agent位置信息
    const agentPositions = await page.evaluate(() => {
      // 尝试访问Convex查询结果
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: 'Check screenshots to verify agent positions' });
        }, 1000);
      });
    });

    console.log('\n=== Test Summary ===');
    console.log('Test completed. Please check:');
    console.log('1. fence-test-initial.png - Initial state');
    console.log('2. fence-test-after-30s.png - After 30 seconds');
    console.log('3. Verify that all AI agents (non-human players) are within the fence bounds');
    console.log('4. Fence bounds: x: 32-44, y: 0-16 (upper right area of map)');
    console.log('\nBrowser will stay open for manual inspection. Press Ctrl+C to close.');

    // 保持浏览器打开以便手动检查
    await page.waitForTimeout(300000); // 等待5分钟

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testAgentFence();

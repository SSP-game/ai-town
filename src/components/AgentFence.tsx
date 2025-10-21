import { Graphics } from '@pixi/react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface AgentFenceProps {
  tileDim: number;
  mapWidth: number;
  mapHeight: number;
}

export function AgentFence({ tileDim, mapWidth, mapHeight }: AgentFenceProps) {
  // 从后端获取电子围栏配置
  const constants = useQuery(api.world.getConstants);
  const { AGENT_FENCE_BOUNDS } = constants ?? { AGENT_FENCE_BOUNDS: null };

  // 添加CSS标签到页面
  useEffect(() => {
    if (!AGENT_FENCE_BOUNDS) {
      return;
    }
    // 创建或更新标签元素
    let labelElement = document.getElementById('agent-fence-label');
    if (!labelElement) {
      labelElement = document.createElement('div');
      labelElement.id = 'agent-fence-label';
      labelElement.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        pointer-events: none;
        font-family: monospace;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid #ff6b6b;
        animation: pulse 2s infinite;
      `;
      
      // 添加脉冲动画
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.9; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(labelElement);
    }
    
    labelElement.textContent = `🚨 AGENT ELECTRONIC FENCE (x: ${AGENT_FENCE_BOUNDS.minX}-${AGENT_FENCE_BOUNDS.maxX}, y: ${AGENT_FENCE_BOUNDS.minY}-${AGENT_FENCE_BOUNDS.maxY})`;
    
    // 清理函数
    return () => {
      if (labelElement && labelElement.parentNode) {
        labelElement.parentNode.removeChild(labelElement);
      }
    };
  }, [AGENT_FENCE_BOUNDS]);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      if (!AGENT_FENCE_BOUNDS) {
        return;
      }

      // 计算围栏的像素坐标
      const fencePixelX = AGENT_FENCE_BOUNDS.minX * tileDim;
      const fencePixelY = AGENT_FENCE_BOUNDS.minY * tileDim;
      const fencePixelWidth = (AGENT_FENCE_BOUNDS.maxX - AGENT_FENCE_BOUNDS.minX + 1) * tileDim;
      const fencePixelHeight = (AGENT_FENCE_BOUNDS.maxY - AGENT_FENCE_BOUNDS.minY + 1) * tileDim;

      // 绘制半透明填充区域
      g.beginFill(0xFF0000, 0.1); // 红色，10%透明度
      g.drawRect(fencePixelX, fencePixelY, fencePixelWidth, fencePixelHeight);
      g.endFill();

      // 绘制边框
      g.lineStyle(3, 0xFF0000, 0.8); // 红色边框，80%透明度，3像素宽度
      g.drawRect(fencePixelX, fencePixelY, fencePixelWidth, fencePixelHeight);

      // 绘制角标
      const cornerSize = 20;
      g.lineStyle(2, 0xFF6B6B, 1.0); // 亮红色边框，2像素宽度
      
      // 左上角
      g.moveTo(fencePixelX, fencePixelY + cornerSize);
      g.lineTo(fencePixelX, fencePixelY);
      g.lineTo(fencePixelX + cornerSize, fencePixelY);
      
      // 右上角
      g.moveTo(fencePixelX + fencePixelWidth - cornerSize, fencePixelY);
      g.lineTo(fencePixelX + fencePixelWidth, fencePixelY);
      g.lineTo(fencePixelX + fencePixelWidth, fencePixelY + cornerSize);
      
      // 右下角
      g.moveTo(fencePixelX + fencePixelWidth, fencePixelY + fencePixelHeight - cornerSize);
      g.lineTo(fencePixelX + fencePixelWidth, fencePixelY + fencePixelHeight);
      g.lineTo(fencePixelX + fencePixelWidth - cornerSize, fencePixelY + fencePixelHeight);
      
      // 左下角
      g.moveTo(fencePixelX + cornerSize, fencePixelY + fencePixelHeight);
      g.lineTo(fencePixelX, fencePixelY + fencePixelHeight);
      g.lineTo(fencePixelX, fencePixelY + fencePixelHeight - cornerSize);

      // 绘制网格线（可选的详细网格）
      if (tileDim >= 32) { // 只在瓦片不太小时显示网格
        g.lineStyle(1, 0xFF0000, 0.2); // 细红线，20%透明度

        // 垂直网格线
        for (let x = AGENT_FENCE_BOUNDS.minX; x <= AGENT_FENCE_BOUNDS.maxX + 1; x++) {
          const pixelX = x * tileDim;
          g.moveTo(pixelX, fencePixelY);
          g.lineTo(pixelX, fencePixelY + fencePixelHeight);
        }

        // 水平网格线
        for (let y = AGENT_FENCE_BOUNDS.minY; y <= AGENT_FENCE_BOUNDS.maxY + 1; y++) {
          const pixelY = y * tileDim;
          g.moveTo(fencePixelX, pixelY);
          g.lineTo(fencePixelX + fencePixelWidth, pixelY);
        }
      }

      // "禁止"符号已移除
    },
    [tileDim, mapWidth, mapHeight, AGENT_FENCE_BOUNDS]
  );

  return <Graphics draw={draw} eventMode="none" />;
}
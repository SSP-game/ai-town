import { useEffect, useRef } from 'react';
import { characters } from '../../data/characters';

interface AvatarPreviewProps {
  character: string;
  size?: number;
  className?: string;
}

const characterPositions: Record<string, { x: number; y: number }> = {
  f1: { x: 0, y: 0 },
  f2: { x: 32, y: 0 },
  f3: { x: 64, y: 0 },
  f4: { x: 96, y: 0 },
  f5: { x: 128, y: 0 },
  f6: { x: 160, y: 0 },
  f7: { x: 192, y: 0 },
  f8: { x: 224, y: 0 },
};

export default function AvatarPreview({ character, size = 64, className }: AvatarPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sprite = characters.find((entry) => entry.name === character) ?? characters[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) {
        return;
      }
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;

      const frameData = (sprite as any)?.spritesheetData?.frames?.down?.frame;
      if (frameData) {
        ctx.drawImage(img, frameData.x, frameData.y, frameData.w, frameData.h, 0, 0, size, size);
        return;
      }

      const pos = characterPositions[sprite.name] ?? characterPositions.f1;
      ctx.drawImage(img, pos.x, pos.y, 32, 32, 0, 0, size, size);
    };

    img.onerror = () => {
      if (!cancelled) {
        console.error(`Failed to load sprite for ${sprite.name} (${sprite.textureUrl})`);
      }
    };

    img.src = sprite.textureUrl;

    return () => {
      cancelled = true;
    };
  }, [sprite, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label={`Avatar preview for ${character}`}
    />
  );
}

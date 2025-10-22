import { useRef, useEffect, useState } from 'react';
import { characters } from '../../data/characters';

interface CompanionAvatarChatProps {
  companionName: string;
  companionCharacter: string;
  userName: string;
  userCharacter: string;
  isUserTyping: boolean;
  isCompanionTyping: boolean;
}

export default function CompanionAvatarChat({
  companionName,
  companionCharacter,
  userName,
  userCharacter,
  isUserTyping,
  isCompanionTyping,
}: CompanionAvatarChatProps) {
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const companionCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load and render user avatar
  useEffect(() => {
    const canvas = userCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const character = characters.find((c) => c.name === userCharacter);
    if (!character) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.clearRect(0, 0, 64, 64);

      // Get the right-facing sprite (facing the companion)
      const frameData = character.spritesheetData?.frames?.right;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h, 0, 0, 64, 64);
      } else {
        // Fallback if no spritesheet data
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 32, 32, 0, 0, 64, 64);
      }
    };

    img.src = character.textureUrl;
  }, [userCharacter]);

  // Load and render companion avatar
  useEffect(() => {
    const canvas = companionCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const character = characters.find((c) => c.name === companionCharacter);
    if (!character) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.clearRect(0, 0, 64, 64);

      // Get the left-facing sprite (facing the user)
      const frameData = character.spritesheetData?.frames?.left;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h, 0, 0, 64, 64);
      } else {
        // Fallback if no spritesheet data
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 32, 32, 0, 0, 64, 64);
      }
    };

    img.src = character.textureUrl;
  }, [companionCharacter]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-brown-900 to-brown-800">
      <div className="flex items-center gap-16">
        {/* User Avatar */}
        <div className="flex flex-col items-center relative">
          {/* Name label */}
          <div className="mb-2 px-4 py-1 bg-brown-700 rounded-lg">
            <span className="text-brown-100 font-bold">{userName}</span>
          </div>

          {/* Avatar */}
          <div className="relative">
            <canvas
              ref={userCanvasRef}
              width={64}
              height={64}
              className="pixelated"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Typing indicator */}
            {isUserTyping && (
              <div className="absolute -top-8 left-1/2 transform translate-x-8 text-3xl">
                💬
              </div>
            )}
          </div>
        </div>

        {/* Companion Avatar */}
        <div className="flex flex-col items-center relative">
          {/* Name label */}
          <div className="mb-2 px-4 py-1 bg-blue-700 rounded-lg">
            <span className="text-white font-bold">{companionName}</span>
          </div>

          {/* Avatar */}
          <div className="relative">
            <canvas
              ref={companionCanvasRef}
              width={64}
              height={64}
              className="pixelated"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Typing indicator */}
            {isCompanionTyping && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-12 text-3xl">
                <div className="relative" style={{ transform: 'scaleX(-1)' }}>
                  💬
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useMemo } from 'react';
import { characters } from '../../data/characters';

type SyntheticAvatarSpriteProps = {
  character: string;
  tileDim: number;
  position: { x: number; y: number };
  faceLeft?: boolean;
};

const baseTextureCache = new Map<string, PIXI.BaseTexture>();
const textureCache = new Map<string, PIXI.Texture>();

function getTexture(characterName: string): PIXI.Texture {
  const character = characters.find((c) => c.name === characterName) ?? characters[0];
  const key = `${character.textureUrl}:${character.name}`;
  const cached = textureCache.get(key);
  if (cached) {
    return cached;
  }

  let baseTexture = baseTextureCache.get(character.textureUrl);
  if (!baseTexture) {
    baseTexture = PIXI.BaseTexture.from(character.textureUrl);
    baseTextureCache.set(character.textureUrl, baseTexture);
  }

  const frameData =
    (character as any)?.spritesheetData?.frames?.down?.frame ?? {
      x: 0,
      y: 0,
      w: 32,
      h: 32,
    };

  const texture = new PIXI.Texture(
    baseTexture,
    new PIXI.Rectangle(frameData.x, frameData.y, frameData.w ?? 32, frameData.h ?? 32),
  );
  textureCache.set(key, texture);
  return texture;
}

export default function SyntheticAvatarSprite({
  character,
  tileDim,
  position,
  faceLeft,
}: SyntheticAvatarSpriteProps) {
  const texture = useMemo(() => getTexture(character), [character]);
  const scale = 2;
  const offsetX = (position.x + 0.5) * tileDim;
  const offsetY = (position.y + 1) * tileDim;

  return (
    <Sprite
      texture={texture}
      x={offsetX}
      y={offsetY}
      anchor={0.5}
      scale={{ x: faceLeft ? -scale : scale, y: scale }}
      zIndex={10}
    />
  );
}

import { useCallback, useEffect, useState } from 'react';
import volumeImg from '../../../assets/volume.svg';
import { sound } from '@pixi/sound';
import Button from './Button';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function MusicButton() {
  const musicUrl = useQuery(api.music.getBackgroundMusic);
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    if (!musicUrl) return;
    // Avoid duplicates; never auto-play.
    if (!sound.exists('background')) {
      sound.add('background', {
        url: musicUrl,
        preload: true,
        autoPlay: false,
        loop: true,
      });
    } else {
      // Update URL if it changed.
      const s = sound.find('background');
      if (s && (s as any)._options?.url !== musicUrl) {
        try {
          sound.remove('background');
        } catch {}
        sound.add('background', {
          url: musicUrl,
          preload: true,
          autoPlay: false,
          loop: true,
        });
      }
    }
    // Ensure muted by default (don't start playing implicitly)
    sound.stop('background');
    setPlaying(false);

    return () => {
      // Stop on unmount to avoid lingering playback when navigating.
      try {
        sound.stop('background');
      } catch {}
    };
  }, [musicUrl]);

  const flipSwitch = async () => {
    if (isPlaying) {
      sound.stop('background');
    } else {
      await sound.play('background');
    }
    setPlaying(!isPlaying);
  };

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inEditable =
        target?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
      if (inEditable) return; // Don't toggle while typing in inputs
      if (event.key === 'm' || event.key === 'M') {
        void flipSwitch();
      }
    },
    [flipSwitch],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <>
      <Button
        onClick={() => void flipSwitch()}
        className="hidden lg:block"
        title="Play AI generated music (press m to play/mute)"
        imgUrl={volumeImg}
      >
        {isPlaying ? 'Mute' : 'Music'}
      </Button>
    </>
  );
}

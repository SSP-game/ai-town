import { useState, useRef, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { userCharacters } from '../../data/characters';
import Button from './buttons/Button';
import { toast } from 'react-toastify';
import { Id } from '../../convex/_generated/dataModel';

interface CharacterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users">;
  currentCharacter?: string;
  onCharacterSelected?: () => void;
}

function CharacterAvatar({ character, isSelected, onClick }: {
  character: { name: string; textureUrl: string; spritesheetData?: any },
  isSelected: boolean,
  onClick: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 48, 48);

      // Get the sprite frame data
      const frameData = character.spritesheetData?.frames?.down;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        ctx.imageSmoothingEnabled = false; // Keep pixels sharp
        ctx.drawImage(img, x, y, w, h, 0, 0, 48, 48);
      } else {
        // Fallback: use simple position mapping
        const characterPositions: { [key: string]: { x: number; y: number } } = {
          f1: { x: 0, y: 0 }, // Lucky
          f2: { x: 32, y: 0 },
          f3: { x: 64, y: 0 }, // Alice
          f4: { x: 96, y: 0 }, // Bob
          f5: { x: 128, y: 0 },
          f6: { x: 160, y: 0 }, // Stella
          f7: { x: 192, y: 0 }, // Pete
          f8: { x: 224, y: 0 },
        };

        const pos = characterPositions[character.name] || { x: 0, y: 0 };
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, pos.x, pos.y, 32, 32, 0, 0, 48, 48);
      }

      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error('Failed to load character image:', character.textureUrl);
    };

    img.src = character.textureUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [character.textureUrl, character.spritesheetData, character.name]);

  return (
    <div
      className={`relative cursor-pointer rounded p-1 transition-all hover:scale-105 ${
        isSelected ? 'bg-yellow-100' : 'bg-gray-200'
      }`}
      onClick={onClick}
      title={character.name.toUpperCase()}
    >
      <canvas
        ref={canvasRef}
        width={48}
        height={48}
        className="block"
      />
    </div>
  );
}

export default function CharacterSelectionModal({
  isOpen,
  onClose,
  userId,
  currentCharacter,
  onCharacterSelected
}: CharacterSelectionModalProps) {
  const [selectedCharacter, setSelectedCharacter] = useState(currentCharacter || userCharacters[0].name);
  const [loading, setLoading] = useState(false);

  const updateCharacterMutation = useMutation(api.users.updateSelectedCharacter);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateCharacterMutation({ userId, character: selectedCharacter });
      localStorage.setItem('selectedCharacter', selectedCharacter);
      toast.success(`Character updated to ${selectedCharacter.toUpperCase()}!`);
      onClose();
      // Call the callback if provided to redirect to agents list
      if (onCharacterSelected) {
        onCharacterSelected();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Character Selection Modal"
      ariaHideApp={false}
    >
      <div className="font-body">
        <h1 className="text-center text-4xl font-bold font-display game-title mb-6">
          Select Your Avatar
        </h1>

        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2 mb-6 max-h-[500px] overflow-y-auto px-2">
          {userCharacters.map((character) => (
            <CharacterAvatar
              key={character.name}
              character={character}
              isSelected={selectedCharacter === character.name}
              onClick={() => setSelectedCharacter(character.name)}
            />
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="text-lg">
            Selected: <span className="font-bold text-yellow-400">{selectedCharacter.toUpperCase()}</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This avatar will appear when you join the game
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Welcome back, {localStorage.getItem('nickname')}!
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-bold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Character'}
          </button>

          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-bold disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              // Logout function
              localStorage.removeItem('userId');
              localStorage.removeItem('nickname');
              localStorage.removeItem('email');
              localStorage.removeItem('selectedCharacter');
              toast.success('Logged out successfully');
              onClose();
            }}
            className="text-red-400 hover:text-red-300 text-sm underline"
          >
            Logout
          </button>
        </div>
      </div>
    </ReactModal>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 75%)',
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '600px',
    width: '90%',
    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};
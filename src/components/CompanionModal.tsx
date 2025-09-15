import { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Button from './buttons/Button';
import { toast } from 'react-toastify';
import CharacterSelectionModal from './CharacterSelectionModal';
import { Id } from '../../convex/_generated/dataModel';

interface CompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowAgentsList?: () => void;
}

type AuthMode = 'login' | 'register';
type ModalState = 'auth' | 'character-selection';

export default function CompanionModal({ isOpen, onClose, onShowAgentsList }: CompanionModalProps) {
  const [modalState, setModalState] = useState<ModalState>('auth');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<string | undefined>();

  // Check if user is already logged in when modal opens
  useEffect(() => {
    if (isOpen) {
      const storedUserId = localStorage.getItem('userId');
      const storedCharacter = localStorage.getItem('selectedCharacter');

      if (storedUserId) {
        setUserId(storedUserId as Id<"users">);
        setCurrentCharacter(storedCharacter || undefined);

        // If user already has a selected character, skip character selection and go directly to agents list
        if (storedCharacter) {
          // Use setTimeout to ensure this runs after the modal is fully rendered
          setTimeout(() => {
            onClose();
            if (onShowAgentsList) {
              onShowAgentsList();
            }
          }, 0);
          return;
        } else {
          // Only show character selection if user doesn't have a character yet
          setModalState('character-selection');
        }
      } else {
        // Reset to auth mode if not logged in
        setModalState('auth');
      }
    }
  }, [isOpen, onClose, onShowAgentsList]);

  const registerMutation = useMutation(api.users.register);
  const loginMutation = useMutation(api.users.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const result = await registerMutation({ email, password, nickname });
        toast.success(`Registration successful! Welcome ${result.nickname}`);
        localStorage.setItem('userId', result.userId);
        localStorage.setItem('nickname', result.nickname);
        setUserId(result.userId as Id<"users">);
        setModalState('character-selection');
      } else {
        const result = await loginMutation({ email, password });
        toast.success(`Welcome back, ${result.nickname}!`);
        localStorage.setItem('userId', result.userId);
        localStorage.setItem('nickname', result.nickname);
        localStorage.setItem('email', result.email);
        if (result.selectedCharacter) {
          localStorage.setItem('selectedCharacter', result.selectedCharacter);
          setCurrentCharacter(result.selectedCharacter);
          // If user already has a character, skip selection and go to agents list
          setUserId(result.userId as Id<"users">);
          handleClose();
          if (onShowAgentsList) {
            onShowAgentsList();
          }
          return; // Exit early to avoid setting character-selection state
        }
        setUserId(result.userId as Id<"users">);
        setModalState('character-selection');
      }
      setEmail('');
      setPassword('');
      setNickname('');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setEmail('');
    setPassword('');
    setNickname('');
  };

  const handleClose = () => {
    setModalState('auth');
    setUserId(null);
    setCurrentCharacter(undefined);
    onClose();
  };

  const handleCharacterSelectionClose = () => {
    handleClose();
  };

  const handleCharacterSelected = () => {
    handleClose();
    // Switch to agents list view after character selection
    if (onShowAgentsList) {
      onShowAgentsList();
    }
  };

  if (modalState === 'character-selection' && userId) {
    return (
      <CharacterSelectionModal
        isOpen={isOpen}
        onClose={handleCharacterSelectionClose}
        userId={userId}
        currentCharacter={currentCharacter}
        onCharacterSelected={handleCharacterSelected}
      />
    );
  }

  return (
    <ReactModal
      isOpen={isOpen && modalState === 'auth'}
      onRequestClose={handleClose}
      style={modalStyles}
      contentLabel="Companion Login Modal"
      ariaHideApp={false}
    >
      <div className="font-body">
        <h1 className="text-center text-4xl font-bold font-display game-title mb-6">
          {mode === 'login' ? 'Login' : 'Register'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border-2 border-gray-600 rounded bg-gray-800 text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-lg mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-2 border-2 border-gray-600 rounded bg-gray-800 text-white"
              placeholder="Enter your password"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-lg mb-2">Nickname:</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={20}
                className="w-full p-2 border-2 border-gray-600 rounded bg-gray-800 text-white"
                placeholder="Choose a nickname"
              />
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-bold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
            </button>

            <button
              type="button"
              onClick={switchMode}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-bold disabled:opacity-50"
              disabled={loading}
            >
              {mode === 'login' ? 'Need account?' : 'Have account?'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-bold"
          >
            Cancel
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
    maxWidth: '400px',
    width: '90%',
    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};
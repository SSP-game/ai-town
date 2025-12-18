import Game from './components/Game.tsx';
import SurveyView from './components/SurveyView.tsx';
import LobbyView from './components/LobbyView.tsx';
import CompanionSelectionView from './components/CompanionSelectionView.tsx';
import EndView from './components/EndView.tsx';

import { ToastContainer, toast } from 'react-toastify';
import a16zImg from '../assets/a16z.png';
import convexImg from '../assets/convex.svg';
import helpImg from '../assets/help.svg';
import { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';
import AuthPage from './components/AuthPage.tsx';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { useGameFlow } from './hooks/useGameFlow.ts';
import { GameFlowStep } from './types/gameFlow.ts';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    userId: Id<'users'>;
    nickname: string;
    email: string;
    selectedCharacter?: string;
    selectedCompanion?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);

  // Initialize user from localStorage on app start
  useEffect(() => {
    const initializeApp = () => {
      try {
        const userId = localStorage.getItem('userId');
        const nickname = localStorage.getItem('userNickname');
        const email = localStorage.getItem('userEmail');

        if (userId && nickname && email) {
          setIsLoggedIn(true);
          setCurrentUser({
            userId: userId as Id<'users'>,
            nickname,
            email,
            selectedCharacter: localStorage.getItem('selectedCharacter') || undefined,
            selectedCompanion: localStorage.getItem('selectedCompanion') || undefined,
          });
        }
      } catch (error) {
        console.error('Error initializing user from storage:', error);
        // Clear corrupted storage
        localStorage.removeItem('userId');
        localStorage.removeItem('userNickname');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('selectedCharacter');
        localStorage.removeItem('selectedCompanion');
      }
    };

    initializeApp();
  }, []);

  // Use game flow hook to determine current step
  const { currentStep, isLoading, lobbyId, worldId, statsId } = useGameFlow(
    currentUser?.userId ?? null
  );

  // Get default world for spectator mode (when not in game flow)
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const defaultWorldId = worldStatus?.worldId;

  const handleLoginSuccess = (userData: {
    userId: string;
    nickname: string;
    email: string;
    selectedCharacter?: string;
    selectedCompanion?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    // Store in localStorage
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userNickname', userData.nickname);
    localStorage.setItem('userEmail', userData.email);
    if (userData.selectedCharacter) {
      localStorage.setItem('selectedCharacter', userData.selectedCharacter);
    }
    if (userData.selectedCompanion) {
      localStorage.setItem('selectedCompanion', userData.selectedCompanion);
    }

    // Update state
    setCurrentUser({
      userId: userData.userId as Id<'users'>,
      nickname: userData.nickname,
      email: userData.email,
      selectedCharacter: userData.selectedCharacter,
      selectedCompanion: userData.selectedCompanion,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });
    setIsLoggedIn(true);
    toast.success('Login successful!');
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('selectedCompanion');

    // Clear state
    setCurrentUser(null);
    setIsLoggedIn(false);
    toast.info('Logged out successfully');
  };

  // Render the current step component
  const renderCurrentStep = () => {
    // Not logged in - show login page
    if (!isLoggedIn || !currentUser) {
      return (
        <div className="flex-1 flex items-center justify-center bg-brown-900">
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        </div>
      );
    }

    // Loading state
    if (isLoading || currentStep === 'loading') {
      return (
        <div className="flex-1 flex items-center justify-center bg-brown-900">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-xl">Loading...</p>
          </div>
        </div>
      );
    }

    // Render based on current step
    switch (currentStep as GameFlowStep) {
      case 'login':
        return (
          <div className="flex-1 flex items-center justify-center bg-brown-900">
            <AuthPage onLoginSuccess={handleLoginSuccess} />
          </div>
        );

      case 'survey':
        return (
          <SurveyView
            userId={currentUser.userId}
            onComplete={() => {
              // Flow will auto-advance via Convex reactive query
              toast.success('Survey completed!');
            }}
          />
        );

      case 'companion':
        return (
          <CompanionSelectionView
            userId={currentUser.userId}
            worldId={defaultWorldId}
            onCompanionSelected={() => {
              // Flow will auto-advance via Convex reactive query
              toast.success('Companion selected!');
            }}
          />
        );

      case 'lobby':
        return <LobbyView userId={currentUser.userId} />;

      case 'game':
        return <Game matchWorldId={worldId} />;

      case 'end':
        return (
          <EndView
            userId={currentUser.userId}
            statsId={statsId!}
            onPlayAgain={() => {
              // Will clear companion and return to companion selection step
              toast.info('Starting new game...');
            }}
          />
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-brown-900">
            <p className="text-white text-xl">Unknown step: {currentStep}</p>
          </div>
        );
    }
  };

  // Get step display name for header
  const getStepDisplayName = (step: GameFlowStep | 'loading'): string => {
    const names: Record<string, string> = {
      login: 'Login',
      survey: 'Survey',
      companion: 'Select Companion',
      lobby: 'Lobby',
      game: 'Game',
      end: 'Game Over',
      loading: 'Loading...',
    };
    return names[step] || step;
  };

  // Check if we should show footer controls
  const showGameControls = currentStep === 'game';
  const showMinimalFooter = ['survey', 'companion', 'lobby', 'end'].includes(currentStep as string);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      {/* Help Modal */}
      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="Help modal"
        ariaHideApp={false}
      >
        <div className="font-body relative">
          <button
            onClick={() => setHelpModalOpen(false)}
            className="absolute -top-2 -right-2 text-4xl leading-none hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-2 z-10"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
          <h1 className="text-center text-6xl font-bold font-display game-title pr-8">Help</h1>
          <p>
            Welcome to AI town. AI town supports both anonymous <i>spectators</i> and logged in{' '}
            <i>interactivity</i>.
          </p>
          <h2 className="text-4xl mt-4">Game Flow</h2>
          <p>
            After logging in, you'll complete a brief survey, select your AI companion, and then
            enter the matchmaking lobby. Once matched with other players, you'll enter a timed game
            session.
          </p>
          <h2 className="text-4xl mt-4">Interactivity</h2>
          <p>
            During the game, click the "Interact" button to join the simulation. Your character will
            appear on the map with a highlighted circle underneath you.
          </p>
          <p className="text-2xl mt-2">Controls:</p>
          <p className="mt-4">Click to navigate around.</p>
          <p className="mt-4">
            To talk to an agent, click on them and then click "Start conversation," which will ask
            them to start walking towards you. Once they're nearby, the conversation will start.
          </p>
          <p className="mt-4">
            AI town only supports {MAX_HUMAN_PLAYERS} humans at a time. If you're idle for five
            minutes, you'll be automatically removed from the simulation.
          </p>
        </div>
      </ReactModal>

      <div className="w-full h-screen relative isolate shadow-2xl flex flex-col justify-start overflow-hidden">
        {/* Step indicator header */}
        {isLoggedIn && currentStep !== 'game' && currentStep !== 'loading' && (
          <div className="flex-shrink-0 bg-gradient-to-b from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-white/70 text-sm">Current Step:</span>
                <span className="text-white font-bold text-lg">
                  {getStepDisplayName(currentStep)}
                </span>
              </div>
              {currentUser && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span>Logged in as:</span>
                  <span className="text-white font-semibold">{currentUser.nickname}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col relative min-h-0 overflow-auto">
          {renderCurrentStep()}
        </div>

        {/* Footer - varies based on step */}
        <div className="flex-shrink-0 w-full flex items-center justify-between gap-2 p-3 bg-gradient-to-t from-black/80 to-transparent [&_.button]:scale-75">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {isLoggedIn && currentUser ? (
              <Button
                imgUrl={helpImg}
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 scale-100"
              >
                Logout
              </Button>
            ) : null}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            {showGameControls && (
              <>
                <InteractButton />
                <FreezeButton />
                <MusicButton />
              </>
            )}
            <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
              Help
            </Button>
            <a href="https://a16z.com">
              <img className="w-6 h-6 pointer-events-auto" src={a16zImg} alt="a16z" />
            </a>
            <a href="https://convex.dev/c/ai-town">
              <img className="w-16 h-6 pointer-events-auto" src={convexImg} alt="Convex" />
            </a>
          </div>
        </div>

        <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
      </div>
    </main>
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
    maxWidth: '90%',
    maxHeight: '90vh',
    width: 'auto',
    overflow: 'auto',

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
    padding: '20px',
  },
};

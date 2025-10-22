import Game from './components/Game.tsx';
import AgentsListView from './components/AgentsListView.tsx';
import SurveyView from './components/SurveyView.tsx';
import UserSettingsView from './components/UserSettingsView.tsx';

import { ToastContainer } from 'react-toastify';
import a16zImg from '../assets/a16z.png';
import convexImg from '../assets/convex.svg';
import starImg from '../assets/star.svg';
import helpImg from '../assets/help.svg';
import { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';
import PoweredByConvex from './components/PoweredByConvex.tsx';
import ViewToggleButton, { ViewMode } from './components/buttons/ViewToggleButton.tsx';
import CompanionModal from './components/CompanionModal.tsx';
import CompanionPageView from './components/CompanionPageView.tsx';
import AuthPage from './components/AuthPage.tsx';
import UserManagement from './components/UserManagement.tsx';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('game');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    userId: Id<"users">;
    nickname: string;
    email: string;
    selectedCharacter?: string;
    selectedCompanion?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [companionModalOpen, setCompanionModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Check login state on app start
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const nickname = localStorage.getItem('userNickname');
    const email = localStorage.getItem('userEmail');

    if (userId && nickname && email) {
      setIsLoggedIn(true);
      setCurrentUser({
        userId: userId as Id<"users">,
        nickname,
        email,
        selectedCharacter: localStorage.getItem('selectedCharacter') || undefined,
        selectedCompanion: localStorage.getItem('selectedCompanion') || undefined,
      });
    }
  }, []);

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;

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
      userId: userData.userId as Id<"users">,
      nickname: userData.nickname,
      email: userData.email,
      selectedCharacter: userData.selectedCharacter,
      selectedCompanion: userData.selectedCompanion,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });
    setIsLoggedIn(true);
    setLoginModalOpen(false);
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
    setCurrentView('game');
  };

  // Do not early-return to AuthPage; keep the app visible and provide a Login button instead.

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      {/* <PoweredByConvex /> */}

      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="Help modal"
        ariaHideApp={false}
      >
        <div className="font-body">
          <h1 className="text-center text-6xl font-bold font-display game-title">Help</h1>
          <p>
            Welcome to AI town. AI town supports both anonymous <i>spectators</i> and logged in{' '}
            <i>interactivity</i>.
          </p>
          <h2 className="text-4xl mt-4">Spectating</h2>
          <p>
            Click and drag to move around the town, and scroll in and out to zoom. You can click on
            an individual character to view its chat history.
          </p>
          <h2 className="text-4xl mt-4">Interactivity</h2>
          <p>
            If you log in, you can join the simulation and directly talk to different agents! After
            logging in, click the "Interact" button, and your character will appear somewhere on the
            map with a highlighted circle underneath you.
          </p>
          <p className="text-2xl mt-2">Controls:</p>
          <p className="mt-4">Click to navigate around.</p>
          <p className="mt-4">
            To talk to an agent, click on them and then click "Start conversation," which will ask
            them to start walking towards you. Once they're nearby, the conversation will start, and
            you can speak to each other. You can leave at any time by closing the conversation pane
            or moving away. They may propose a conversation to you - you'll see a button to accept
            in the messages panel.
          </p>
          <p className="mt-4">
            AI town only supports {MAX_HUMAN_PLAYERS} humans at a time. If you're idle for five
            minutes, you'll be automatically removed from the simulation.
          </p>
        </div>
      </ReactModal>

      <CompanionModal
        isOpen={companionModalOpen}
        onClose={() => setCompanionModalOpen(false)}
        onShowAgentsList={() => {
          setCompanionModalOpen(false);
          setCurrentView('companion');
        }}
      />

      {/*<div className="p-3 absolute top-0 right-0 z-10 text-2xl">
        <Authenticated>
          <UserButton afterSignOutUrl="/ai-town" />
        </Authenticated>

        <Unauthenticated>
          <LoginButton />
        </Unauthenticated>
      </div> */}

      <div className="w-full h-screen relative isolate overflow-hidden shadow-2xl flex flex-col justify-start">
        {/* Game/Agents content with frame */}
        <div className="flex-1 flex flex-col relative min-h-0">
          {currentView === 'game' ? (
            <Game />
          ) : currentView === 'agents' ? (
            worldId && <AgentsListView worldId={worldId} />
          ) : currentView === 'companion' ? (
            worldId && <CompanionPageView worldId={worldId} />
          ) : currentView === 'survey' ? (
            currentUser && (
              <SurveyView userId={currentUser.userId} onComplete={() => setCurrentView('game')} />
            )
          ) : currentView === 'settings' ? (
            currentUser && (
              <UserSettingsView
                userId={currentUser.userId}
                onLogout={handleLogout}
                onBack={() => setCurrentView('game')}
              />
            )
          ) : null}
        </div>

        {/* Footer buttons outside the frame */}
        <div className="flex-shrink-0 w-full flex items-center justify-between gap-2 p-3 bg-gradient-to-t from-black/80 to-transparent [&_.button]:scale-75">
          {/* Left side - Navigation buttons */}
          <div className="flex items-center gap-2">
            <ViewToggleButton
              currentView={currentView}
              onToggleView={setCurrentView}
              onShowCompanionModal={() => setCompanionModalOpen(true)}
            />
            <FreezeButton />
            <MusicButton />
            <Button href="https://github.com/a16z-infra/ai-town" imgUrl={starImg}>
              Star
            </Button>
            <InteractButton />
            <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
              Help
            </Button>
          </div>

          {/* Right side - User management and branding */}
          <div className="flex items-center gap-2">
            {isLoggedIn && currentUser ? (
              <UserManagement
                userId={currentUser.userId}
                onOpenSettings={() => setCurrentView('settings')}
              />
            ) : (
              <Button imgUrl={helpImg} onClick={() => setLoginModalOpen(true)}>
                Login
              </Button>
            )}
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
      {/* Login modal (appears when not logged in) */}
      <ReactModal
        isOpen={loginModalOpen}
        onRequestClose={() => setLoginModalOpen(false)}
        style={modalStyles}
        contentLabel="Login modal"
        ariaHideApp={false}
      >
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </ReactModal>
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
    maxWidth: '50%',

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};

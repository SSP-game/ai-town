import Button from './Button';
import gameViewImg from '../../../assets/help.svg'; // 临时使用help图标，你可以替换为更合适的图标
import agentsListImg from '../../../assets/star.svg'; // 临时使用star图标，你可以替换为更合适的图标

export type ViewMode = 'game' | 'agents' | 'companion' | 'survey' | 'settings' | 'lobby';

interface ViewToggleButtonProps {
  currentView: ViewMode;
  onToggleView: (view: ViewMode) => void;
  onShowCompanionModal?: () => void;
}

export default function ViewToggleButton({ currentView, onToggleView, onShowCompanionModal }: ViewToggleButtonProps) {
  const handleCompanionClick = () => {
    const userId = localStorage.getItem('userId');
    const selectedCompanion = localStorage.getItem('selectedCompanion');

    if (userId && selectedCompanion) {
      // User has a companion, switch to companion view to chat
      onToggleView('companion');
    } else {
      // User needs to login or select companion
      if (onShowCompanionModal) {
        onShowCompanionModal();
      }
    }
  };

  const handleSurveyClick = () => {
    const userId = localStorage.getItem('userId');

    if (userId) {
      // User is logged in, show survey
      onToggleView('survey');
    } else {
      // User needs to login first
      alert('Please login first to take the survey');
    }
  };

  const handleLobbyClick = () => {
    const userId = localStorage.getItem('userId');

    if (userId) {
      // User is logged in, show lobby
      onToggleView('lobby');
    } else {
      // User needs to login first
      alert('Please login first to join matchmaking');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        imgUrl={gameViewImg}
        onClick={() => onToggleView('game')}
        className={currentView === 'game' ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-black' : ''}
      >
        Game
      </Button>
      <Button
        imgUrl={agentsListImg}
        onClick={handleLobbyClick}
        className={currentView === 'lobby' ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-black' : ''}
      >
        Lobby
      </Button>
      <Button
        imgUrl={agentsListImg}
        onClick={() => onToggleView('agents')}
        className={currentView === 'agents' ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-black' : ''}
      >
        Agents
      </Button>
      <Button
        imgUrl={agentsListImg}
        onClick={handleCompanionClick}
        className={currentView === 'companion' ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-black' : ''}
      >
        Companion
      </Button>
      <Button
        imgUrl={gameViewImg}
        onClick={handleSurveyClick}
        className={currentView === 'survey' ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-black' : ''}
      >
        Survey
      </Button>
    </div>
  );
}

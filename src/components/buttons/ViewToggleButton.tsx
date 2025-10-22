import Button from './Button';
import gameViewImg from '../../../assets/help.svg'; // 临时使用help图标，你可以替换为更合适的图标
import agentsListImg from '../../../assets/star.svg'; // 临时使用star图标，你可以替换为更合适的图标

export type ViewMode = 'game' | 'agents' | 'companion' | 'survey' | 'settings';

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

  return (
    <div className="flex gap-2">
      <Button
        imgUrl={gameViewImg}
        onClick={() => onToggleView('game')}
        className={currentView === 'game' ? 'bg-blue-600' : ''}
      >
        Game
      </Button>
      <Button
        imgUrl={agentsListImg}
        onClick={() => onToggleView('agents')}
        className={currentView === 'agents' ? 'bg-blue-600' : ''}
      >
        Agents
      </Button>
      <Button
        imgUrl={agentsListImg}
        onClick={handleCompanionClick}
        className={currentView === 'companion' ? 'bg-blue-600' : ''}
      >
        Companion
      </Button>
      <Button
        imgUrl={gameViewImg}
        onClick={handleSurveyClick}
        className={currentView === 'survey' ? 'bg-green-600' : ''}
      >
        Survey
      </Button>
    </div>
  );
}

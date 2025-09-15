import Button from './Button';
import gameViewImg from '../../../assets/help.svg'; // 临时使用help图标，你可以替换为更合适的图标
import agentsListImg from '../../../assets/star.svg'; // 临时使用star图标，你可以替换为更合适的图标

export type ViewMode = 'game' | 'agents' | 'companion';

interface ViewToggleButtonProps {
  currentView: ViewMode;
  onToggleView: (view: ViewMode) => void;
}

export default function ViewToggleButton({ currentView, onToggleView }: ViewToggleButtonProps) {
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
        onClick={() => onToggleView('companion')}
        className={currentView === 'companion' ? 'bg-blue-600' : ''}
      >
        Companion
      </Button>
    </div>
  );
}

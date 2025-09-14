import Button from './Button';
import companionImg from '../../../assets/help.svg'; // 临时使用help图标，可以替换为聊天图标

export interface CompanionButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function CompanionButton({ onClick, disabled }: CompanionButtonProps) {
  return (
    <Button
      imgUrl={companionImg}
      onClick={onClick}
      className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      title="Chat with AI companions"
    >
      Companion
    </Button>
  );
}
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface UserManagementProps {
  userId: Id<'users'>;
  onOpenSettings: () => void;
}

export default function UserManagement({ userId, onOpenSettings }: UserManagementProps) {
  const userProfile = useQuery(api.users.getFullUserProfile, { userId });

  if (!userProfile) {
    return null;
  }

  return (
    <button
      onClick={onOpenSettings}
      className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto"
      title="User Settings"
    >
      <div className="h-full bg-clay-700 px-3 py-2">
        <span>👤 {userProfile.nickname}</span>
      </div>
    </button>
  );
}

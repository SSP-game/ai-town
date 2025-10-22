import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'react-toastify';
import { characters } from '../../data/characters';
import { Descriptions } from '../../data/characters';

interface UserSettingsViewProps {
  userId: Id<'users'>;
  onLogout: () => void;
  onBack: () => void;
}

function CharacterAvatar({
  character,
  characterName,
  size = 64,
}: {
  character: { textureUrl: string; spritesheetData?: any };
  characterName: string;
  size?: number;
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
      ctx.clearRect(0, 0, size, size);

      const frameData = character.spritesheetData?.frames?.down;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h, 0, 0, size, size);
      } else {
        const characterPositions: { [key: string]: { x: number; y: number } } = {
          f1: { x: 0, y: 0 },
          f2: { x: 32, y: 0 },
          f3: { x: 64, y: 0 },
          f4: { x: 96, y: 0 },
          f5: { x: 128, y: 0 },
          f6: { x: 160, y: 0 },
          f7: { x: 192, y: 0 },
          f8: { x: 224, y: 0 },
        };

        const pos = characterPositions[characterName] || { x: 0, y: 0 };
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, pos.x, pos.y, 32, 32, 0, 0, size, size);
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
  }, [character.textureUrl, character.spritesheetData, characterName, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
      style={{ imageRendering: 'pixelated', width: `${size}px`, height: `${size}px` }}
    />
  );
}

function CharacterAvatarOption({
  character,
  isSelected,
  onClick,
}: {
  character: { name: string; textureUrl: string; spritesheetData?: any };
  isSelected: boolean;
  onClick: () => void;
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
      ctx.clearRect(0, 0, 80, 80);
      const frameData = character.spritesheetData?.frames?.down;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h, 0, 0, 80, 80);
      } else {
        const characterPositions: { [key: string]: { x: number; y: number } } = {
          f1: { x: 0, y: 0 },
          f2: { x: 32, y: 0 },
          f3: { x: 64, y: 0 },
          f4: { x: 96, y: 0 },
          f5: { x: 128, y: 0 },
          f6: { x: 160, y: 0 },
          f7: { x: 192, y: 0 },
          f8: { x: 224, y: 0 },
        };

        const pos = characterPositions[character.name] || { x: 0, y: 0 };
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, pos.x, pos.y, 32, 32, 0, 0, 80, 80);
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
      className={`cursor-pointer border-4 rounded-lg p-3 transition-all hover:scale-105 ${
        isSelected
          ? 'border-blue-500 bg-blue-900/50 shadow-lg shadow-blue-500/50'
          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
      }`}
      onClick={onClick}
      title={character.name.toUpperCase()}
    >
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        className={`block mx-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
        style={{ imageRendering: 'pixelated', width: '80px', height: '80px' }}
      />
      <div className="text-center mt-2 text-sm font-bold text-white">
        {character.name.toUpperCase()}
      </div>
    </div>
  );
}

export default function UserSettingsView({ userId, onLogout, onBack }: UserSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [selectedCharacterForEdit, setSelectedCharacterForEdit] = useState<string>('');

  // Queries
  const userProfile = useQuery(api.users.getFullUserProfile, { userId });

  // Mutations
  const updateProfileMutation = useMutation(api.users.updateUserProfile);
  const changePasswordMutation = useMutation(api.users.changePassword);
  const deactivateAccountMutation = useMutation(api.users.deactivateAccount);
  const updateCharacterMutation = useMutation(api.users.updateSelectedCharacter);

  // Form states
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    mbti: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmDelete: false,
  });

  // Update form when user profile loads
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        nickname: userProfile.nickname || '',
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        gender: userProfile.gender || '',
        mbti: userProfile.mbti || '',
        bio: userProfile.bio || '',
      });
      setSelectedCharacterForEdit(userProfile.selectedCharacter || characters[0].name);
    }
  }, [userProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile information
      await updateProfileMutation({
        userId,
        updates: {
          nickname: profileForm.nickname || undefined,
          firstName: profileForm.firstName || undefined,
          lastName: profileForm.lastName || undefined,
          dateOfBirth: profileForm.dateOfBirth || undefined,
          gender: profileForm.gender || undefined,
          mbti: profileForm.mbti || undefined,
          bio: profileForm.bio || undefined,
        },
      });

      // Update character if changed
      if (selectedCharacterForEdit !== userProfile?.selectedCharacter) {
        await updateCharacterMutation({ userId, character: selectedCharacterForEdit });
        localStorage.setItem('selectedCharacter', selectedCharacterForEdit);
      }

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await changePasswordMutation({
        userId,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!deleteForm.confirmDelete) {
      toast.error('Please confirm account deletion');
      setLoading(false);
      return;
    }

    try {
      await deactivateAccountMutation({
        userId,
        password: deleteForm.password,
      });

      toast.success('Account deactivated successfully');
      onLogout();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('selectedCompanion');
    toast.success('Logged out successfully');
    onLogout();
  };

  if (!userProfile) {
    return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-gray-300 hover:text-white text-2xl transition-colors"
                title="Back to game"
              >
                ← Back
              </button>
              <h1 className="text-4xl font-bold">User Settings</h1>
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex items-center gap-6 bg-gray-800 p-6 rounded-lg border-2 border-gray-700">
            {/* Character Avatar */}
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {userProfile.selectedCharacter ? (() => {
                const character = characters.find((c) => c.name === userProfile.selectedCharacter);
                return character?.textureUrl ? (
                  <CharacterAvatar
                    character={character}
                    characterName={userProfile.selectedCharacter}
                    size={96}
                  />
                ) : (
                  <div className="text-4xl text-gray-300">👤</div>
                );
              })() : (
                <div className="text-4xl text-gray-300">👤</div>
              )}
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{userProfile.nickname}</h2>
                {userProfile.selectedCharacter && (() => {
                  const staticDescription = Descriptions.find((d) => d.character === userProfile.selectedCharacter);
                  return staticDescription && (
                    <span className="text-sm bg-blue-600 px-3 py-1 rounded">
                      {staticDescription.name}
                    </span>
                  );
                })()}
              </div>
              <p className="text-gray-300 text-lg mb-2">
                {userProfile.firstName && userProfile.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : userProfile.email}
              </p>
              {userProfile.bio && (
                <p className="text-gray-400">{userProfile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-gray-700">
          {[
            { key: 'profile', label: 'Profile', icon: '👤' },
            { key: 'account', label: 'Account', icon: '⚙️' },
            { key: 'password', label: 'Password', icon: '🔒' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-lg font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-white border-b-4 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">
                    Nickname *
                  </label>
                  <input
                    type="text"
                    value={profileForm.nickname}
                    onChange={(e) => setProfileForm(prev => ({...prev, nickname: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                    required
                    minLength={2}
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">
                    Gender
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm(prev => ({...prev, gender: e.target.value as any}))}
                    className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm(prev => ({...prev, dateOfBirth: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">
                    MBTI Personality Type
                  </label>
                  <select
                    value={profileForm.mbti}
                    onChange={(e) => setProfileForm(prev => ({...prev, mbti: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select MBTI type</option>
                    <option value="INTJ">INTJ - Architect</option>
                    <option value="INTP">INTP - Logician</option>
                    <option value="ENTJ">ENTJ - Commander</option>
                    <option value="ENTP">ENTP - Debater</option>
                    <option value="INFJ">INFJ - Advocate</option>
                    <option value="INFP">INFP - Mediator</option>
                    <option value="ENFJ">ENFJ - Protagonist</option>
                    <option value="ENFP">ENFP - Campaigner</option>
                    <option value="ISTJ">ISTJ - Logistician</option>
                    <option value="ISFJ">ISFJ - Defender</option>
                    <option value="ESTJ">ESTJ - Executive</option>
                    <option value="ESFJ">ESFJ - Consul</option>
                    <option value="ISTP">ISTP - Virtuoso</option>
                    <option value="ISFP">ISFP - Adventurer</option>
                    <option value="ESTP">ESTP - Entrepreneur</option>
                    <option value="ESFP">ESFP - Entertainer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({...prev, bio: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Character Selection */}
              <div>
                <label className="block text-gray-200 text-xl font-bold mb-4">
                  Select Your Avatar
                </label>
                <div className="p-6 bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {characters.map((character) => (
                      <CharacterAvatarOption
                        key={character.name}
                        character={character}
                        isSelected={selectedCharacterForEdit === character.name}
                        onClick={() => setSelectedCharacterForEdit(character.name)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:border-blue-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Account Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-200"><strong>Email:</strong> {userProfile.email}</p>
                  <p className="text-gray-200"><strong>Member since:</strong> {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                  {userProfile.lastLoginAt && (
                    <p className="text-gray-200"><strong>Last login:</strong> {new Date(userProfile.lastLoginAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <button
                  onClick={handleLogout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-bold transition-colors"
                >
                  Logout
                </button>
              </div>

              <div className="bg-red-900 p-6 rounded-lg border-2 border-red-700">
                <h3 className="text-xl font-bold text-red-100 mb-4">⚠️ Danger Zone</h3>
                <form onSubmit={handleAccountDelete} className="space-y-4">
                  <div>
                    <label className="block text-red-200 text-sm font-bold mb-2">
                      Enter your password to deactivate account
                    </label>
                    <input
                      type="password"
                      value={deleteForm.password}
                      onChange={(e) => setDeleteForm(prev => ({...prev, password: e.target.value}))}
                      className="w-full px-4 py-3 border border-red-600 rounded bg-red-800 text-red-100 focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deleteForm.confirmDelete}
                      onChange={(e) => setDeleteForm(prev => ({...prev, confirmDelete: e.target.checked}))}
                      className="mr-3 w-5 h-5"
                      required
                    />
                    <span className="text-red-200">
                      I understand that this action cannot be undone
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                      loading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-red-700 hover:bg-red-800 active:scale-95'
                    }`}
                  >
                    {loading ? 'Deactivating...' : 'Deactivate Account'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

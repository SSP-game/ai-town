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
      className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
        isSelected
          ? 'border-yellow-400 bg-yellow-200 text-brown-900'
          : 'border-brown-600 bg-brown-900/60 text-brown-200 hover:border-brown-400'
      }`}
      onClick={onClick}
      title={character.name.toUpperCase()}
    >
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        className={`block mx-auto rounded ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
        style={{ imageRendering: 'pixelated', width: '64px', height: '64px' }}
      />
      <div className="text-center mt-1 text-xs font-semibold tracking-wide">
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
    experimentConsent: false,
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
        experimentConsent: userProfile.experimentConsent || false,
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
          experimentConsent: profileForm.experimentConsent,
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
    return <div className="min-h-screen bg-brown-900 text-brown-100 p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-brown-900 text-brown-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-brown-300 hover:text-brown-100 text-2xl transition-colors"
                title="Back to game"
              >
                ← Back
              </button>
              <h1 className="text-4xl font-display text-brown-100">Participant Profile</h1>
            </div>
          </div>

          {/* Description */}
          <div className="text-center mb-6">
            <p className="text-brown-300 text-sm">
              We use this information to personalise your AI companion and anonymise results.
            </p>
          </div>

          {/* User Info Section */}
          <div className="box bg-brown-800">
            <div className="flex items-center gap-6 p-6">
              {/* Character Avatar */}
              <div className="w-24 h-24 bg-brown-700 rounded-full flex items-center justify-center overflow-hidden">
                {userProfile.selectedCharacter ? (() => {
                  const character = characters.find((c) => c.name === userProfile.selectedCharacter);
                  return character?.textureUrl ? (
                    <CharacterAvatar
                      character={character}
                      characterName={userProfile.selectedCharacter}
                      size={96}
                    />
                  ) : (
                    <div className="text-4xl text-brown-300">👤</div>
                  );
                })() : (
                  <div className="text-4xl text-brown-300">👤</div>
                )}
              </div>

              {/* User Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-display text-brown-100 mb-2">{userProfile.nickname}</h2>
                <p className="text-brown-200 text-lg mb-2">
                  {userProfile.firstName && userProfile.lastName
                    ? `${userProfile.firstName} ${userProfile.lastName}`
                    : userProfile.email}
                </p>
                {userProfile.bio && (
                  <p className="text-brown-300">{userProfile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-brown-700">
          {[
            { key: 'profile', label: 'Profile', icon: '👤' },
            { key: 'account', label: 'Account', icon: '⚙️' },
            { key: 'password', label: 'Password', icon: '🔒' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-lg font-display transition-all ${
                activeTab === tab.key
                  ? 'bg-brown-700 text-brown-100 border-b-4 border-clay-600'
                  : 'text-brown-400 hover:text-brown-100 hover:bg-brown-800'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="box bg-brown-800 p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-brown-200 text-sm font-semibold mb-2">
                    Nickname *
                  </label>
                  <input
                    type="text"
                    value={profileForm.nickname}
                    onChange={(e) => setProfileForm(prev => ({...prev, nickname: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                    required
                    minLength={2}
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-semibold mb-2">
                    Gender
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm(prev => ({...prev, gender: e.target.value as any}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 focus:border-brown-400 focus:outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-semibold mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-semibold mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-semibold mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm(prev => ({...prev, dateOfBirth: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-semibold mb-2">
                    MBTI Personality Type
                  </label>
                  <select
                    value={profileForm.mbti}
                    onChange={(e) => setProfileForm(prev => ({...prev, mbti: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
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
                <label className="block text-brown-200 text-sm font-semibold mb-2">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({...prev, bio: e.target.value}))}
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Character Selection */}
              <div>
                <label className="block text-brown-200 text-xl font-display mb-4">
                  Select Your Avatar
                </label>
                <div className="p-4 bg-brown-700 rounded-lg">
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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

              {/* Experiment Consent */}
              <label className="flex items-start gap-3 bg-brown-900/40 border border-brown-700 rounded p-4">
                <input
                  type="checkbox"
                  checked={profileForm.experimentConsent}
                  onChange={(e) => setProfileForm(prev => ({...prev, experimentConsent: e.target.checked}))}
                  className="mt-1"
                />
                <span className="text-sm text-brown-200">
                  I consent to participate in this study. I understand my responses will be stored
                  anonymously and can be withdrawn at any time.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full button text-white shadow-solid text-lg cursor-pointer"
              >
                <div className="h-full bg-clay-700 text-center py-3">
                  <span>{loading ? 'Updating...' : 'Update Profile'}</span>
                </div>
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-brown-200 text-sm font-semibold mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-brown-200 text-sm font-semibold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-brown-200 text-sm font-semibold mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:border-brown-400 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full button text-white shadow-solid text-lg cursor-pointer"
              >
                <div className="h-full bg-clay-700 text-center py-3">
                  <span>{loading ? 'Changing...' : 'Change Password'}</span>
                </div>
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-brown-700 p-6 rounded-lg">
                <h3 className="text-xl font-display text-brown-100 mb-4">Account Information</h3>
                <div className="space-y-2">
                  <p className="text-brown-200"><strong>Email:</strong> {userProfile.email}</p>
                  <p className="text-brown-200"><strong>Member since:</strong> {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                  {userProfile.lastLoginAt && (
                    <p className="text-brown-200"><strong>Last login:</strong> {new Date(userProfile.lastLoginAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="bg-brown-700 p-6 rounded-lg">
                <h3 className="text-xl font-display text-brown-100 mb-4">Quick Actions</h3>
                <button
                  onClick={handleLogout}
                  className="w-full button text-white shadow-solid text-lg cursor-pointer"
                >
                  <div className="h-full bg-clay-700 text-center py-3">
                    <span>Logout</span>
                  </div>
                </button>
              </div>

              <div className="bg-red-900/60 p-6 rounded-lg border-2 border-red-700">
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
                    className="w-full button text-white shadow-solid text-lg cursor-pointer"
                  >
                    <div className={`h-full text-center py-3 ${loading ? 'bg-gray-600' : 'bg-red-700'}`}>
                      <span>{loading ? 'Deactivating...' : 'Deactivate Account'}</span>
                    </div>
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

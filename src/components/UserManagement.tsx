import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'react-toastify';
import ReactModal from 'react-modal';
import { characters } from '../../data/characters';
import { Descriptions } from '../../data/characters';
import CharacterSelectionModal from './CharacterSelectionModal';

interface UserManagementProps {
  userId: Id<"users">;
  onLogout: () => void;
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

export default function UserManagement({ userId, onLogout }: UserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

  // Queries
  const userProfile = useQuery(api.users.getFullUserProfile, { userId });

  // Mutations
  const updateProfileMutation = useMutation(api.users.updateUserProfile);
  const changePasswordMutation = useMutation(api.users.changePassword);
  const deactivateAccountMutation = useMutation(api.users.deactivateAccount);

  // Form states
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
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
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfileMutation({
        userId,
        updates: {
          nickname: profileForm.nickname || undefined,
          firstName: profileForm.firstName || undefined,
          lastName: profileForm.lastName || undefined,
          dateOfBirth: profileForm.dateOfBirth || undefined,
          gender: profileForm.gender || undefined,
          bio: profileForm.bio || undefined,
        },
      });

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
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto"
        title="User Settings"
      >
        <div className="h-full bg-clay-700 px-3 py-2">
          <span>👤 {userProfile.nickname}</span>
        </div>
      </button>

      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgb(0, 0, 0, 75%)',
            zIndex: 20,
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            border: '10px solid rgb(23, 20, 33)',
            borderRadius: '0',
            background: 'rgb(35, 38, 58)',
            color: 'white',
            fontFamily: '"Upheaval Pro", "sans-serif"',
            padding: 0,
          },
        }}
        contentLabel="User Management"
        ariaHideApp={false}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-brown-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-display text-brown-100 tracking-wider">
                User Settings
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-brown-300 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* User Info Section */}
            {userProfile && (
              <div className="flex items-center gap-4 bg-brown-600 p-3 rounded">
                {/* Character Avatar */}
                <div className="w-16 h-16 bg-brown-500 rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile.selectedCharacter ? (() => {
                    const character = characters.find((c) => c.name === userProfile.selectedCharacter);
                    const staticDescription = Descriptions.find((d) => d.character === userProfile.selectedCharacter);

                    return character?.textureUrl ? (
                      <CharacterAvatar
                        character={character}
                        characterName={userProfile.selectedCharacter}
                        size={64}
                      />
                    ) : (
                      <div className="text-2xl text-brown-300">👤</div>
                    );
                  })() : (
                    <div className="text-2xl text-brown-300">👤</div>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-brown-100">{userProfile.nickname}</h3>
                    {userProfile.selectedCharacter && (() => {
                      const staticDescription = Descriptions.find((d) => d.character === userProfile.selectedCharacter);
                      return staticDescription && (
                        <span className="text-sm bg-brown-500 px-2 py-1 rounded text-brown-100">
                          {staticDescription.name}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-brown-200 text-sm">
                    {userProfile.firstName && userProfile.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : userProfile.email}
                  </p>
                  {userProfile.bio && (
                    <p className="text-brown-300 text-xs mt-1 line-clamp-2">
                      {userProfile.bio}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-brown-800 px-4 flex gap-2">
            {[
              { key: 'profile', label: 'Profile' },
              { key: 'account', label: 'Account' },
              { key: 'password', label: 'Password' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-bold ${
                  activeTab === tab.key
                    ? 'bg-brown-600 text-white'
                    : 'text-brown-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto bg-brown-800">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brown-200 text-sm font-bold mb-2">
                      Nickname *
                    </label>
                    <input
                      type="text"
                      value={profileForm.nickname}
                      onChange={(e) => setProfileForm(prev => ({...prev, nickname: e.target.value}))}
                      className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                      required
                      minLength={2}
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-brown-200 text-sm font-bold mb-2">
                      Gender
                    </label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm(prev => ({...prev, gender: e.target.value as any}))}
                      className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-brown-200 text-sm font-bold mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    />
                  </div>

                  <div>
                    <label className="block text-brown-200 text-sm font-bold mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    />
                  </div>

                  <div>
                    <label className="block text-brown-200 text-sm font-bold mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm(prev => ({...prev, dateOfBirth: e.target.value}))}
                      className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-bold mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({...prev, bio: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    rows={3}
                    maxLength={500}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Character Selection */}
                <div>
                  <label className="block text-brown-200 text-sm font-bold mb-2">
                    Avatar Character
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {userProfile?.selectedCharacter ? (() => {
                        const character = characters.find((c) => c.name === userProfile.selectedCharacter);
                        const staticDescription = Descriptions.find((d) => d.character === userProfile.selectedCharacter);
                        return character ? (
                          <CharacterAvatar
                            character={character}
                            characterName={userProfile.selectedCharacter}
                            size={48}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-brown-600 rounded flex items-center justify-center">
                            <span className="text-brown-300">👤</span>
                          </div>
                        );
                      })() : (
                        <div className="w-12 h-12 bg-brown-600 rounded flex items-center justify-center">
                          <span className="text-brown-300">👤</span>
                        </div>
                      )}
                      <div>
                        <p className="text-brown-100 font-medium">
                          {userProfile?.selectedCharacter ?
                            (() => {
                              const staticDescription = Descriptions.find((d) => d.character === userProfile.selectedCharacter);
                              return staticDescription ? staticDescription.name : userProfile.selectedCharacter.toUpperCase();
                            })() :
                            'No character selected'
                          }
                        </p>
                        <p className="text-brown-300 text-sm">
                          {userProfile?.selectedCharacter ? userProfile.selectedCharacter.toUpperCase() : 'Select an avatar to appear in game'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false); // 先关闭用户管理模态
                        setIsCharacterModalOpen(true); // 然后打开角色选择模态
                      }}
                      className="bg-brown-600 hover:bg-brown-500 text-brown-100 py-2 px-4 rounded text-sm font-bold"
                    >
                      {userProfile?.selectedCharacter ? 'Change Avatar' : 'Select Avatar'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto"
                >
                  <div className="h-full bg-clay-700 px-4 py-2">
                    <span>{loading ? 'Updating...' : 'Update Profile'}</span>
                  </div>
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-brown-200 text-sm font-bold mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-bold mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-brown-200 text-sm font-bold mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto"
                >
                  <div className="h-full bg-clay-700 px-4 py-2">
                    <span>{loading ? 'Changing...' : 'Change Password'}</span>
                  </div>
                </button>
              </form>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-brown-700 p-4 rounded">
                  <h3 className="text-lg font-bold text-brown-100 mb-2">Account Information</h3>
                  <p className="text-brown-200"><strong>Email:</strong> {userProfile.email}</p>
                  <p className="text-brown-200"><strong>Member since:</strong> {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                  {userProfile.lastLoginAt && (
                    <p className="text-brown-200"><strong>Last login:</strong> {new Date(userProfile.lastLoginAt).toLocaleDateString()}</p>
                  )}
                </div>

                <div className="bg-brown-700 p-4 rounded">
                  <h3 className="text-lg font-bold text-brown-100 mb-4">Quick Actions</h3>
                  <button
                    onClick={handleLogout}
                    className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto mb-4 w-full"
                  >
                    <div className="h-full bg-blue-700 px-4 py-2">
                      <span>Logout</span>
                    </div>
                  </button>
                </div>

                <div className="bg-red-900 p-4 rounded">
                  <h3 className="text-lg font-bold text-red-100 mb-4">Danger Zone</h3>
                  <form onSubmit={handleAccountDelete} className="space-y-4">
                    <div>
                      <label className="block text-red-200 text-sm font-bold mb-2">
                        Enter your password to deactivate account
                      </label>
                      <input
                        type="password"
                        value={deleteForm.password}
                        onChange={(e) => setDeleteForm(prev => ({...prev, password: e.target.value}))}
                        className="w-full px-3 py-2 border border-red-600 rounded bg-red-800 text-red-100"
                        required
                      />
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={deleteForm.confirmDelete}
                        onChange={(e) => setDeleteForm(prev => ({...prev, confirmDelete: e.target.checked}))}
                        className="mr-2"
                        required
                      />
                      <span className="text-red-200 text-sm">
                        I understand that this action cannot be undone
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto w-full"
                    >
                      <div className="h-full bg-red-700 px-4 py-2">
                        <span>{loading ? 'Deactivating...' : 'Deactivate Account'}</span>
                      </div>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </ReactModal>

      {/* Character Selection Modal */}
      <CharacterSelectionModal
        isOpen={isCharacterModalOpen}
        onClose={() => {
          // 取消角色选择时，关闭角色模态并重新打开用户管理模态
          setIsCharacterModalOpen(false);
          setIsModalOpen(true);
        }}
        userId={userId}
        currentCharacter={userProfile?.selectedCharacter}
        onCharacterSelected={() => {
          // 角色选择完成后，关闭角色模态并重新打开用户管理模态
          setIsCharacterModalOpen(false);
          setIsModalOpen(true);
        }}
      />
    </>
  );
}
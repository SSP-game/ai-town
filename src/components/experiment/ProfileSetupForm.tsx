import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { characters } from '../../../data/characters';
import { toast } from 'react-toastify';

type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say';

interface ProfileSetupFormProps {
  userId: Id<'users'>;
  profile?: {
    nickname?: string;
    gender?: GenderOption;
    dateOfBirth?: string;
    mbti?: string;
    bio?: string;
    avatar?: string;
    experimentConsent?: boolean;
  };
  onComplete: () => void;
}

export default function ProfileSetupForm({ userId, profile, onComplete }: ProfileSetupFormProps) {
  const [formState, setFormState] = useState({
    nickname: profile?.nickname ?? '',
    gender: (profile?.gender as GenderOption) ?? 'prefer_not_to_say',
    dateOfBirth: profile?.dateOfBirth ?? '',
    mbti: profile?.mbti ?? '',
    bio: profile?.bio ?? '',
    avatar: profile?.avatar ?? characters[0]?.name ?? 'f1',
    experimentConsent: profile?.experimentConsent ?? false,
  });
  const [submitting, setSubmitting] = useState(false);

  const completeProfile = useMutation(api.users.completeProfile);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target;
    let value: string | boolean = target.value;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      value = target.checked;
    }
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nickname.trim()) {
      toast.error('Please choose a nickname.');
      return;
    }
    setSubmitting(true);
    try {
      await completeProfile({
        userId,
        nickname: formState.nickname.trim(),
        gender: formState.gender,
        dateOfBirth: formState.dateOfBirth || undefined,
        mbti: formState.mbti || undefined,
        bio: formState.bio || undefined,
        avatar: formState.avatar,
        experimentConsent: formState.experimentConsent,
      });
      toast.success('Profile saved.');
      onComplete();
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto">
      <div className="box bg-brown-800">
        <div className="bg-brown-700 p-4 text-center">
          <h2 className="text-3xl font-display text-brown-100">Participant Profile</h2>
          <p className="text-brown-300 mt-2 text-sm">
            We use this information to personalise your AI companion and anonymise results.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-brown-200 text-sm font-semibold mb-2">Nickname</label>
            <input
              type="text"
              name="nickname"
              value={formState.nickname}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={20}
              className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:outline-none focus:border-brown-400"
              placeholder="How should we address you in the study?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-brown-200 text-sm font-semibold mb-2">Gender</label>
              <select
                name="gender"
                value={formState.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 focus:outline-none focus:border-brown-400"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-brown-200 text-sm font-semibold mb-2">Birth date</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formState.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 focus:outline-none focus:border-brown-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-brown-200 text-sm font-semibold mb-2">MBTI</label>
              <input
                type="text"
                name="mbti"
                value={formState.mbti}
                onChange={handleChange}
                placeholder="e.g. INFP"
                className="w-full px-3 py-2 uppercase border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:outline-none focus:border-brown-400"
              />
            </div>
            <div>
              <label className="block text-brown-200 text-sm font-semibold mb-2">Avatar</label>
              <select
                name="avatar"
                value={formState.avatar}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 focus:outline-none focus:border-brown-400"
              >
                {characters.map((character) => (
                  <option key={character.name} value={character.name}>
                    {character.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-brown-200 text-sm font-semibold mb-2">Short bio</label>
            <textarea
              name="bio"
              value={formState.bio}
              onChange={handleChange}
              placeholder="Share a sentence or two about yourself."
              rows={4}
              className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:outline-none focus:border-brown-400"
            />
          </div>

          <label className="flex items-start gap-3 bg-brown-900/40 border border-brown-700 rounded p-4">
            <input
              type="checkbox"
              name="experimentConsent"
              checked={formState.experimentConsent}
              onChange={handleChange}
              className="mt-1"
            />
            <span className="text-sm text-brown-200">
              I consent to participate in this study. I understand my responses will be stored
              anonymously and can be withdrawn at any time.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !formState.experimentConsent}
            className="w-full button text-white shadow-solid text-lg cursor-pointer pointer-events-auto"
          >
            <div className="h-full bg-clay-700 text-center py-3">
              <span>{submitting ? 'Saving...' : 'Save and Continue'}</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}

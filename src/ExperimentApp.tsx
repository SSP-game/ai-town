import { useEffect, useMemo, useState } from 'react';
import AuthPage from './components/AuthPage';
import ProfileSetupForm from './components/experiment/ProfileSetupForm';
import IntroductionStep from './components/experiment/IntroductionStep';
import QuestionnaireStep from './components/experiment/QuestionnaireStep';
import LobbyWaitingRoom from './components/experiment/LobbyWaitingRoom';
import SessionView from './components/experiment/SessionView';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { toast } from 'react-toastify';

type ExperimentPhase =
  | 'auth'
  | 'profile'
  | 'intro'
  | 'questionnaire'
  | 'lobby'
  | 'paired_chat'
  | 'free_roam'
  | 'loading';

interface CurrentUserState {
  userId: Id<'users'>;
  nickname: string;
  email: string;
  selectedCharacter?: string;
  selectedCompanion?: string;
  profileCompletedAt?: number | null;
}

export default function ExperimentApp() {
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(null);
  const [introAcknowledged, setIntroAcknowledged] = useState(false);
  const [joinedLobbyId, setJoinedLobbyId] = useState<Id<'lobbies'> | null>(null);

  const activeConfig = useQuery(api.experiment.config.getActiveConfig, {});

  const userProfile = useQuery(
    api.users.getUserProfile,
    currentUser ? { userId: currentUser.userId } : 'skip',
  );

  const sessionState = useQuery(
    api.experiment.sessions.userSessionState,
    currentUser ? { userId: currentUser.userId } : 'skip',
  );

  const lobbyId = sessionState?.membership?.lobbyId ?? joinedLobbyId;
  const lobbyState = useQuery(
    api.experiment.lobby.watchLobby,
    lobbyId && currentUser ? { lobbyId, userId: currentUser.userId } : 'skip',
  );

  const joinLobby = useMutation(api.experiment.lobby.joinLobby);
  const setReadyStatus = useMutation(api.experiment.lobby.setReadyStatus);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    const storedNickname = localStorage.getItem('userNickname');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedId && storedNickname && storedEmail) {
      setCurrentUser({
        userId: storedId as Id<'users'>,
        nickname: storedNickname,
        email: storedEmail,
      });
    }
  }, []);

  useEffect(() => {
    if (sessionState?.membership?.questionnaireCompletedAt) {
      setIntroAcknowledged(true);
    }
  }, [sessionState?.membership?.questionnaireCompletedAt]);

  const phase: ExperimentPhase = useMemo(() => {
    if (!currentUser) return 'auth';
    if (!userProfile) return 'loading';
    if (!userProfile.profileCompletedAt) return 'profile';
    if (!introAcknowledged && !sessionState?.membership?.questionnaireCompletedAt) return 'intro';
    if (!sessionState?.membership?.questionnaireCompletedAt) return 'questionnaire';
    if (lobbyState?.status === 'paired_chat') return 'paired_chat';
    if (lobbyState?.status === 'free_roam') return 'free_roam';
    return 'lobby';
  }, [currentUser, userProfile, introAcknowledged, sessionState, lobbyState]);

  const handleLoginSuccess = (userData: {
    userId: string;
    nickname: string;
    email: string;
    selectedCharacter?: string;
    selectedCompanion?: string;
    profileCompletedAt?: number | null;
  }) => {
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userNickname', userData.nickname);
    localStorage.setItem('userEmail', userData.email);
    setCurrentUser({
      userId: userData.userId as Id<'users'>,
      nickname: userData.nickname,
      email: userData.email,
      selectedCharacter: userData.selectedCharacter,
      selectedCompanion: userData.selectedCompanion,
      profileCompletedAt: userData.profileCompletedAt ?? undefined,
    });
  };

  const handleQuestionnaireComplete = async (submittedAt: number) => {
    if (!currentUser || !activeConfig) return;
    try {
      const onboardingCompletedAt = userProfile?.profileCompletedAt ?? submittedAt;
      const { lobbyId } = await joinLobby({
        userId: currentUser.userId,
        configId: activeConfig._id,
        onboardingCompletedAt,
        questionnaireCompletedAt: submittedAt,
      });
      setJoinedLobbyId(lobbyId);
      setIntroAcknowledged(true);
      toast.success('Joined the lobby. Press ready when you are prepared to begin.');
    } catch (error: any) {
      toast.error(error.message ?? 'Unable to join lobby');
    }
  };

  const handleReadyToggle = async (ready: boolean) => {
    if (!lobbyId || !currentUser) return;
    try {
      await setReadyStatus({ lobbyId, userId: currentUser.userId, ready });
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to update ready status');
    }
  };

  if (phase === 'auth') {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (phase === 'loading' || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brown-100">
        <p>Loading…</p>
      </div>
    );
  }

  if (phase === 'profile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brown-900 px-4 py-12">
        <ProfileSetupForm
          userId={currentUser.userId}
          profile={{
            nickname: userProfile?.nickname,
            gender: userProfile?.gender,
            dateOfBirth: userProfile?.dateOfBirth ?? undefined,
            mbti: userProfile?.mbti ?? undefined,
            bio: userProfile?.bio ?? undefined,
            avatar: userProfile?.avatar ?? undefined,
            experimentConsent: userProfile?.experimentConsent ?? false,
          }}
          onComplete={() => {
            setIntroAcknowledged(false);
          }}
        />
      </div>
    );
  }

  if (!activeConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brown-100">
        <p>No experiment configuration found.</p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brown-900 px-4 py-12">
        <IntroductionStep
          introduction={activeConfig.introduction}
          onContinue={() => setIntroAcknowledged(true)}
        />
      </div>
    );
  }

  if (phase === 'questionnaire') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brown-900 px-4 py-12">
        <QuestionnaireStep
          configId={activeConfig._id}
          userId={currentUser.userId}
          onCompleted={handleQuestionnaireComplete}
        />
      </div>
    );
  }

  if (phase === 'lobby') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brown-900 px-4 py-12">
        {lobbyState ? (
          <LobbyWaitingRoom lobbyState={lobbyState} onReadyChange={handleReadyToggle} />
        ) : (
          <div className="text-brown-200">Connecting to lobby…</div>
        )}
      </div>
    );
  }

  if (phase === 'paired_chat' || phase === 'free_roam') {
    const worldId = lobbyState?.lobbyId && lobbyState?.status ? sessionState?.lobby?.worldId : null;
    if (!worldId) {
      return (
        <div className="min-h-screen flex items-center justify-center text-brown-100">
          <p>Loading world…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-brown-900 text-brown-100">
        <SessionView
          userId={currentUser.userId}
          worldId={worldId as Id<'worlds'>}
          phase={phase}
          assignment={sessionState?.assignment}
          pairedChatEndsAt={lobbyState?.pairedChatEndsAt ?? sessionState?.session?.pairedChatEndsAt ?? null}
        />
      </div>
    );
  }

  return null;
}

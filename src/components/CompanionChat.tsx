import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'react-toastify';

interface CompanionChatProps {
  agentId: string;
  agentName: string;
  userId: Id<'users'>;
  worldId: Id<'worlds'>;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export default function CompanionChat({ agentId, agentName, userId, worldId }: CompanionChatProps) {
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState<Id<'userAgentChats'> | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  const createOrGetChatMutation = useMutation(api.users.createOrGetChat);
  const addMessageMutation = useMutation(api.users.addChatMessage);
  const chatHistory = useQuery(
    api.users.getChatHistory,
    userId && agentId ? { userId, agentId } : 'skip',
  );

  useEffect(() => {
    if (userId && agentId && worldId && !chatId) {
      createOrGetChatMutation({ userId, agentId, worldId }).then(setChatId);
    }
  }, [userId, agentId, worldId, chatId, createOrGetChatMutation]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId || loading) return;

    const messageContent = message.trim();
    setMessage('');
    setLoading(true);

    try {
      await addMessageMutation({
        chatId,
        sender: 'user',
        content: messageContent,
      });
      // LLM reply will be appended by the server; keep loading until it arrives.
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
      setLoading(false);
    }
  };

  // Turn off loading once an agent reply appears
  useEffect(() => {
    if (!chatHistory || chatHistory.length === 0) return;
    const last = chatHistory[chatHistory.length - 1];
    if (last.sender === 'agent') {
      setLoading(false);
    }
  }, [chatHistory]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="shrink-0">
        <div className="box w-full">
          <h2 className="bg-brown-700 p-2 font-display text-2xl sm:text-4xl tracking-wider shadow-solid text-center">
            {agentName}
          </h2>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mt-6" ref={scrollViewRef}>
        <div className="chats text-base sm:text-sm">
          <div className="bg-brown-200 text-black p-2">
            {!chatHistory || chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brown-700 mb-2">Start a conversation with {agentName}!</p>
                <p className="text-brown-700 text-sm">Your chat history will be saved.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg: Message) => (
                  <div key={msg.id} className="leading-tight mb-6">
                    <div className="flex gap-4">
                      <span className="uppercase flex-grow">
                        {msg.sender === 'user' ? 'You' : agentName}
                      </span>
                      <time dateTime={msg.timestamp.toString()}>{formatTime(msg.timestamp)}</time>
                    </div>
                    <div className={`bubble ${msg.sender === 'user' ? 'bubble-mine' : ''}`}>
                      <p className="bg-white -mx-3 -my-1">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="leading-tight mb-6">
                    <div className="flex gap-4">
                      <span className="uppercase flex-grow">{agentName}</span>
                      <time dateTime={Date.now().toString()}>{formatTime(Date.now())}</time>
                    </div>
                    <div className="bubble">
                      <p className="bg-white -mx-3 -my-1">
                        <i>typing...</i>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message Input as bubble - always visible */}
            <form onSubmit={handleSendMessage}>
              <div className="leading-tight mb-6">
                <div className="flex gap-4">
                  <span className="uppercase flex-grow">You</span>
                </div>
                <div className="bubble bubble-mine">
                  <input
                    type="text"
                    name="companion-chat-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type here..."
                    className="bg-white -mx-3 -my-1 w-full p-0 m-0"
                    disabled={loading || !chatId}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    style={{
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

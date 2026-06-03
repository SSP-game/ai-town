import { useState, useRef, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Button from './buttons/Button';
import { toast } from 'react-toastify';
import { Id } from '../../convex/_generated/dataModel';

interface AgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  userId: Id<"users">;
  worldId: Id<"worlds">;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export default function AgentChatModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  userId,
  worldId
}: AgentChatModalProps) {
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState<Id<"userAgentChats"> | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createOrGetChatMutation = useMutation(api.users.createOrGetChat);
  const addMessageMutation = useMutation(api.users.addChatMessage);
  const chatHistory = useQuery(api.users.getChatHistory,
    userId && agentId ? { userId, agentId } : 'skip'
  );

  useEffect(() => {
    if (isOpen && userId && agentId && worldId && !chatId) {
      createOrGetChatMutation({ userId, agentId, worldId }).then(setChatId);
    }
  }, [isOpen, userId, agentId, worldId, chatId, createOrGetChatMutation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Turn off loading once an agent reply arrives
  useEffect(() => {
    if (!chatHistory || chatHistory.length === 0) return;
    const last = chatHistory[chatHistory.length - 1];
    if (last.sender === 'agent') {
      setLoading(false);
    }
  }, [chatHistory]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black/75 z-50"
      contentLabel={`Chat with ${agentName}`}
      ariaHideApp={false}
    >
      <div className="bg-brown-800 border-[10px] border-brown-900 rounded-none w-[600px] h-[500px] max-w-[90%] max-h-[90%] mx-auto font-display text-white p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold game-title">
            Chat with {agentName}
          </h1>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 p-3 bg-brown-900 rounded border-2 border-brown-600 min-h-[300px]">
          {!chatHistory || chatHistory.length === 0 ? (
            <div className="text-brown-400 text-center py-8">
              <p>Start a conversation with {agentName}!</p>
              <p className="text-sm mt-2">Your chat history will be saved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-brown-700 text-brown-100'
                    }`}
                  >
                    <p className="mb-1">{msg.content}</p>
                    <p className="text-xs opacity-75">
                      {msg.sender === 'user' ? 'You' : agentName} • {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-brown-700 text-brown-100 p-3 rounded-lg">
                    <p className="text-sm">{agentName} is typing...</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${agentName}...`}
            className="flex-1 p-2 border-2 border-brown-600 rounded bg-brown-700 text-white placeholder:text-brown-400 focus:border-brown-500 focus:outline-none"
            disabled={loading || !chatId}
          />
          <button
            type="submit"
            className="bg-clay-700 hover:bg-clay-600 text-white px-4 py-2 rounded font-bold disabled:opacity-50 transition-colors"
            disabled={!message.trim() || loading || !chatId}
          >
            Send
          </button>
        </form>
      </div>
    </ReactModal>
  );
}

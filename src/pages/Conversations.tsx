import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_CONFIG } from "../config";

interface Conversation {
  conversation_id: number;
  user_a_id: number;
  user_b_id: number;
  created_at: string;
  last_message_at: string;
  user_a_name?: string;
  user_b_name?: string;
}

interface Message {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  message_type: string;
  body: string;
  attachment_url: string | null;
  created_at: string;
  is_read: boolean;
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(() => {
    const userId = localStorage.getItem('user_id');
    return userId ? parseInt(userId) : 1;
  });

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('app_jwt') || localStorage.getItem('google_access_token');
      const response = await fetch(`${API_CONFIG.CONVERSATION_SERVICE_URL}/conversations`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      const data = await response.json();
      const conversations = data.conversations || [];
      
      console.log('Raw conversations data:', conversations);
      
      // Fetch actual user names from identity service using user IDs
      const conversationsWithNames = await Promise.all(
        conversations.map(async (conv: any) => {
          let nameA = `User ${conv.user_a_id}`;
          let nameB = `User ${conv.user_b_id}`;
          
          // Fetch user A name
          try {
            const userAResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/by-id/${conv.user_a_id}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (userAResponse.ok) {
              const userData = await userAResponse.json();
              nameA = userData.student_name || userData.uni || `User ${conv.user_a_id}`;
            }
          } catch (err) {
            console.warn(`Failed to fetch user ${conv.user_a_id}:`, err);
          }
          
          // Fetch user B name
          try {
            const userBResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/by-id/${conv.user_b_id}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (userBResponse.ok) {
              const userData = await userBResponse.json();
              nameB = userData.student_name || userData.uni || `User ${conv.user_b_id}`;
            }
          } catch (err) {
            console.warn(`Failed to fetch user ${conv.user_b_id}:`, err);
          }
          
          return {
            ...conv,
            user_a_name: nameA,
            user_b_name: nameB
          };
        })
      );
      
      console.log('Conversations with fetched names:', conversationsWithNames);
      setConversations(conversationsWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('app_jwt') || localStorage.getItem('google_access_token');
      const response = await fetch(
        `${API_CONFIG.CONVERSATION_SERVICE_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;
    
    setError("");
    try {
      const token = localStorage.getItem('app_jwt') || localStorage.getItem('google_access_token');
      const response = await fetch(`${API_CONFIG.CONVERSATION_SERVICE_URL}/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          sender_id: currentUserId,
          message_type: "text",
          body: newMessage,
          attachment_url: null,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      await fetchMessages(selectedConversation);
      await fetchConversations();
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const deleteConversation = async (conversationId: number) => {
    if (!confirm("Delete this conversation and all its messages?")) return;
    
    setError("");
    try {
      const response = await fetch(
        `${API_CONFIG.CONVERSATION_SERVICE_URL}/conversations/${conversationId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete conversation");
      await fetchConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm("Delete this message?")) return;
    
    setError("");
    try {
      const response = await fetch(
        `${API_CONFIG.CONVERSATION_SERVICE_URL}/messages/${messageId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete message");
      if (selectedConversation) {
        await fetchMessages(selectedConversation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <Link to="/" className="text-sm text-blue-500 hover:underline">
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white border rounded shadow-sm">
            <div className="p-3 border-b bg-gray-50">
              <h2 className="font-semibold text-sm">All Conversations</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conv.conversation_id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedConversation(conv.conversation_id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-sm">
                        {conv.user_a_name} ↔ {conv.user_b_name}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.conversation_id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last: {new Date(conv.last_message_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages View */}
          <div className="lg:col-span-2 bg-white border rounded shadow-sm flex flex-col h-[600px]">
            {selectedConversation ? (
              <>
                <div className="p-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-sm">
                    Conversation #{selectedConversation}
                  </h2>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.message_id}
                        className={`flex ${
                          msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender_id === currentUserId
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-black"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3 mb-1">
                            <span className="text-xs opacity-75">
                              User {msg.sender_id}
                            </span>
                            <button
                              onClick={() => deleteMessage(msg.message_id)}
                              className="text-xs opacity-75 hover:opacity-100"
                            >
                              ×
                            </button>
                          </div>
                          <div className="text-sm">{msg.body}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Message Form */}
                <form onSubmit={sendMessage} className="p-3 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

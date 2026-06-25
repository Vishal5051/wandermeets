import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Send, User, Clock, ShieldCheck } from 'lucide-react';
import './GroupChat.css';

function GroupChat({ type, id, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [chatRoomId, setChatRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    setupWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [type, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/group/${type}/${id}`);
      setMessages(res.data.messages);
      setChatRoomId(res.data.chatRoomId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = process.env.REACT_APP_WS_URL || `${protocol}//${window.location.hostname}:5000`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      // Auth with WS
      ws.current.send(JSON.stringify({ type: 'auth', userId: user.id }));
      // Join Room
      ws.current.send(JSON.stringify({ type: 'join_room', roomId: `${type}_${id}` }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_group_message') {
        setMessages((prev) => [...prev, data.message]);
      }
    };
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messagePayload = {
      type: 'group_message',
      roomId: `${type}_${id}`,
      chatRoomId,
      text: text.trim()
    };

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(messagePayload));
      setText('');
    }
  };

  if (loading) return <div className="chat-loading">Loading chat...</div>;
  if (error) return <div className="chat-error">{error}</div>;

  return (
    <div className="group-chat-container">
      <div className="chat-header">
        <h3><ShieldCheck size={18} /> Trip Group Chat</h3>
        <p>Private & Secure</p>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Say hi to your fellow travelers!</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={idx} className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                {!isMe && (
                  <div className="sender-avatar">
                    {m.sender_photo ? (
                      <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${m.sender_photo}`} alt="avatar" />
                    ) : (
                      <div className="avatar-placeholder"><User size={12} /></div>
                    )}
                  </div>
                )}
                <div className="message-content">
                  {!isMe && <span className="sender-name">{m.sender_name}</span>}
                  <p>{m.content}</p>
                  <span className="timestamp">
                    <Clock size={10} /> {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default GroupChat;

import { useState, useRef, useEffect } from 'react';
import './Chat.css';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function Chat({ messages, onSendMessage, disabled }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              <span className="chat-username">{msg.username}:</span>
              <span className="chat-text">{msg.message}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
          disabled={disabled}
          className="chat-input"
        />
        <button type="submit" disabled={disabled || !input.trim()} className="chat-send-button">
          Send
        </button>
      </form>
    </div>
  );
}


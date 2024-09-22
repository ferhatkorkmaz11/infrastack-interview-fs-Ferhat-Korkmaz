'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingEffectMessage, setTypingEffectMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (!response.ok) {
      console.error('Failed to fetch AI response');
      return;
    }

    let aiMessage = ' ';
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setIsTyping(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value);
      }

      simulateTypingEffect(aiMessage);
    }
  };

  const simulateTypingEffect = (text: string) => {
    let index = 0;
    setTypingEffectMessage('');

    const typeNextChar = () => {
      if (index < text.length) {
        setTypingEffectMessage(prev => prev + text[index]);
        index++;
        setTimeout(typeNextChar, Math.floor(Math.random() * 15) + 1); 
      } else {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        setTypingEffectMessage(''); 
      }
    };

    typeNextChar();
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, index) => (
          <div key={index} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            {m.role === 'user' ? (
              <span className={`inline-block p-2 rounded-lg bg-primary text-white`}>
                {m.content}
              </span>
            ) : (
              <span className={`inline-block p-2 rounded-lg bg-secondary text-foreground`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </span>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="mb-4 text-left">
            <span className="inline-block p-2 rounded-lg bg-secondary text-foreground">
              <ReactMarkdown>{typingEffectMessage}</ReactMarkdown>
            </span>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <input
          className="w-full p-2 border rounded text-black"
          value={input}
          placeholder="Ask about your services..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}

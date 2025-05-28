'use client';

import { useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Send, ImageIcon, Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // For now, we'll just add a message about the image upload
    // In the future, you can integrate this with your existing image processing
    const imageUrl = URL.createObjectURL(file);
    
    // You can extend this to actually upload to Supabase and process the image
    console.log('Image uploaded:', file.name);
    alert('Image upload feature will be integrated with the streaming chat soon!');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md animate-fade-in">
              <div className="text-6xl mb-6">
                <span className="animate-bounce-slow">✨</span>
                <span className="animate-wiggle">👗</span>
                <span className="animate-float">💅</span>
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-4 animate-glow">
                Hey babe! Ready for some real talk? 🔥
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Drop your outfit pics or just start chatting about your style goals! 
                Your AI sister is here to help you serve looks ✨
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 btn-interactive hover-lift animate-glow"
                >
                  <ImageIcon className="w-5 h-5" />
                  Upload Your Fit 📸
                </Button>
                <Button
                  variant="outline"
                  className="glass-pink hover-lift btn-interactive"
                  onClick={() => {
                    handleInputChange({
                      target: { value: "Hey girl! I need some style advice..." }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                >
                  Start Chatting 💬
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-glow">
                      <span className="text-white text-sm">👗</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Your AI Sister is typing...</span>
                  </div>
                  <div className="glass p-4 rounded-2xl rounded-tl-sm shadow-lg">
                    <div className="typing-indicator">
                      <div className="typing-dot bg-pink-500"></div>
                      <div className="typing-dot bg-purple-500"></div>
                      <div className="typing-dot bg-pink-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fire Design */}
      <div className="glass border-t border-pink-200/30 dark:border-purple-500/20 p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Tell me about your outfit or style goals, babe... ✨"
                className="min-h-[80px] resize-none glass border-none focus:ring-2 focus:ring-pink-400 rounded-2xl text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="icon"
                disabled={isLoading}
                className="glass-pink hover-lift btn-interactive h-12 w-12"
              >
                <Upload className="w-5 h-5" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 btn-interactive hover-lift animate-glow h-12 w-12"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <button 
            type="button"
            className="glass px-3 py-2 rounded-full text-sm hover-lift btn-interactive"
            onClick={() => handleInputChange({
              target: { value: "What should I wear for a date night?" }
            } as React.ChangeEvent<HTMLInputElement>)}
          >
            💕 Date Night
          </button>
          <button 
            type="button"
            className="glass px-3 py-2 rounded-full text-sm hover-lift btn-interactive"
            onClick={() => handleInputChange({
              target: { value: "Help me style this for work" }
            } as React.ChangeEvent<HTMLInputElement>)}
          >
            💼 Work Look
          </button>
          <button 
            type="button"
            className="glass px-3 py-2 rounded-full text-sm hover-lift btn-interactive"
            onClick={() => handleInputChange({
              target: { value: "Is this outfit giving main character energy?" }
            } as React.ChangeEvent<HTMLInputElement>)}
          >
            ✨ Main Character
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-bubble ${isUser ? 'user' : 'ai'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-3 mb-3 animate-slide-up">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-glow">
              <span className="text-white text-sm">👗</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Your AI Sister</span>
          </div>
        )}
        
        <div className={`${
          isUser 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl rounded-br-sm shadow-lg' 
            : 'glass rounded-2xl rounded-tl-sm shadow-lg hover-lift'
        } p-4 hover-glow transition-all`}>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          <div className={`text-xs mt-3 ${isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} flex items-center justify-between`}>
            <span>{new Date().toLocaleTimeString()}</span>
            {isUser && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Delivered
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Send, Image as ImageIcon, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  image_url?: string;
  processed_image_url?: string;
  ai_feedback?: string;
  shopping_suggestions?: any[];
  created_at: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      // Get or create current chat
      const { data: chatData, error: chatError } = await supabase
        .rpc('get_or_create_current_chat', { p_user_id: user.id });

      if (chatError) throw chatError;

      // Load messages for this chat
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatData)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const formattedMessages: Message[] = messagesData.map(msg => ({
        ...msg,
        isUser: msg.message_type !== 'system'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setIsTyping(true);
    try {
      await sendTextMessage(inputText);
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const sendTextMessage = async (content: string) => {
    // Get current chat
    const { data: chatId } = await supabase
      .rpc('get_or_create_current_chat', { p_user_id: user.id });

    // Add user message
    const { data: messageData, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        content,
        message_type: 'text'
      })
      .select()
      .single();

    if (error) throw error;

    const userMessage: Message = {
      ...messageData,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate AI response
    const aiResponse = await generateAIResponse(content);
    
    const { data: aiMessageData, error: aiError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        content: aiResponse,
        message_type: 'system'
      })
      .select()
      .single();

    if (aiError) throw aiError;

    const aiMessage: Message = {
      ...aiMessageData,
      isUser: false
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // More sisterly AI responses
    const responses = [
      "Girl, I love that you're thinking about your style! Tell me more about what you're going for! ✨",
      "Ooh babe, I'm so excited to help! Do you have any outfit pics to show me? I'm ready to give you the real tea! 📸💅",
      "Honestly, you know I'm always here for the fashion chat! What's on your mind, sister? 💫",
      "I'm literally obsessed with helping you put together amazing looks! Spill - what are we working with? 👗✨",
      "Girl yes! I live for these style conversations! Drop that fit pic or tell me what vibe you're going for! 🔥",
      "Babe, you came to the right place! Your AI sister is here and ready to help you serve LOOKS! What's the situation? 💕"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Supabase storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('raw-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('raw-images')
        .getPublicUrl(fileName);

      // Get current chat
      const { data: chatId } = await supabase
        .rpc('get_or_create_current_chat', { p_user_id: user.id });

      // Create image message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content: 'Uploaded an outfit photo',
          message_type: 'image',
          image_url: publicUrl,
          raw_image_url: publicUrl
        })
        .select()
        .single();

      if (messageError) throw messageError;

      const imageMessage: Message = {
        ...messageData,
        isUser: true
      };

      setMessages(prev => [...prev, imageMessage]);

      // Process image and generate feedback in background
      processImageAndGenerateFeedback(messageData.id, publicUrl);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processImageAndGenerateFeedback = async (messageId: string, imageUrl: string) => {
    try {
      // Call our API to process the image and generate feedback
      const response = await fetch('/api/process-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          imageUrl,
          userId: user.id
        }),
      });

      if (!response.ok) throw new Error('Failed to process image');

      // Reload messages to show the updated feedback
      loadMessages();
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

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
                    setInputText("Hey girl! I need some style advice...");
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
            {isTyping && (
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
        <div
          className={`relative ${dragActive ? 'glass-pink border-2 border-dashed border-pink-400 animate-glow' : ''} rounded-2xl transition-all`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tell me about your outfit or style goals, babe... ✨"
                className="min-h-[80px] resize-none glass border-none focus:ring-2 focus:ring-pink-400 rounded-2xl text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="icon"
                disabled={isLoading}
                className="glass-pink hover-lift btn-interactive h-12 w-12"
              >
                <Upload className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 btn-interactive hover-lift animate-glow h-12 w-12"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center glass-pink rounded-2xl animate-pulse">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-pink-600 animate-bounce" />
                <p className="font-medium text-pink-700 dark:text-pink-300 text-lg">Drop your outfit pic here, girl! 📸</p>
                <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">Let's see what you're working with!</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <button 
            className="glass px-3 py-2 rounded-full text-sm hover-lift btn-interactive"
            onClick={() => setInputText("What should I wear for a date night?")}
          >
            💕 Date Night
          </button>
          <button 
            className="glass px-3 py-2 rounded-full text-sm hover-lift btn-interactive"
            onClick={() => setInputText("Help me style this for work")}
          >
            💼 Work Look
          </button>
          <button 
            className="glass px-3 py-2 rounded-full text-sm hover-lift btn-interactive"
            onClick={() => setInputText("Is this outfit giving main character energy?")}
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

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} message-bubble ${message.isUser ? 'user' : 'ai'}`}>
      <div className={`max-w-[85%] ${message.isUser ? 'order-2' : 'order-1'}`}>
        {!message.isUser && (
          <div className="flex items-center gap-3 mb-3 animate-slide-up">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-glow">
              <span className="text-white text-sm">👗</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Your AI Sister</span>
          </div>
        )}
        
        <div className={`${
          message.isUser 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl rounded-br-sm shadow-lg' 
            : 'glass rounded-2xl rounded-tl-sm shadow-lg hover-lift'
        } p-4 hover-glow transition-all`}>
          {message.message_type === 'image' && message.image_url && (
            <div className="mb-4 animate-scale-in">
              <div className="relative w-full max-w-sm mx-auto">
                <Image
                  src={message.image_url}
                  alt="Outfit"
                  width={300}
                  height={400}
                  className="rounded-xl object-cover border-2 border-white/20 hover-lift transition-transform"
                />
                {message.processed_image_url && (
                  <div className="mt-3 text-xs text-pink-200 animate-shimmer text-center">
                    ✨ Enhanced version available
                  </div>
                )}
              </div>
            </div>
          )}
          
          <p className="text-base leading-relaxed">{message.content}</p>
          
          {message.ai_feedback && (
            <div className="mt-4 p-4 glass-pink rounded-xl animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
                <span className="font-semibold text-sm text-pink-700 dark:text-pink-300">Sister's Real Talk:</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{message.ai_feedback}</p>
            </div>
          )}
          
          {message.shopping_suggestions && message.shopping_suggestions.length > 0 && (
            <div className="mt-4 p-4 glass-purple rounded-xl animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-purple-500 animate-bounce" />
                <span className="font-semibold text-sm text-purple-700 dark:text-purple-300">Similar Vibes:</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {message.shopping_suggestions.slice(0, 4).map((item: any, index: number) => (
                  <div key={index} className="text-xs p-3 glass rounded-lg border border-white/40 hover-lift transition-all">
                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">{item.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={`text-xs mt-3 ${message.isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} flex items-center justify-between`}>
            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
            {message.isUser && (
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
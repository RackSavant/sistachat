'use client';

import { useRef, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useChat } from '@ai-sdk/react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Send, ImageIcon, Heart, ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; file: File }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    // The RLS policy expects: raw-images/{user_id}/filename
    // But since we're uploading to the 'raw-images' bucket, the path should just be: {user_id}/{timestamp}-{filename}
    // The policy regex '^([^/]+)' will match the user_id from the path
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImageToSupabase(file);
      setUploadedImages(prev => [...prev, { url: imageUrl, file }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitWithImages = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && uploadedImages.length === 0) return;

    const messageContent = input.trim() || 'What do you think of this outfit?';
    
    if (uploadedImages.length > 0) {
      // Send message with image attachments
      await append({
        role: 'user',
        content: messageContent,
        experimental_attachments: uploadedImages.map(img => ({
          name: img.file.name,
          contentType: img.file.type,
          url: img.url,
        })),
      });
      
      // Clear uploaded images after sending
      setUploadedImages([]);
    } else {
      // Send regular text message
      handleSubmit(e);
    }
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
        {/* Image Preview Area */}
        {uploadedImages.length > 0 && (
          <div className="mb-4 p-4 glass-pink rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-pink-700 dark:text-pink-300">Ready to analyze:</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={img.url}
                    alt="Outfit to analyze"
                    width={80}
                    height={80}
                    className="rounded-lg object-cover border-2 border-white/40"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitWithImages}>
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder={uploadedImages.length > 0 ? "Ask about your outfit or just say 'analyze this'..." : "Tell me about your outfit or style goals, babe... ✨"}
                className="min-h-[80px] resize-none glass border-none focus:ring-2 focus:ring-pink-400 rounded-2xl text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitWithImages(e);
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
                disabled={isLoading || isUploading}
                className="glass-pink hover-lift btn-interactive h-12 w-12"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isUploading || (!input.trim() && uploadedImages.length === 0)}
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
          
          {/* Display images if present */}
          {isUser && message.experimental_attachments && message.experimental_attachments.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                {message.experimental_attachments.map((attachment: any, index: number) => (
                  <div key={index} className="relative">
                    <Image
                      src={attachment.url}
                      alt="Outfit"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover border-2 border-white/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
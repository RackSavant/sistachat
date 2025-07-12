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
  const [isCompressing, setIsCompressing] = useState(false);
  const supabase = createClient();

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('🔥 Chat error:', error);
      console.error('🔥 Chat error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      alert(`Chat error: ${error.message}`);
    },
    onFinish: (message) => {
      console.log('✅ Chat message finished:', message);
    },
    onResponse: (response) => {
      console.log('📡 Chat response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const compressImage = async (file: File, maxSizeKB = 2048): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920x1920)
        const maxDimension = 1920;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until we get under the size limit
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              const sizeKB = blob.size / 1024;
              console.log(`🗜️ Compressed to ${sizeKB.toFixed(1)}KB with quality ${quality}`);
              
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Try lower quality
                tryCompress(Math.max(0.1, quality - 0.1));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress(0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    console.log('📤 Starting image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id
    });

    // The RLS policy expects: raw-images/{user_id}/filename
    // But since we're uploading to the 'raw-images' bucket, the path should just be: {user_id}/{timestamp}-{filename}
    // The policy regex '^([^/]+)' will match the user_id from the path
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    
    console.log('📂 Upload path:', fileName);

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('raw-images')
        .upload(fileName, file);

      console.log('🗂️ Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('raw-images')
        .getPublicUrl(fileName);

      console.log('🌐 Generated public URL:', publicUrl);

      // Test if the URL is accessible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log('🔍 URL accessibility check:', {
          url: publicUrl,
          status: response.status,
          accessible: response.ok
        });
      } catch (urlError) {
        console.warn('⚠️ URL accessibility check failed:', urlError);
      }

      return publicUrl;
    } catch (error) {
      console.error('💥 Image upload error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('🖼️ File upload started:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isImage: file.type.startsWith('image/')
    });

    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      alert('Please upload an image file');
      return;
    }

    try {
      // Compress image if it's large
      let fileToUpload = file;
      const fileSizeKB = file.size / 1024;
      
      if (fileSizeKB > 1024) { // If larger than 1MB, compress
        console.log('🗜️ Compressing large image...');
        setIsCompressing(true);
        fileToUpload = await compressImage(file);
        console.log('✅ Image compressed:', {
          originalSize: `${(file.size / 1024).toFixed(1)}KB`,
          compressedSize: `${(fileToUpload.size / 1024).toFixed(1)}KB`,
          reduction: `${(((file.size - fileToUpload.size) / file.size) * 100).toFixed(1)}%`
        });
        setIsCompressing(false);
      }

      setIsUploading(true);
      const imageUrl = await uploadImageToSupabase(fileToUpload);
      console.log('✅ Image uploaded successfully:', imageUrl);
      
      const newImage = { url: imageUrl, file: fileToUpload };
      setUploadedImages(prev => {
        const updated = [...prev, newImage];
        console.log('📋 Updated uploaded images:', updated);
        return updated;
      });
    } catch (error) {
      console.error('💥 Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    console.log('🗑️ Removing image at index:', index);
    setUploadedImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('📋 Updated uploaded images after removal:', updated);
      return updated;
    });
  };

  const handleSubmitWithImages = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Submit started:', {
      inputText: input,
      inputTrimmed: input.trim(),
      uploadedImagesCount: uploadedImages.length,
      uploadedImages: uploadedImages.map(img => ({ url: img.url, fileName: img.file.name }))
    });
    
    if (!input.trim() && uploadedImages.length === 0) {
      console.warn('⚠️ No input or images to submit');
      return;
    }

    const messageContent = input.trim() || 'What do you think of this outfit?';
    console.log('📝 Message content:', messageContent);
    
    if (uploadedImages.length > 0) {
      console.log('🖼️ Sending message with images...');
      
      const attachments = uploadedImages.map(img => ({
        name: img.file.name,
        contentType: img.file.type,
        url: img.url,
      }));

      console.log('📎 Attachments prepared:', attachments);

      try {
                 const messageData = {
           role: 'user' as const,
           content: messageContent,
           experimental_attachments: attachments,
         };

        console.log('📤 Sending message with attachments:', messageData);

        // Send message with image attachments
        await append(messageData);
        
        console.log('✅ Message sent successfully');
        
        // Clear uploaded images after sending
        setUploadedImages([]);
        console.log('🧹 Cleared uploaded images');
        
             } catch (error) {
         console.error('💥 Error sending message with images:', error);
         alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
       }
    } else {
      console.log('📝 Sending text-only message...');
      try {
        // Send regular text message
        handleSubmit(e);
        console.log('✅ Text message sent successfully');
             } catch (error) {
         console.error('💥 Error sending text message:', error);
         alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
       }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 File dropped');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed');
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

        {/* Compression Status */}
        {isCompressing && (
          <div className="mb-4 p-4 glass-purple rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-purple-700 dark:text-purple-300">Compressing image...</span>
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
                disabled={isLoading || isUploading || isCompressing}
                className="glass-pink hover-lift btn-interactive h-12 w-12"
              >
                {isCompressing ? (
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : isUploading ? (
                  <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isUploading || isCompressing || (!input.trim() && uploadedImages.length === 0)}
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
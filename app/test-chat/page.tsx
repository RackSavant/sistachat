'use client';

import { useChat } from '@ai-sdk/react';

export default function TestChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Chat - AI SDK</h1>
      
      <div className="space-y-4 mb-6 min-h-[400px] max-h-[400px] overflow-y-auto border rounded-lg p-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">Start a conversation...</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-[80%]'
                  : 'bg-gray-100 mr-auto max-w-[80%]'
              }`}
            >
              <div className="font-semibold text-sm mb-1">
                {message.role === 'user' ? 'You' : 'AI Sister'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-gray-100 mr-auto max-w-[80%] p-3 rounded-lg">
            <div className="font-semibold text-sm mb-1">AI Sister</div>
            <div className="text-gray-500">Typing...</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
} 
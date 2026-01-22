import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { GroupSettingsModal } from './GroupSettingsModal';

export const ChatWindow: React.FC = () => {
  const { messages, currentGroupId, typingUsers, readStatus, sendRead, groups, refreshGroups } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentGroup = groups.find(g => g.id === currentGroupId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (messages.length > 0 && currentGroupId) {
      const lastMessage = messages[messages.length - 1];
      sendRead(lastMessage.id);
    }
  }, [messages, currentGroupId, sendRead]);

  if (!currentGroupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
          <p className="mt-1 text-sm text-gray-500">Choose a group from the sidebar to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {currentGroup?.iconUrl ? (
              <img src={currentGroup.iconUrl} alt={currentGroup.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-600 font-medium">{currentGroup?.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{currentGroup?.name}</h2>
            <p className="text-xs text-gray-500">{currentGroup?.memberCount} members</p>
          </div>
        </div>
        {/* Settings Button */}
        <button 
          className="text-gray-400 hover:text-gray-600" 
          title="Group Settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem 
              key={message.id} 
              message={message} 
              readStatus={readStatus}
              groupMemberCount={currentGroup?.memberCount || 0}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
          {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      {/* Input Area */}
      <MessageInput />

      {/* Group Settings Modal */}
      {currentGroupId && (
        <GroupSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          groupId={currentGroupId}
          onGroupDeleted={() => refreshGroups()}
        />
      )}
    </div>
  );
};

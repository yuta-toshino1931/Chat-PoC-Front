import React from 'react';
import { GroupList } from './GroupList';
import { ChatWindow } from './ChatWindow';
import { ChatProvider } from '../../contexts/ChatContext';

export const ChatLayout: React.FC = () => {
  return (
    <ChatProvider>
      <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow overflow-hidden">
        <GroupList />
        <ChatWindow />
      </div>
    </ChatProvider>
  );
};

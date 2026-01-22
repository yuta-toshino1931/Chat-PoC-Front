import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Message, ReadStatus } from '../../types';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
  readStatus: ReadStatus[];
  groupMemberCount: number;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, readStatus }) => {
  const { user } = useAuth();
  const isMe = message.sender.id === user?.id;

  // 既読数の計算 (自分以外)
  const readCount = readStatus.filter(status => {
      if (status.userId === user?.id) return false;
      return new Date(status.lastReadAt) > new Date(message.createdAt);
  }).length;

  return (
    <div className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <div className="flex-shrink-0 mr-3">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs overflow-hidden">
             {message.sender.avatarUrl ? (
                 <img src={message.sender.avatarUrl} alt={message.sender.name} className="h-full w-full object-cover" />
             ) : (
                 message.sender.name.charAt(0)
             )}
          </div>
        </div>
      )}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{message.sender.name}</span>}
        <div
          className={`px-4 py-2 rounded-lg text-sm shadow-sm ${
            isMe
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
          }`}
        >
          {message.imageUrl && (
              <img src={message.imageUrl} alt="attached" className="max-w-full rounded mb-2 cursor-pointer" />
          )}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center mt-1 space-x-2">
            <span className="text-[10px] text-gray-400">
            {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            {isMe && readCount > 0 && (
                <span className="text-[10px] text-blue-500 font-medium">
                    Read {readCount}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { CreateGroupModal } from './CreateGroupModal';

export const GroupList: React.FC = () => {
  const { groups, currentGroupId, selectGroup } = useChat();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
        <button 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No groups yet</div>
        ) : (
            groups.map((group) => (
            <div
                key={group.id}
                onClick={() => selectGroup(group.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentGroupId === group.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
            >
                <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {group.iconUrl ? (
                    <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
                    ) : (
                    <span className="text-gray-600 font-medium">{group.name.charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                        {group.lastMessage && (
                             <span className="text-xs text-gray-400">
                                 {new Date(group.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                    {group.lastMessage?.messageType === 'image' ? 'Sent an image' : (group.lastMessage?.content || 'No messages yet')}
                    </p>
                </div>
                {group.unreadCount > 0 && (
                    <div className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {group.unreadCount}
                    </div>
                )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
    <CreateGroupModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

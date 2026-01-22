import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatApi } from '../../services/chatApi';
import type { Member, GroupDetail } from '../../types';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onGroupDeleted?: () => void;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  groupId,
  onGroupDeleted 
}) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'settings'>('members');

  const isAdmin = members.find(m => m.userId === user?.id)?.role === 'admin';

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupDetails();
    }
  }, [isOpen, groupId]);

  const loadGroupDetails = async () => {
    setIsLoading(true);
    try {
      const [groupRes, membersRes] = await Promise.all([
        chatApi.getGroup(groupId),
        chatApi.getMembers(groupId)
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Failed to load group details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim()) return;
    try {
      await chatApi.inviteMember(groupId, { userId: inviteUserId, message: inviteMessage || undefined });
      alert('Invitation sent!');
      setInviteUserId('');
      setInviteMessage('');
    } catch (error) {
      alert('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await chatApi.removeMember(groupId, userId);
      setMembers(members.filter(m => m.userId !== userId));
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      // If admin, might need to assign new admin
      if (isAdmin && members.length > 1) {
        const newAdmin = members.find(m => m.userId !== user?.id);
        await chatApi.leaveGroup(groupId, newAdmin?.userId);
      } else {
        await chatApi.leaveGroup(groupId);
      }
      onGroupDeleted?.();
      onClose();
    } catch (error) {
      alert('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    try {
      await chatApi.deleteGroup(groupId);
      onGroupDeleted?.();
      onClose();
    } catch (error) {
      alert('Failed to delete group');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {group?.name || 'Group Settings'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  {['members', 'invite', 'settings'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="max-h-64 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs overflow-hidden">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.userName} className="h-full w-full object-cover" />
                          ) : (
                            member.userName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                          <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                        </div>
                      </div>
                      {isAdmin && member.userId !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Invite Tab */}
              {activeTab === 'invite' && isAdmin && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <input
                      type="text"
                      value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter user ID to invite"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a personal message"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleInvite}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Send Invitation
                  </button>
                </div>
              )}
              {activeTab === 'invite' && !isAdmin && (
                <p className="text-gray-500 text-sm">Only admins can invite new members.</p>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                  >
                    Leave Group
                  </button>
                  {isAdmin && (
                    <button
                      onClick={handleDeleteGroup}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Delete Group
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

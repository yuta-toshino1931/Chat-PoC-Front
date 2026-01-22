// ==========================================
// チャット関連の型定義 (Swagger準拠)
// ==========================================

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  groupId: string;
  sender: UserSummary;
  content: string;
  imageUrl?: string;
  messageType: 'text' | 'image' | 'system';
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  imageUrl?: string;
}

export interface MessageListResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ReadStatus {
  userId: string;
  userName: string;
  lastReadMessageId: string;
  lastReadAt: string;
}

export interface TypingEvent {
  groupId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ImageUploadResponse {
  imageId: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface Group {
  id: string;
  name: string;
  iconUrl?: string;
  memberCount: number;
  unreadCount: number;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDetail extends Group {
  members: Member[];
}

export interface CreateGroupRequest {
  name: string;
  iconUrl?: string;
  initialMemberIds?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  iconUrl?: string;
}

export interface Member {
  userId: string;
  userName: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface InviteMemberRequest {
  userId: string;
  message?: string;
}

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: UserSummary;
  invitedUser: UserSummary;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ChatContext用のState型定義
export interface ChatState {
  isConnected: boolean;
  messages: Message[];
  groups: Group[];
  currentGroupId: string | null;
  typingUsers: TypingEvent[];
  readStatus: ReadStatus[];
  error: string | null;
}

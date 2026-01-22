import axios from 'axios';
import type { 
  Group, GroupDetail, CreateGroupRequest, UpdateGroupRequest, 
  Member, InviteMemberRequest, Invitation,
  MessageListResponse, SendMessageRequest, Message, ReadStatus,
  ImageUploadResponse
} from '../types';

// 環境変数からAPIのURLを取得、なければデフォルト値を使用
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Swaggerのパス定義に合わせて調整
// Swaggerでは /groups 等がルート直下にあるように見えるが、
// 通常は /api 等のプレフィックスがあることが多い。
// ここでは、WebSocketのエンドポイントが /api/ws なので、REST APIも /api 配下と想定する。
// ただし、Swaggerのservers定義を見ると
// - url: http://localhost:8080/v1
// とあるので、/v1 を使うのが正しそう。

const api = axios.create({
  baseURL: API_URL, // ベースURLを設定 (パスは各リクエストで指定するか、baseURLに含める)
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: 認証トークンの付与
api.interceptors.request.use((config) => {
  // 認証トークンの取得ロジック (localStorageから取得と仮定)
  // 実際の実装ではAuthContextなどから取得するのが望ましいが、
  // axiosのinterceptorはコンポーネント外なので、localStorage等が一般的。
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatApi = {
  // ========================================
  // グループ管理
  // ========================================
  getGroups: () => api.get<Group[]>('/groups'),
  
  createGroup: (data: CreateGroupRequest) => api.post<Group>('/groups', data),
  
  getGroup: (groupId: string) => api.get<GroupDetail>(`/groups/${groupId}`),
  
  updateGroup: (groupId: string, data: UpdateGroupRequest) => api.patch<Group>(`/groups/${groupId}`, data),
  
  deleteGroup: (groupId: string) => api.delete<void>(`/groups/${groupId}`),

  // ========================================
  // メンバー管理
  // ========================================
  getMembers: (groupId: string) => api.get<Member[]>(`/groups/${groupId}/members`),
  
  inviteMember: (groupId: string, data: InviteMemberRequest) => api.post<Invitation>(`/groups/${groupId}/invitations`, data),
  
  respondToInvitation: (groupId: string, invitationId: string, action: 'accept' | 'reject') => 
    api.post<Member>(`/groups/${groupId}/invitations/${invitationId}`, { action }),
  
  removeMember: (groupId: string, userId: string) => api.delete<void>(`/groups/${groupId}/members/${userId}`),
  
  leaveGroup: (groupId: string, newAdminUserId?: string) => api.post<void>(`/groups/${groupId}/leave`, { newAdminUserId }),

  // ========================================
  // メッセージ関連
  // ========================================
  getMessages: (groupId: string, params?: { limit?: number; before?: string }) => 
    api.get<MessageListResponse>(`/groups/${groupId}/messages`, { params }),
  
  // REST経由での送信 (WebSocket切断時やフォールバック用)
  sendMessageREST: (groupId: string, data: SendMessageRequest) => api.post<Message>(`/groups/${groupId}/messages`, data),
  
  markAsRead: (groupId: string, messageId: string) => api.post<ReadStatus>(`/groups/${groupId}/messages/${messageId}/read`),
  
  getReadStatus: (groupId: string) => api.get<ReadStatus[]>(`/groups/${groupId}/read-status`),

  // ========================================
  // 画像関連
  // ========================================
  uploadImage: (groupId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ImageUploadResponse>(`/groups/${groupId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

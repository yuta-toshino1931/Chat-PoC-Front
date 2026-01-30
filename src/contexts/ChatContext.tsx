import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { GroupsService, MessagesService } from '../api';
import type { Group, Message, ReadStatus } from '../api';

// WebSocket用の型定義（サーバーから受信する形式）
interface UserSummary {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface TypingEventFromServer {
  groupId: string;
  user: UserSummary;
  isTyping: boolean;
  timestamp?: string;
}

interface PresenceEventFromServer {
  groupId: string;
  user: UserSummary;
  status: 'online' | 'away' | 'offline';
  lastActiveAt: string;
}

// 内部で使用する形式
interface TypingEvent {
  groupId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface PresenceEvent {
  groupId: string;
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastActiveAt: string;
}

interface NotificationEvent {
  type: 'invitation' | 'mention' | 'group_updated';
  data: Record<string, unknown>;
  receivedAt: string;
}

interface ChatState {
  isConnected: boolean;
  messages: Message[];
  groups: Group[];
  currentGroupId: string | null;
  typingUsers: TypingEvent[];
  presenceUsers: PresenceEvent[];
  readStatus: ReadStatus[];
  notifications: NotificationEvent[];
  error: string | null;
}

interface ChatContextType extends ChatState {
  selectGroup: (groupId: string) => void;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  sendPresence: (status: 'online' | 'away') => void;
  createGroup: (name: string, iconUrl?: string, initialMemberIds?: string[]) => Promise<void>;
  refreshGroups: () => Promise<void>;
  loadMessages: (groupId: string, before?: string) => Promise<void>;
  clearNotifications: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// バックエンドのWebSocketエンドポイント
const WS_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/ws` 
  : 'http://localhost:8080/ws';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State initialization
  const [state, setState] = useState<ChatState>({
    isConnected: false,
    messages: [],
    groups: [],
    currentGroupId: null,
    typingUsers: [],
    presenceUsers: [],
    readStatus: [],
    notifications: [],
    error: null,
  });

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ [key: string]: StompSubscription }>({});

  // 1. Initial Group Load
  const refreshGroups = useCallback(async () => {
    try {
      const groups = await GroupsService.getGroups();
      setState(prev => ({ ...prev, groups, error: null }));
    } catch (error) {
      console.error('Failed to load groups:', error);
      setState(prev => ({ ...prev, error: 'グループの取得に失敗しました' }));
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshGroups();
    }
  }, [user, refreshGroups]);

  // 2. WebSocket Connection
  useEffect(() => {
    if (!user) return;

    // SockJSインスタンスを生成するファクトリ関数
    const socketFactory = () => new SockJS(WS_URL);

    const client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
        // Authorization: `Bearer ${localStorage.getItem('accessToken')}` // 必要に応じて
      },
      debug: (str) => {
        // 開発中のみログ出力
        if (import.meta.env.DEV) {
          console.log('[STOMP]', str);
        }
      },
      reconnectDelay: 5000, // 自動再接続
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('STOMP Connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        
        // 個人通知の購読 (招待、メンション、グループ更新など)
        client.subscribe('/user/queue/notifications', (message) => {
          console.log('Notification received:', message.body);
          try {
            const notification = JSON.parse(message.body) as NotificationEvent;
            setState(prev => ({
              ...prev,
              notifications: [...prev.notifications, notification]
            }));
            // グループリストを更新
            refreshGroups();
          } catch (e) {
            console.error('Failed to parse notification:', e);
          }
        });
      },
      onDisconnect: () => {
        console.log('STOMP Disconnected');
        setState(prev => ({ ...prev, isConnected: false }));
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        setState(prev => ({ ...prev, error: 'WebSocket接続エラー' }));
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [user, refreshGroups]);

  // 3. Message Loading
  const loadMessages = useCallback(async (groupId: string, before?: string) => {
    try {
      const response = await MessagesService.getMessages(groupId, 50, before);
      setState(prev => {
        const newMessages = response.messages || [];
        
        if (before) {
          // 追加読み込み（過去分）
          return { ...prev, messages: [...newMessages.reverse(), ...prev.messages] };
        } else {
          // 新規読み込み（最新分）- メッセージリストをリセット
          // APIが新しい順（降順）で返すと仮定し、reverseして古い順（昇順）にする
          return { ...prev, messages: newMessages.reverse() };
        }
      });
      
      // 既読状態も更新
      const readStatusList = await MessagesService.getReadStatus(groupId);
      setState(prev => ({ ...prev, readStatus: readStatusList }));

    } catch (error) {
      console.error('Failed to load messages:', error);
      setState(prev => ({ ...prev, error: 'メッセージの取得に失敗しました' }));
    }
  }, []);

  // 4. Group Selection & Subscription
  const selectGroup = useCallback((groupId: string) => {
    // 状態リセット
    setState(prev => ({ 
      ...prev, 
      currentGroupId: groupId, 
      messages: [], 
      typingUsers: [],
      presenceUsers: [],
      error: null
    }));
    
    // 初期データロード
    loadMessages(groupId);
    
    // サブスクリプションの更新
    if (clientRef.current && clientRef.current.connected) {
      // 以前の購読を解除
      Object.values(subscriptionsRef.current).forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = {};

      console.log(`Subscribing to group: ${groupId}`);

      // メッセージ受信 (新規メッセージ、編集、削除)
      subscriptionsRef.current['messages'] = clientRef.current.subscribe(
        `/topic/group/${groupId}`, 
        (payload: IMessage) => {
          try {
            const data = JSON.parse(payload.body);
            
            // メッセージタイプに応じて処理
            if (data.type === 'MessageDeleted') {
              // 削除されたメッセージを除去
              setState(prev => {
                if (prev.currentGroupId !== groupId) return prev;
                return { 
                  ...prev, 
                  messages: prev.messages.filter(m => m.id !== data.id) 
                };
              });
            } else if (data.type === 'MessageEdited' || data.id) {
              // 編集または新規メッセージ
              const message: Message = data;
              setState(prev => {
                if (prev.currentGroupId !== groupId) return prev;
                
                // 既存メッセージの更新かチェック
                const existingIndex = prev.messages.findIndex(m => m.id === message.id);
                if (existingIndex !== -1) {
                  // 更新
                  const newMessages = [...prev.messages];
                  newMessages[existingIndex] = message;
                  return { ...prev, messages: newMessages };
                }
                
                // 新規追加（重複チェック）
                if (prev.messages.some(m => m.id === message.id)) return prev;
                return { ...prev, messages: [...prev.messages, message] };
              });
            }
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        }
      );

      // 入力中通知
      subscriptionsRef.current['typing'] = clientRef.current.subscribe(
        `/topic/group/${groupId}/typing`, 
        (payload: IMessage) => {
          try {
            const serverEvent: TypingEventFromServer = JSON.parse(payload.body);
            // サーバー形式から内部形式に変換
            const typingEvent: TypingEvent = {
              groupId: serverEvent.groupId,
              userId: serverEvent.user?.id || '',
              userName: serverEvent.user?.name || '',
              isTyping: serverEvent.isTyping,
            };
            
            // 自分自身の入力通知は無視
            if (typingEvent.userId === user?.id) return;
            
            console.log('Typing event received:', typingEvent);
            
            setState(prev => {
              if (prev.currentGroupId !== groupId) return prev;
              
              let newTypingUsers = [...prev.typingUsers];
              if (typingEvent.isTyping) {
                // 追加 (存在しなければ)
                if (!newTypingUsers.find(u => u.userId === typingEvent.userId)) {
                  newTypingUsers.push(typingEvent);
                }
              } else {
                // 削除
                newTypingUsers = newTypingUsers.filter(u => u.userId !== typingEvent.userId);
              }
              return { ...prev, typingUsers: newTypingUsers };
            });
          } catch (e) {
            console.error('Failed to parse typing event:', e);
          }
        }
      );

      // プレゼンス（オンライン状態）
      subscriptionsRef.current['presence'] = clientRef.current.subscribe(
        `/topic/group/${groupId}/presence`, 
        (payload: IMessage) => {
          try {
            const serverEvent: PresenceEventFromServer = JSON.parse(payload.body);
            // サーバー形式から内部形式に変換
            const presenceEvent: PresenceEvent = {
              groupId: serverEvent.groupId,
              userId: serverEvent.user?.id || '',
              userName: serverEvent.user?.name || '',
              status: serverEvent.status,
              lastActiveAt: serverEvent.lastActiveAt,
            };
            
            console.log('Presence event received:', presenceEvent);
            
            setState(prev => {
              if (prev.currentGroupId !== groupId) return prev;
              
              const newPresenceUsers = prev.presenceUsers.filter(
                u => u.userId !== presenceEvent.userId
              );
              newPresenceUsers.push(presenceEvent);
              return { ...prev, presenceUsers: newPresenceUsers };
            });
          } catch (e) {
            console.error('Failed to parse presence event:', e);
          }
        }
      );

      // 既読状態
      subscriptionsRef.current['readStatus'] = clientRef.current.subscribe(
        `/topic/group/${groupId}/read`, 
        (payload: IMessage) => {
          try {
            const readStatusEvent = JSON.parse(payload.body) as {
              groupId: string;
              userId: string;
              userName: string;
              lastReadMessageId: string;
              lastReadAt: string;
            };
            
            console.log('ReadStatus event received:', readStatusEvent);
            
            setState(prev => {
              if (prev.currentGroupId !== groupId) return prev;
              
              // 既存の既読状態を更新または追加
              const newReadStatus = prev.readStatus.filter(
                rs => rs.userId !== readStatusEvent.userId
              );
              newReadStatus.push({
                userId: readStatusEvent.userId,
                userName: readStatusEvent.userName,
                lastReadMessageId: readStatusEvent.lastReadMessageId,
                lastReadAt: readStatusEvent.lastReadAt,
              });
              return { ...prev, readStatus: newReadStatus };
            });
          } catch (e) {
            console.error('Failed to parse read status event:', e);
          }
        }
      );
    }
  }, [user, loadMessages]);

  // 5. Actions
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!state.currentGroupId || !user) return;
    
    const temporaryId = `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (clientRef.current && clientRef.current.connected) {
      const messageBody = {
        groupId: state.currentGroupId,
        temporaryId,
        content,
        imageUrl
      };

      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(messageBody)
      });
    } else {
      // フォールバック: REST API
      try {
        const sentMessage = await MessagesService.sendMessage(
          state.currentGroupId, 
          { content, imageUrl, temporaryId }
        );
        // 送信成功したメッセージをローカルに即時反映
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, sentMessage]
        }));
      } catch (e) {
        console.error('Failed to send message via REST:', e);
        throw e;
      }
    }
  }, [state.currentGroupId, user]);

  const sendTyping = useCallback((isTyping: boolean) => {
    console.log('sendTyping called:', { 
      isTyping, 
      currentGroupId: state.currentGroupId, 
      connected: clientRef.current?.connected 
    });
    
    if (!state.currentGroupId || !clientRef.current?.connected) {
      console.log('sendTyping aborted: no groupId or not connected');
      return;
    }
    
    const payload = { groupId: state.currentGroupId, isTyping };
    console.log('Publishing typing event:', payload);
    
    clientRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(payload)
    });
  }, [state.currentGroupId]);

  const sendPresence = useCallback((status: 'online' | 'away') => {
    if (!clientRef.current?.connected) return;
    
    clientRef.current.publish({
      destination: '/app/chat.presence',
      body: JSON.stringify({ 
        status,
        groupIds: state.currentGroupId ? [state.currentGroupId] : undefined
      })
    });
  }, [state.currentGroupId]);

  const createGroup = useCallback(async (name: string, iconUrl?: string, initialMemberIds?: string[]) => {
    await GroupsService.createGroup({ name, iconUrl, initialMemberIds });
    await refreshGroups();
  }, [refreshGroups]);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  return (
    <ChatContext.Provider value={{ 
      ...state, 
      selectGroup, 
      sendMessage, 
      sendTyping,
      sendPresence,
      createGroup,
      refreshGroups,
      loadMessages,
      clearNotifications
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import type { 
  ChatState, Message, TypingEvent, ReadStatus,
} from '../types';
import { chatApi } from '../services/chatApi';

interface ChatContextType extends ChatState {
  selectGroup: (groupId: string) => void;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  sendRead: (messageId: string) => void;
  createGroup: (name: string, iconUrl?: string, initialMemberIds?: string[]) => Promise<void>;
  refreshGroups: () => Promise<void>;
  loadMessages: (groupId: string, before?: string) => Promise<void>;
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
    readStatus: [],
    error: null,
  });

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ [key: string]: StompSubscription }>({});

  // 1. Initial Group Load
  const refreshGroups = useCallback(async () => {
    try {
      const response = await chatApi.getGroups();
      setState(prev => ({ ...prev, groups: response.data }));
    } catch (error) {
      console.error('Failed to load groups:', error);
      setState(prev => ({ ...prev, error: 'Failed to load groups' }));
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
        // Authorization: `Bearer ${token}` // 必要に応じて
      },
      debug: (str) => {
        // 開発中のみログ出力
        if (import.meta.env.DEV) {
          console.log(str);
        }
      },
      reconnectDelay: 5000, // 自動再接続
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('STOMP Connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        
        // 個人通知の購読 (招待など)
        client.subscribe('/user/queue/notifications', (message) => {
          console.log('Notification received:', message.body);
          // 通知処理の実装 (トースト表示やグループリスト更新など)
          refreshGroups();
        });
      },
      onDisconnect: () => {
        console.log('STOMP Disconnected');
        setState(prev => ({ ...prev, isConnected: false }));
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        setState(prev => ({ ...prev, error: 'Connection error' }));
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
      const response = await chatApi.getMessages(groupId, { limit: 50, before });
      setState(prev => {
        const newMessages = response.data.messages;
        
        if (before) {
            // 追加読み込み（過去分）
            return { ...prev, messages: [...newMessages, ...prev.messages] };
        } else {
            // 新規読み込み（最新分）- メッセージリストをリセット
            return { ...prev, messages: newMessages.reverse() }; // 時系列昇順で表示するためreverse（APIが降順なら）
            // ※API仕様書には「履歴」とあるので通常降順（新しい順）。UI表示は下から上へ新しいものなので、
            // 配列の最後が最新になるように並べ替えるのが一般的。
            // ここではAPIが新しい順（降順）で返すと仮定し、reverseして古い順（昇順）にする。
        }
      });
      
      // 既読状態も更新
      const readStatusRes = await chatApi.getReadStatus(groupId);
      setState(prev => ({ ...prev, readStatus: readStatusRes.data }));

    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // 4. Group Selection & Subscription
  const selectGroup = useCallback((groupId: string) => {
    // 状態リセット
    setState(prev => ({ ...prev, currentGroupId: groupId, messages: [], typingUsers: [] }));
    
    // 初期データロード
    loadMessages(groupId);
    
    // サブスクリプションの更新
    if (clientRef.current && clientRef.current.connected) {
        // 以前の購読を解除
        Object.values(subscriptionsRef.current).forEach(sub => sub.unsubscribe());
        subscriptionsRef.current = {};

        console.log(`Subscribing to group: ${groupId}`);

        // メッセージ受信
        subscriptionsRef.current['messages'] = clientRef.current.subscribe(`/topic/group/${groupId}`, (payload: IMessage) => {
            const message: Message = JSON.parse(payload.body);
            setState(prev => {
                if (prev.currentGroupId !== groupId) return prev;
                // 重複チェック（念のため）
                if (prev.messages.some(m => m.id === message.id)) return prev;
                return { ...prev, messages: [...prev.messages, message] };
            });
        });

        // 入力中通知
        subscriptionsRef.current['typing'] = clientRef.current.subscribe(`/topic/group/${groupId}/typing`, (payload: IMessage) => {
            const typingEvent: TypingEvent = JSON.parse(payload.body);
            // 自分自身の入力通知は無視
            if (typingEvent.userId === user?.id) return;
            
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
        });

        // 既読通知
        subscriptionsRef.current['read'] = clientRef.current.subscribe(`/topic/group/${groupId}/read`, (payload: IMessage) => {
            const readStatus: ReadStatus = JSON.parse(payload.body);
            setState(prev => {
                 if (prev.currentGroupId !== groupId) return prev;
                 // 既存のステータスを更新
                 const newStatus = prev.readStatus.filter(s => s.userId !== readStatus.userId);
                 newStatus.push(readStatus);
                 return { ...prev, readStatus: newStatus };
            });
        });
    }
  }, [user, loadMessages]);

  // 5. Actions
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!state.currentGroupId || !user) return;
    
    if (clientRef.current && clientRef.current.connected) {
        const payload = {
            content,
            imageUrl
        };
        // Publish先はAPI仕様書に従う: /app/chat.send
        // API側でセッションからuserIdを取得、destinationヘッダー等でgroupIdを特定すると想定されるが、
        // メッセージボディにgroupIdを含める必要があるかもしれない。
        // Swagger定義ではREST APIはgroupIdをパスに含む。STOMPは /app/chat.send とだけある。
        // 一般的にはメッセージボディにgroupIdを含める。
        
        const messageBody = {
            ...payload,
            groupId: state.currentGroupId
        };

        clientRef.current.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(messageBody)
        });
    } else {
        // フォールバック: REST API
        try {
            const res = await chatApi.sendMessageREST(state.currentGroupId, { content, imageUrl });
            // 送信成功したメッセージをローカルに即時反映
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, res.data]
            }));
        } catch (e) {
            console.error('Failed to send message via REST:', e);
            throw e;
        }
    }
  }, [state.currentGroupId, user]);

  const sendTyping = useCallback((isTyping: boolean) => {
     if (!state.currentGroupId || !clientRef.current?.connected) return;
     
     clientRef.current.publish({
         destination: '/app/chat.typing',
         body: JSON.stringify({ groupId: state.currentGroupId, isTyping })
     });
  }, [state.currentGroupId]);

  const sendRead = useCallback((messageId: string) => {
      if (!state.currentGroupId || !clientRef.current?.connected) return;

      clientRef.current.publish({
          destination: '/app/chat.read',
          body: JSON.stringify({ groupId: state.currentGroupId, messageId })
      });
  }, [state.currentGroupId]);

  const createGroup = useCallback(async (name: string, iconUrl?: string, initialMemberIds?: string[]) => {
      await chatApi.createGroup({ name, iconUrl, initialMemberIds });
      await refreshGroups();
  }, [refreshGroups]);

  return (
    <ChatContext.Provider value={{ 
        ...state, 
        selectGroup, 
        sendMessage, 
        sendTyping, 
        sendRead,
        createGroup,
        refreshGroups,
        loadMessages
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

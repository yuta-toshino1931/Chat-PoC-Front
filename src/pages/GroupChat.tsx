import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { GroupsService, MessagesService, ImagesService } from "../api";
import type { GroupDetail, Message, ReadStatus } from "../api";
import { useChat } from "../contexts/ChatContext";

// WebSocket関連の型定義
interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface PresenceUser {
  userId: string;
  userName: string;
  status: "online" | "away" | "offline";
}

const GroupChat = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { 
    selectGroup, 
    messages: wsMessages, 
    typingUsers: wsTypingUsers,
    presenceUsers: wsPresenceUsers,
    readStatus: wsReadStatus,
    sendTyping: wsSendTyping,
    sendPresence,
    isConnected 
  } = useChat();
  
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [readStatus, setReadStatus] = useState<ReadStatus[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const response = await GroupsService.getGroup(groupId);
      setGroup(response);

      // プレゼンス情報の初期化
      if (response.members) {
        setPresenceUsers(
          response.members.map((m) => ({
            userId: m.userId || "",
            userName: m.userName || "",
            status: "offline" as const,
          }))
        );
      }
    } catch (err) {
      console.error("グループ取得エラー:", err);
      setError("グループ情報の取得に失敗しました");
    }
  }, [groupId]);

  const fetchMessages = useCallback(
    async (before?: string) => {
      if (!groupId) return;
      try {
        const response = await MessagesService.getMessages(groupId, 50, before);
        if (before) {
          // 過去のメッセージを先頭に追加（古い順）
          setMessages((prev) => [...(response.messages || []), ...prev]);
        } else {
          setMessages(response.messages || []);
        }
        setHasMore(response.hasMore || false);
        setNextCursor(response.nextCursor || undefined);
      } catch (err) {
        console.error("メッセージ取得エラー:", err);
        setError("メッセージの取得に失敗しました");
      }
    },
    [groupId]
  );

  const fetchReadStatus = useCallback(async () => {
    if (!groupId) return;
    try {
      const response = await MessagesService.getReadStatus(groupId);
      setReadStatus(response);
    } catch (err) {
      console.error("既読状態取得エラー:", err);
    }
  }, [groupId]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchGroup(), fetchMessages(), fetchReadStatus()]);
      setIsLoading(false);
      
      // WebSocket購読を開始
      if (groupId) {
        selectGroup(groupId);
        // オンライン状態を送信
        sendPresence("online");
      }
    };
    init();
    
    // クリーンアップ時にaway状態を送信
    return () => {
      sendPresence("away");
    };
  }, [fetchGroup, fetchMessages, fetchReadStatus, groupId, selectGroup, sendPresence]);

  // WebSocket経由で受信したメッセージをローカル状態に同期
  useEffect(() => {
    if (wsMessages.length > 0) {
      setMessages(prev => {
        // 新しいメッセージを追加（重複排除）
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = wsMessages.filter(m => !existingIds.has(m.id));
        if (newMessages.length > 0) {
          return [...prev, ...newMessages];
        }
        // 既存メッセージの更新（編集など）
        return prev.map(m => {
          const updated = wsMessages.find(wm => wm.id === m.id);
          return updated || m;
        });
      });
    }
  }, [wsMessages]);

  // WebSocket経由の入力中ユーザーを同期
  useEffect(() => {
    console.log('wsTypingUsers updated:', wsTypingUsers);
    setTypingUsers(wsTypingUsers.map(t => ({
      userId: t.userId,
      userName: t.userName,
      isTyping: t.isTyping
    })));
  }, [wsTypingUsers]);

  // WebSocket経由のプレゼンス状態を同期
  useEffect(() => {
    setPresenceUsers(wsPresenceUsers.map(p => ({
      userId: p.userId,
      userName: p.userName,
      status: p.status
    })));
  }, [wsPresenceUsers]);

  // WebSocket経由の既読状態を同期
  useEffect(() => {
    if (wsReadStatus.length > 0) {
      setReadStatus(wsReadStatus);
    }
  }, [wsReadStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 既読を送信
  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!groupId) return;
      try {
        await MessagesService.markAsRead(groupId, messageId);
      } catch (err) {
        console.error("既読送信エラー:", err);
      }
    },
    [groupId]
  );

  // 最新メッセージを既読にする
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id && lastMessage.sender?.id !== currentUserId) {
        markAsRead(lastMessage.id);
      }
    }
  }, [messages, currentUserId, markAsRead]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("画像サイズは10MB以下にしてください");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !groupId) return;

    // 入力終了を送信
    if (isTypingRef.current && isConnected) {
      isTypingRef.current = false;
      wsSendTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsSending(true);
    try {
      let imageUrl: string | undefined;

      // 画像がある場合はアップロード
      if (selectedImage) {
        const uploadResponse = await ImagesService.uploadImage(groupId, {
          file: selectedImage,
        });
        imageUrl = uploadResponse.imageUrl || undefined;
      }

      // メッセージ送信（imageUrlがある場合のみ含める）
      const sentMessage = await MessagesService.sendMessage(groupId, {
        content: newMessage || (imageUrl ? "画像を送信しました" : ""),
        ...(imageUrl && { imageUrl }),
        temporaryId: `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      // WebSocket接続がない場合のみ楽観的UI更新
      // WebSocket接続時はサーバーからのブロードキャストで更新される
      if (!isConnected) {
        setMessages((prev) => [...prev, sentMessage]);
      }
      setNewMessage("");
      removeSelectedImage();
    } catch (err) {
      console.error("メッセージ送信エラー:", err);
      setError("メッセージの送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim() || !groupId) return;

    try {
      const updatedMessage = await MessagesService.editMessage(
        groupId,
        messageId,
        { content: editContent }
      );
      // WebSocket接続がない場合のみローカル更新
      if (!isConnected) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? updatedMessage : m))
        );
      }
      setEditingMessageId(null);
      setEditContent("");
    } catch (err) {
      console.error("メッセージ編集エラー:", err);
      setError("メッセージの編集に失敗しました");
    }
  };

  const handleTyping = () => {
    // 入力開始を送信（まだ送信していない場合）
    if (!isTypingRef.current && isConnected) {
      isTypingRef.current = true;
      console.log('Sending typing: true, isConnected:', isConnected);
      wsSendTyping(true);
    }
    
    // デバウンス処理
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 3秒後に入力終了を送信
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && isConnected) {
        isTypingRef.current = false;
        console.log('Sending typing: false');
        wsSendTyping(false);
      }
    }, 3000);
  };

  const loadMoreMessages = () => {
    if (hasMore && nextCursor) {
      fetchMessages(nextCursor);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 日付が変わったかチェック
  const isNewDay = (current?: string, previous?: string) => {
    if (!current || !previous) return true;
    return formatDate(current) !== formatDate(previous);
  };

  // 既読情報を取得
  const getReadCount = (messageId?: string) => {
    if (!messageId) return 0;
    return readStatus.filter((rs) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const readMessageIndex = messages.findIndex(
        (m) => m.id === rs.lastReadMessageId
      );
      return readMessageIndex >= messageIndex && rs.userId !== currentUserId;
    }).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/groups" className="mr-4 text-gray-500 hover:text-gray-700">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex items-center">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={group?.iconUrl || "/people.png"}
              alt={group?.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/people.png";
              }}
            />
            <div className="ml-3">
              <h2 className="text-lg font-medium text-gray-900">{group?.name}</h2>
              <div className="flex items-center text-sm text-gray-500">
                <span>{group?.memberCount}人のメンバー</span>
                {presenceUsers.filter((u) => u.status === "online").length > 0 && (
                  <span className="ml-2 flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                    {presenceUsers.filter((u) => u.status === "online").length}人オンライン
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/groups/${groupId}/members`}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            title="メンバー"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </Link>
          <Link
            to={`/groups/${groupId}/settings`}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            title="設定"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              過去のメッセージを読み込む
            </button>
          </div>
        )}

        {messages.map((message, index) => {
          const isOwn = message.sender?.id === currentUserId;
          const showDate =
            index === 0 ||
            isNewDay(message.createdAt, messages[index - 1]?.createdAt);

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end max-w-[70%]`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0 mr-2">
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={message.sender?.avatarUrl || "/human.png"}
                        alt={message.sender?.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/human.png";
                        }}
                      />
                    </div>
                  )}

                  <div className={isOwn ? "mr-2" : "ml-2"}>
                    {!isOwn && (
                      <p className="text-xs text-gray-500 mb-1">
                        {message.sender?.name}
                      </p>
                    )}

                    {editingMessageId === message.id ? (
                      <div className="bg-white rounded-lg shadow p-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          rows={2}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditContent("");
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => handleEditMessage(message.id!)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-white shadow text-gray-900"
                        }`}
                      >
                        {message.imageUrl && typeof message.imageUrl === "string" && message.imageUrl.trim() !== "" && (
                          <img
                            src={message.imageUrl}
                            alt="送信画像"
                            className="max-w-xs rounded mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div
                          className={`flex items-center justify-between mt-1 text-xs ${
                            isOwn ? "text-blue-200" : "text-gray-400"
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          <div className="flex items-center space-x-2">
                            {message.isEdited && <span>(編集済み)</span>}
                            {isOwn && (
                              <span>
                                既読 {getReadCount(message.id)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 入力中表示 */}
        {typingUsers.length > 0 && (
          <div className="flex items-center text-gray-500 text-sm">
            <div className="flex space-x-1 mr-2">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
            <span>
              {typingUsers.map((u) => u.userName).join(", ")}が入力中...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 画像プレビュー */}
      {imagePreview && (
        <div className="bg-gray-100 p-2 border-t border-gray-200">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="プレビュー"
              className="h-20 rounded"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="メッセージを入力..."
              rows={1}
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isSending || (!newMessage.trim() && !selectedImage)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <svg
                className="animate-spin h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;

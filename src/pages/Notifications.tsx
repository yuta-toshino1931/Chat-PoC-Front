import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MembersService } from "../api";
import type { Invitation } from "../api";
import { useChat } from "../contexts/ChatContext";

// 通知の型定義
interface NotificationItem {
  id: string;
  type: "invitation" | "mention" | "group_updated";
  title: string;
  message: string;
  data?: Invitation | Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications: wsNotifications, isConnected, clearNotifications } = useChat();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // REST APIから招待一覧を取得
  const fetchInvitations = useCallback(async () => {
    try {
      const invitations = await MembersService.getMyInvitations();
      const invitationNotifications: NotificationItem[] = invitations.map((inv) => ({
        id: `invitation-${inv.id}`,
        type: "invitation" as const,
        title: "グループへの招待",
        message: `${inv.invitedBy?.name || "誰か"}から「${inv.groupName || "グループ"}」への招待が届きました`,
        data: inv,
        createdAt: inv.createdAt || new Date().toISOString(),
        isRead: false,
      }));
      return invitationNotifications;
    } catch (err) {
      console.error("招待一覧取得エラー:", err);
      return [];
    }
  }, []);

  // ページロード時にREST APIから招待一覧を取得
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      const invitationNotifications = await fetchInvitations();
      
      // WebSocket経由の通知と結合（重複排除）
      const wsNotificationItems: NotificationItem[] = wsNotifications
        .filter((n) => n.type !== "invitation") // 招待はREST APIから取得するので除外
        .map((n, index) => {
          let title = "";
          let message = "";
          
          switch (n.type) {
            case "mention":
              title = "メンションされました";
              message = `${(n.data as { groupName?: string })?.groupName || "グループ"}であなたがメンションされました`;
              break;
            case "group_updated":
              title = "グループが更新されました";
              message = "グループ情報が変更されました";
              break;
            default:
              title = "新しい通知";
              message = "新しい通知があります";
          }
          
          return {
            id: `${n.type}-${index}-${n.receivedAt}`,
            type: n.type,
            title,
            message,
            data: n.data as Invitation | Record<string, unknown>,
            createdAt: n.receivedAt,
            isRead: false,
          };
        });
      
      // 招待通知 + その他の通知を結合して日時でソート
      const allNotifications = [...invitationNotifications, ...wsNotificationItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(allNotifications);
      setIsLoading(false);
    };

    loadNotifications();
  }, [wsNotifications, fetchInvitations]);

  const handleAcceptInvitation = async (notification: NotificationItem) => {
    const invitation = notification.data as Invitation;
    if (!invitation?.groupId || !invitation?.id) return;

    setProcessingId(notification.id);
    setError(null);
    try {
      await MembersService.respondToInvitation(
        invitation.groupId,
        invitation.id,
        { action: "accept" }
      );
      // 通知リストから削除
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      // グループページへ遷移
      navigate(`/groups/${invitation.groupId}`);
    } catch (err) {
      console.error("招待承諾エラー:", err);
      setError("招待の承諾に失敗しました");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (notification: NotificationItem) => {
    const invitation = notification.data as Invitation;
    if (!invitation?.groupId || !invitation?.id) return;

    setProcessingId(notification.id);
    setError(null);
    try {
      await MembersService.respondToInvitation(
        invitation.groupId,
        invitation.id,
        { action: "reject" }
      );
      // 通知リストから削除
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (err) {
      console.error("招待拒否エラー:", err);
      setError("招待の拒否に失敗しました");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString("ja-JP");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invitation":
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        );
      case "mention":
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
          </div>
        );
      case "group_updated":
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">通知</h1>
        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            すべてクリア
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            通知はありません
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            新しい通知があるとここに表示されます
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-4 py-4 sm:px-6 ${
                  !notification.isRead ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start">
                  {getNotificationIcon(notification.type)}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>

                    {notification.type === "invitation" && (
                      <div className="mt-3 flex space-x-3">
                        <button
                          onClick={() => handleAcceptInvitation(notification)}
                          disabled={processingId === notification.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {processingId === notification.id
                            ? "処理中..."
                            : "承諾"}
                        </button>
                        <button
                          onClick={() => handleRejectInvitation(notification)}
                          disabled={processingId === notification.id}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          拒否
                        </button>
                      </div>
                    )}

                    {notification.type === "mention" && (
                      <button
                        onClick={() => {
                          const data = notification.data as {
                            groupId?: string;
                          };
                          if (data?.groupId) {
                            navigate(`/groups/${data.groupId}`);
                          }
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        メッセージを見る
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WebSocket接続状態表示 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          リアルタイム通知
        </h3>
        <p className="text-xs text-gray-500">
          WebSocket接続により、招待やメンションなどの通知がリアルタイムで受信されます。
        </p>
        <div className="mt-2 flex items-center">
          <span className={`h-2 w-2 ${isConnected ? "bg-green-500" : "bg-gray-400"} rounded-full mr-2`}></span>
          <span className="text-xs text-gray-600">{isConnected ? "接続中" : "未接続"}</span>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

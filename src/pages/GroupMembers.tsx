import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { GroupsService, MembersService } from "../api";
import type { GroupDetail, Member } from "../api";

const GroupMembers = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  const fetchGroupAndMembers = useCallback(async () => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const [groupResponse, membersResponse] = await Promise.all([
        GroupsService.getGroup(groupId),
        MembersService.getMembers(groupId),
      ]);
      setGroup(groupResponse);
      setMembers(membersResponse);
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupAndMembers();
  }, [fetchGroupAndMembers]);

  const isAdmin = members.find((m) => m.userId === currentUserId)?.role === "admin";

  const handleInvite = async () => {
    if (!groupId || !inviteEmail.trim()) return;

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError("有効なメールアドレスを入力してください");
      return;
    }

    setIsInviting(true);
    setError(null);
    try {
      await MembersService.inviteMember(groupId, {
        email: inviteEmail,
        message: inviteMessage || undefined,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteMessage("");
      setSuccessMessage("招待を送信しました");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("招待エラー:", err);
      setError("招待の送信に失敗しました。既に招待済みかメンバーである可能性があります。");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName?: string) => {
    if (!groupId) return;
    if (!window.confirm(`${userName || "このメンバー"}をグループから除外しますか？`)) return;

    setRemovingUserId(userId);
    setError(null);
    try {
      await MembersService.removeMember(groupId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setSuccessMessage("メンバーを除外しました");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("メンバー除外エラー:", err);
      setError("メンバーの除外に失敗しました");
    } finally {
      setRemovingUserId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        <div className="flex items-center">
          <Link
            to={`/groups/${groupId}`}
            className="mr-4 text-gray-500 hover:text-gray-700"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">メンバー管理</h1>
            <p className="text-sm text-gray-500">{group?.name}</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            メンバーを招待
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            メンバー一覧 ({members.length}人)
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.userId} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={member.avatarUrl || "/human.png"}
                      alt={member.userName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/human.png";
                      }}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {member.userName}
                      </p>
                      {member.userId === currentUserId && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          あなた
                        </span>
                      )}
                      {member.role === "admin" && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          管理者
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(member.joinedAt)}から参加
                    </p>
                  </div>
                </div>
                {isAdmin &&
                  member.userId !== currentUserId &&
                  member.role !== "admin" && (
                    <button
                      onClick={() =>
                        handleRemoveMember(member.userId!, member.userName)
                      }
                      disabled={removingUserId === member.userId}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      {removingUserId === member.userId ? "処理中..." : "除外"}
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 招待モーダル */}
      {showInviteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowInviteModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  メンバーを招待
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="invite-email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      id="invite-email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="example@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="invite-message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      招待メッセージ（任意）
                    </label>
                    <textarea
                      id="invite-message"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="招待メッセージを入力..."
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInviting ? "送信中..." : "招待を送信"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteMessage("");
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMembers;

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GroupsService, MembersService } from "../api";
import type { GroupDetail, Member } from "../api";

const GroupSettings = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState("");

  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const response = await GroupsService.getGroup(groupId);
      setGroup(response);
      setName(response.name || "");
      setIconUrl(response.iconUrl || "");
    } catch (err) {
      console.error("グループ取得エラー:", err);
      setError("グループ情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const isAdmin = group?.members?.find(
    (m: Member) => m.userId === currentUserId
  )?.role === "admin";

  const handleSave = async () => {
    if (!groupId) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await GroupsService.updateGroup(groupId, {
        name: name || undefined,
        iconUrl: iconUrl || undefined,
      });
      setGroup((prev) => (prev ? { ...prev, ...updated } : prev));
      setSuccessMessage("グループ情報を更新しました");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("グループ更新エラー:", err);
      setError("グループ情報の更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    setIsDeleting(true);
    try {
      await GroupsService.deleteGroup(groupId);
      navigate("/groups");
    } catch (err) {
      console.error("グループ削除エラー:", err);
      setError("グループの削除に失敗しました");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!groupId) return;

    setIsLeaving(true);
    try {
      await MembersService.leaveGroup(groupId, {
        newAdminUserId: isAdmin && newAdminUserId ? newAdminUserId : undefined,
      });
      navigate("/groups");
    } catch (err) {
      console.error("グループ退出エラー:", err);
      setError("グループからの退出に失敗しました。管理者の場合は新しい管理者を指名してください。");
      setShowLeaveConfirm(false);
    } finally {
      setIsLeaving(false);
    }
  };

  const otherMembers = group?.members?.filter(
    (m: Member) => m.userId !== currentUserId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
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
        <h1 className="text-2xl font-semibold text-gray-900">グループ設定</h1>
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

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="group-name"
                className="block text-sm font-medium text-gray-700"
              >
                グループ名
              </label>
              <input
                type="text"
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="icon-url"
                className="block text-sm font-medium text-gray-700"
              >
                アイコンURL
              </label>
              <input
                type="text"
                id="icon-url"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                disabled={!isAdmin}
                placeholder="https://example.com/icon.jpg"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {iconUrl && (
                <div className="mt-2">
                  <img
                    src={iconUrl}
                    alt="プレビュー"
                    className="h-16 w-16 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "保存中..." : "保存"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            グループ情報
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">メンバー数</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {group?.memberCount}人
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">作成日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {group?.createdAt
                  ? new Date(group.createdAt).toLocaleDateString("ja-JP")
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">あなたの役割</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {isAdmin ? "管理者" : "メンバー"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-red-900 mb-4">危険な操作</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium text-gray-900">グループを退出</p>
                <p className="text-sm text-gray-500">
                  このグループから退出します
                </p>
              </div>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                退出
              </button>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-md">
                <div>
                  <p className="font-medium text-red-900">グループを削除</p>
                  <p className="text-sm text-red-700">
                    グループとすべてのメッセージが削除されます
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 退出確認モーダル */}
      {showLeaveConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowLeaveConfirm(false)}
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
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    グループを退出しますか？
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      退出後は再度招待されない限りグループに参加できません。
                    </p>
                  </div>

                  {isAdmin && otherMembers && otherMembers.length > 0 && (
                    <div className="mt-4">
                      <label
                        htmlFor="new-admin"
                        className="block text-sm font-medium text-gray-700 text-left"
                      >
                        新しい管理者を選択（必須）
                      </label>
                      <select
                        id="new-admin"
                        value={newAdminUserId}
                        onChange={(e) => setNewAdminUserId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">選択してください</option>
                        {otherMembers.map((member: Member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.userName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={isLeaving || (isAdmin && !newAdminUserId)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLeaving ? "退出中..." : "退出する"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    setNewAdminUserId("");
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

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowDeleteConfirm(false)}
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
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    グループを削除しますか？
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      この操作は取り消せません。グループとすべてのメッセージが完全に削除されます。
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "削除中..." : "削除する"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
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

export default GroupSettings;

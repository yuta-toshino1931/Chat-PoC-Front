import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";

// ナビゲーションアイテムの型
interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  hasBadge?: boolean;
}

// サイドバーのナビゲーションアイテム
const navigationItems: NavigationItem[] = [
  {
    name: "グループ",
    path: "/groups",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: "通知",
    path: "/notifications",
    hasBadge: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    name: "設定",
    path: "/settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const Layout = ({ children, fullWidth = false }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { notifications, isConnected, clearNotifications } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 未読通知数
  const unreadNotificationCount = notifications.length;

  // ログアウト処理
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 現在のパスがナビゲーションアイテムに一致するかチェック
  const isActive = (path: string) => {
    if (path === "/groups") {
      return location.pathname === "/groups" || location.pathname.startsWith("/groups/");
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/groups" className="flex items-center">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-gray-900">Chat</span>
                </Link>
              </div>

              {/* デスクトップナビゲーション */}
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => {
                      if (item.path === "/notifications") {
                        clearNotifications();
                      }
                    }}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive(item.path)
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                    {item.hasBadge && unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex md:items-center">
                {/* WebSocket接続状態 */}
                <div className="mr-4 flex items-center" title={isConnected ? "リアルタイム接続中" : "接続なし"}>
                  <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}></span>
                </div>
                <div className="ml-3 relative flex items-center">
                  <div className="flex items-center">
                    {user && (
                      <div className="flex items-center mr-4">
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={user.avatarUrl || "/human.png"}
                          alt={user.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/human.png";
                          }}
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {user.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              </div>

              {/* モバイルメニューボタン */}
              <div className="ml-3 md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <span className="sr-only">メニューを開く</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (item.path === "/notifications") {
                      clearNotifications();
                    }
                  }}
                  className={`relative flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(item.path)
                      ? "border-blue-500 text-blue-700 bg-blue-50"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.hasBadge && unreadNotificationCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={user?.avatarUrl || "/human.png"}
                    alt={user?.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/human.png";
                    }}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {fullWidth ? (
          <div className="h-[calc(100vh-4rem)]">{children}</div>
        ) : (
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;

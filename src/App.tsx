import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import Layout from "./components/Layout";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Groups from "./pages/Groups";
import GroupChat from "./pages/GroupChat";
import GroupSettings from "./pages/GroupSettings";
import GroupMembers from "./pages/GroupMembers";
import Notifications from "./pages/Notifications";
import { useEffect } from "react";

// 認証が必要なページをラップするコンポーネント
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading, shouldRedirectToLogin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // cookieに「userId」キーが無い場合は、必ずlogin画面に遷移
  if (shouldRedirectToLogin) {
    return <Navigate to="/login" replace />;
  }

  // ユーザーが存在しない場合はログイン画面に遷移
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// メインアプリケーションコンポーネント
const AppContent: React.FC = () => {
  // 検索エンジンボット対策の強化
  useEffect(() => {
    // User-Agentベースでのボット検出
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

    if (isBot) {
      // ボットの場合は空のページを表示
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h1>会員限定サイト</h1>
            <p>このサイトは会員限定です。</p>
            <p>アクセスには認証が必要です。</p>
          </div>
        </div>
      `;
      return;
    }

    // メタタグの動的追加（念のため）
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, nofollow, noarchive, nosnippet, noimageindex";
      document.head.appendChild(meta);
    }

    // ページタイトル設定
    document.title = "チャットアプリ";
  }, []);

  return (
    <Routes>
      {/* 認証不要のページ */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* デフォルトルートをグループ一覧にリダイレクト */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/groups" replace />
          </ProtectedRoute>
        }
      />

      {/* グループ一覧 */}
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <Layout>
              <Groups />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* グループ詳細（チャット） */}
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <Layout fullWidth>
              <GroupChat />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* グループ設定 */}
      <Route
        path="/groups/:groupId/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <GroupSettings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* グループメンバー管理 */}
      <Route
        path="/groups/:groupId/members"
        element={
          <ProtectedRoute>
            <Layout>
              <GroupMembers />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 通知 */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 個人設定 */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 - 未知のルートはグループ一覧にリダイレクト */}
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
};

function App() {
  // Viteのベースパスを取得
  const basename = import.meta.env.BASE_URL;

  return (
    <AuthProvider>
      <ChatProvider>
        <Router basename={basename}>
          <AppContent />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;

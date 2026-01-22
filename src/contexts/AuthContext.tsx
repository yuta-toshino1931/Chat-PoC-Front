import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

// ユーザー型定義
interface User {
  id: string;
  name: string;
  email: string;
  isSetupComplete: boolean;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  shouldRedirectToLogin: boolean;
  shouldRedirectToSetup: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [shouldRedirectToSetup, setShouldRedirectToSetup] = useState(false);

  // 初期化時にローカルストレージからユーザー情報を取得
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // ユーザーのセットアップ状態に基づいてリダイレクト設定
      setShouldRedirectToSetup(!parsedUser.isSetupComplete);
    } else {
      setShouldRedirectToLogin(true);
    }
    setIsLoading(false);
  }, []);

  // ログイン処理
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // デモ用の簡易認証
      if (email && password) {
        // 実際のアプリではAPIリクエストを行う
        const demoUser: User = {
          id: "demo-user-id",
          name: "デモユーザー",
          email: email,
          isSetupComplete: true,
        };

        // ユーザー情報をローカルストレージに保存
        localStorage.setItem("user", JSON.stringify(demoUser));
        setUser(demoUser);
        setShouldRedirectToLogin(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("ログインエラー:", error);
      return false;
    }
  };

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShouldRedirectToLogin(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        shouldRedirectToLogin,
        shouldRedirectToSetup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 認証コンテキストを使用するためのカスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthService, OpenAPI } from "../api";
import type { UserDetail } from "../api";

// トークン保存用のキー
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

// ユーザー型定義（APIのUserDetailを拡張）
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status?: string;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  shouldRedirectToLogin: boolean;
  shouldRedirectToSetup: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// トークンをOpenAPIに設定するヘルパー関数
const setApiToken = (token: string | undefined) => {
  OpenAPI.TOKEN = token;
};

// UserDetailからUserへの変換
const mapUserDetailToUser = (userDetail: UserDetail): User => {
  return {
    id: userDetail.id || "",
    name: userDetail.name || "",
    email: userDetail.email || "",
    avatarUrl: userDetail.avatarUrl,
    status: userDetail.status,
  };
};

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [shouldRedirectToSetup, setShouldRedirectToSetup] = useState(false);

  // アクセストークンのリフレッシュ
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await AuthService.refreshToken({ refreshToken });
      if (response.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        setApiToken(response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("トークンリフレッシュエラー:", error);
      // リフレッシュ失敗時はログアウト状態にする
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setApiToken(undefined);
      return false;
    }
  }, []);

  // 初期化時にローカルストレージからトークンとユーザー情報を取得
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (accessToken) {
        // トークンをAPIに設定
        setApiToken(accessToken);

        // 保存されたユーザー情報があれば復元
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setShouldRedirectToLogin(false);
          } catch {
            // パースエラーの場合はAPIから取得を試みる
            try {
              const userDetail = await AuthService.getMe();
              const mappedUser = mapUserDetailToUser(userDetail);
              setUser(mappedUser);
              localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
              setShouldRedirectToLogin(false);
            } catch (error) {
              console.error("ユーザー情報取得エラー:", error);
              // トークンが無効な場合はリフレッシュを試みる
              const refreshed = await refreshAccessToken();
              if (!refreshed) {
                setShouldRedirectToLogin(true);
              }
            }
          }
        } else {
          // ユーザー情報がない場合はAPIから取得
          try {
            const userDetail = await AuthService.getMe();
            const mappedUser = mapUserDetailToUser(userDetail);
            setUser(mappedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
            setShouldRedirectToLogin(false);
          } catch (error) {
            console.error("ユーザー情報取得エラー:", error);
            // トークンが無効な場合はリフレッシュを試みる
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
              setShouldRedirectToLogin(true);
            }
          }
        }
      } else {
        setShouldRedirectToLogin(true);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [refreshAccessToken]);

  // ログイン処理
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await AuthService.login({ email, password });

      if (response.tokens?.accessToken && response.user) {
        // トークンを保存
        localStorage.setItem(ACCESS_TOKEN_KEY, response.tokens.accessToken);
        if (response.tokens.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refreshToken);
        }

        // OpenAPIにトークンを設定
        setApiToken(response.tokens.accessToken);

        // ユーザー情報を保存
        const mappedUser = mapUserDetailToUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
        setUser(mappedUser);
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
  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // サーバー側でリフレッシュトークンを無効化
    if (refreshToken) {
      try {
        await AuthService.logout({ refreshToken });
      } catch (error) {
        console.error("ログアウトAPIエラー:", error);
        // APIエラーでもローカルのクリアは続行
      }
    }

    // ローカルストレージをクリア
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // OpenAPIのトークンをクリア
    setApiToken(undefined);

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
        refreshAccessToken,
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

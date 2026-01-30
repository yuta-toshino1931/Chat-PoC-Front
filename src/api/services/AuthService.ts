/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponse } from '../models/AuthResponse';
import type { LoginRequest } from '../models/LoginRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { TokenResponse } from '../models/TokenResponse';
import type { UserDetail } from '../models/UserDetail';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * ユーザー登録
     * 新規ユーザーを作成し、トークンを発行する。
     * @param requestBody
     * @returns AuthResponse 登録成功
     * @throws ApiError
     */
    public static register(
        requestBody: RegisterRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが不正`,
                409: `メールアドレスが既に使用されている`,
            },
        });
    }
    /**
     * ログイン
     * メールアドレスとパスワードで認証し、トークンを発行する。
     * @param requestBody
     * @returns AuthResponse ログイン成功
     * @throws ApiError
     */
    public static login(
        requestBody: LoginRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `認証失敗（パスワード不一致など）`,
            },
        });
    }
    /**
     * トークンリフレッシュ
     * 有効期限切れのアクセストークンを更新する。
     * リフレッシュトークンを送信し、新しいアクセストークンを取得する。
     *
     * @param requestBody
     * @returns TokenResponse 更新成功
     * @throws ApiError
     */
    public static refreshToken(
        requestBody: {
            /**
             * ログイン時に取得したリフレッシュトークン
             */
            refreshToken: string;
        },
    ): CancelablePromise<TokenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `リフレッシュトークンが無効または期限切れ（再ログインが必要）`,
            },
        });
    }
    /**
     * ログアウト
     * リフレッシュトークンを無効化する。
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static logout(
        requestBody: {
            refreshToken: string;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/logout',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 自分の情報を取得
     * 現在のログインユーザーの詳細情報を取得する。アプリ起動時の初期化などに使用。
     * @returns UserDetail 成功
     * @throws ApiError
     */
    public static getMe(): CancelablePromise<UserDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/me',
            errors: {
                401: `認証が必要、またはトークンが無効`,
            },
        });
    }
}

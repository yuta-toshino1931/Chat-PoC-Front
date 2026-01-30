/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TokenResponse = {
    /**
     * APIアクセスおよびWebSocket接続用 (通常 有効期限15分〜1時間)
     */
    accessToken?: string;
    /**
     * アクセストークン再発行用 (通常 有効期限7日〜30日)
     */
    refreshToken?: string;
    /**
     * アクセストークンの有効秒数
     */
    expiresIn?: number;
};


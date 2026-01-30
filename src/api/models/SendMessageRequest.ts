/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SendMessageRequest = {
    /**
     * クライアント側で生成した一意なID（冪等性確保用）
     */
    temporaryId?: string;
    content: string;
    /**
     * 画像URL（事前にアップロードして取得）
     */
    imageUrl?: string | null;
    /**
     * リプライ元メッセージID
     */
    replyToMessageId?: string | null;
    /**
     * メンションするユーザーIDの配列
     */
    mentions?: Array<string>;
};


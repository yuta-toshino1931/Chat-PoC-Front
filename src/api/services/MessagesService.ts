/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from '../models/Message';
import type { MessageListResponse } from '../models/MessageListResponse';
import type { ReadStatus } from '../models/ReadStatus';
import type { SendMessageRequest } from '../models/SendMessageRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessagesService {
    /**
     * メッセージ履歴取得
     * 指定グループのメッセージ履歴をページネーションで取得
     * @param groupId グループID
     * @param limit 取得件数
     * @param before このメッセージIDより前を取得（カーソルページネーション）
     * @returns MessageListResponse 成功
     * @throws ApiError
     */
    public static getMessages(
        groupId: string,
        limit: number = 50,
        before?: string,
    ): CancelablePromise<MessageListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{groupId}/messages',
            path: {
                'groupId': groupId,
            },
            query: {
                'limit': limit,
                'before': before,
            },
            errors: {
                403: `権限なし`,
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * メッセージ送信（REST）
     * REST経由でメッセージを送信。
     * `temporaryId` を指定することで、リトライ時の二重送信を防ぎます。
     *
     * @param groupId グループID
     * @param requestBody
     * @returns Message 送信成功
     * @throws ApiError
     */
    public static sendMessage(
        groupId: string,
        requestBody: SendMessageRequest,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{groupId}/messages',
            path: {
                'groupId': groupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが不正`,
                403: `権限なし`,
            },
        });
    }
    /**
     * メッセージ編集
     * 自分のメッセージを編集する。
     * 編集内容はWebSocket経由で `MessageEdited` として通知される。
     *
     * @param groupId グループID
     * @param messageId メッセージID
     * @param requestBody
     * @returns Message 編集成功
     * @throws ApiError
     */
    public static editMessage(
        groupId: string,
        messageId: string,
        requestBody: {
            content: string;
        },
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/groups/{groupId}/messages/{messageId}',
            path: {
                'groupId': groupId,
                'messageId': messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが不正`,
                403: `権限なし`,
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * メッセージ削除
     * 自分のメッセージを削除する（論理削除）。
     * 削除イベントはWebSocket経由で `MessageDeleted` として通知される。
     *
     * @param groupId グループID
     * @param messageId メッセージID
     * @returns void
     * @throws ApiError
     */
    public static deleteMessage(
        groupId: string,
        messageId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{groupId}/messages/{messageId}',
            path: {
                'groupId': groupId,
                'messageId': messageId,
            },
            errors: {
                403: `権限なし`,
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * 既読をつける
     * 指定メッセージまでを既読にする。
     * ※WebSocketでのブロードキャストは行われないため、サーバー負荷が低い。
     *
     * @param groupId グループID
     * @param messageId メッセージID
     * @returns ReadStatus 既読更新成功
     * @throws ApiError
     */
    public static markAsRead(
        groupId: string,
        messageId: string,
    ): CancelablePromise<ReadStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{groupId}/messages/{messageId}/read',
            path: {
                'groupId': groupId,
                'messageId': messageId,
            },
            errors: {
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * 既読状態一覧取得
     * グループ内の各メンバーの既読位置を取得。
     * 画面を開いた際や、定期的なポーリング（長めの間隔推奨）で使用する。
     *
     * @param groupId グループID
     * @returns ReadStatus 成功
     * @throws ApiError
     */
    public static getReadStatus(
        groupId: string,
    ): CancelablePromise<Array<ReadStatus>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{groupId}/read-status',
            path: {
                'groupId': groupId,
            },
        });
    }
}

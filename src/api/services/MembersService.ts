/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Invitation } from '../models/Invitation';
import type { InviteMemberRequest } from '../models/InviteMemberRequest';
import type { Member } from '../models/Member';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MembersService {
    /**
     * 自分への招待一覧取得
     * 現在のユーザーが受け取った招待（未応答のもの）を一覧取得する。
     * @returns Invitation 成功
     * @throws ApiError
     */
    public static getMyInvitations(): CancelablePromise<Array<Invitation>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/invitations',
            errors: {
                401: `認証が必要、またはトークンが無効`,
            },
        });
    }
    /**
     * メンバー一覧取得
     * @param groupId グループID
     * @returns Member 成功
     * @throws ApiError
     */
    public static getMembers(
        groupId: string,
    ): CancelablePromise<Array<Member>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{groupId}/members',
            path: {
                'groupId': groupId,
            },
        });
    }
    /**
     * メンバー招待
     * ユーザーをグループに招待（管理者のみ）
     * @param groupId グループID
     * @param requestBody
     * @returns Invitation 招待成功
     * @throws ApiError
     */
    public static inviteMember(
        groupId: string,
        requestBody: InviteMemberRequest,
    ): CancelablePromise<Invitation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{groupId}/invitations',
            path: {
                'groupId': groupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `既に招待済み or メンバー`,
                403: `権限なし`,
            },
        });
    }
    /**
     * 招待に応答
     * 招待を承諾または拒否
     * @param groupId グループID
     * @param invitationId
     * @param requestBody
     * @returns Member 応答成功
     * @throws ApiError
     */
    public static respondToInvitation(
        groupId: string,
        invitationId: string,
        requestBody: {
            action: 'accept' | 'reject';
        },
    ): CancelablePromise<Member> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{groupId}/invitations/{invitationId}',
            path: {
                'groupId': groupId,
                'invitationId': invitationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * メンバー除外
     * メンバーをグループから除外（管理者のみ）。管理者自身は除外不可。
     * @param groupId グループID
     * @param userId
     * @returns void
     * @throws ApiError
     */
    public static removeMember(
        groupId: string,
        userId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{groupId}/members/{userId}',
            path: {
                'groupId': groupId,
                'userId': userId,
            },
            errors: {
                400: `管理者は除外不可`,
                403: `権限なし`,
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * グループ退出
     * 自分でグループから退出。管理者が退出する場合は別の管理者を指名必須。
     * @param groupId グループID
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static leaveGroup(
        groupId: string,
        requestBody?: {
            /**
             * 管理者が退出する場合、新しい管理者のユーザーID
             */
            newAdminUserId?: string;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{groupId}/leave',
            path: {
                'groupId': groupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `管理者は新しい管理者を指名必須`,
            },
        });
    }
}

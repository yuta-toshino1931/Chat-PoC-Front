/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGroupRequest } from '../models/CreateGroupRequest';
import type { Group } from '../models/Group';
import type { GroupDetail } from '../models/GroupDetail';
import type { UpdateGroupRequest } from '../models/UpdateGroupRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GroupsService {
    /**
     * 参加グループ一覧取得
     * 自分が参加しているグループの一覧を取得
     * @returns Group 成功
     * @throws ApiError
     */
    public static getGroups(): CancelablePromise<Array<Group>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups',
        });
    }
    /**
     * グループ作成
     * 新しいグループを作成。作成者は自動的に管理者になる。
     * @param requestBody
     * @returns Group 作成成功
     * @throws ApiError
     */
    public static createGroup(
        requestBody: CreateGroupRequest,
    ): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが不正`,
            },
        });
    }
    /**
     * グループ詳細取得
     * @param groupId グループID
     * @returns GroupDetail 成功
     * @throws ApiError
     */
    public static getGroup(
        groupId: string,
    ): CancelablePromise<GroupDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{groupId}',
            path: {
                'groupId': groupId,
            },
            errors: {
                404: `リソースが見つからない`,
            },
        });
    }
    /**
     * グループ情報更新
     * グループ名やアイコンを更新（管理者のみ）
     * @param groupId グループID
     * @param requestBody
     * @returns Group 更新成功
     * @throws ApiError
     */
    public static updateGroup(
        groupId: string,
        requestBody: UpdateGroupRequest,
    ): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/groups/{groupId}',
            path: {
                'groupId': groupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `権限なし`,
            },
        });
    }
    /**
     * グループ削除
     * グループを削除（管理者のみ）。全メッセージも削除される。
     * @param groupId グループID
     * @returns void
     * @throws ApiError
     */
    public static deleteGroup(
        groupId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{groupId}',
            path: {
                'groupId': groupId,
            },
            errors: {
                403: `権限なし`,
                404: `リソースが見つからない`,
            },
        });
    }
}

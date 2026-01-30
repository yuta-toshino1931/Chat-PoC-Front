/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageUploadResponse } from '../models/ImageUploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ImagesService {
    /**
     * 画像アップロード
     * 画像をアップロードし、URLを取得。
     * 取得したURLをメッセージ送信時に `imageUrl` として指定。
     *
     * @param groupId グループID
     * @param formData
     * @returns ImageUploadResponse アップロード成功
     * @throws ApiError
     */
    public static uploadImage(
        groupId: string,
        formData: {
            /**
             * 画像ファイル（JPEG, PNG, GIF, WebP）
             */
            file: Blob;
        },
    ): CancelablePromise<ImageUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{groupId}/images',
            path: {
                'groupId': groupId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `不正なファイル形式`,
                413: `ファイルサイズ超過（上限10MB）`,
            },
        });
    }
}

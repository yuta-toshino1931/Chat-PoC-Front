/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReplyToMessage } from './ReplyToMessage';
import type { UserSummary } from './UserSummary';
export type Message = {
    id?: string;
    groupId?: string;
    sender?: UserSummary;
    content?: string;
    imageUrl?: string | null;
    messageType?: Message.messageType;
    replyTo?: ReplyToMessage;
    /**
     * メンションされたユーザーID
     */
    mentions?: Array<string>;
    isEdited?: boolean;
    createdAt?: string;
    /**
     * 編集された場合の日時
     */
    updatedAt?: string | null;
};
export namespace Message {
    export enum messageType {
        TEXT = 'text',
        IMAGE = 'image',
        SYSTEM = 'system',
    }
}


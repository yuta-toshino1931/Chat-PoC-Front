/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserSummary } from './UserSummary';
/**
 * リプライ元メッセージの要約
 */
export type ReplyToMessage = {
    id?: string;
    /**
     * 元メッセージの本文（100文字で切り捨て）
     */
    content?: string;
    sender?: UserSummary;
};


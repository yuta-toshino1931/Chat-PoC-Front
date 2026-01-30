/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserSummary } from './UserSummary';
export type UserDetail = (UserSummary & {
    email?: string;
    createdAt?: string;
    status?: UserDetail.status;
});
export namespace UserDetail {
    export enum status {
        ACTIVE = 'active',
        SUSPENDED = 'suspended',
    }
}


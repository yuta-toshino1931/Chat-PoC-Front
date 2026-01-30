/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserSummary } from './UserSummary';
export type Invitation = {
    id?: string;
    groupId?: string;
    groupName?: string;
    invitedBy?: UserSummary;
    invitedUser?: UserSummary;
    message?: string | null;
    status?: Invitation.status;
    createdAt?: string;
    expiresAt?: string;
};
export namespace Invitation {
    export enum status {
        PENDING = 'pending',
        ACCEPTED = 'accepted',
        REJECTED = 'rejected',
        EXPIRED = 'expired',
    }
}


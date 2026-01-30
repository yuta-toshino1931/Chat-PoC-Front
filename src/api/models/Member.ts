/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Member = {
    userId?: string;
    userName?: string;
    avatarUrl?: string | null;
    role?: Member.role;
    joinedAt?: string;
};
export namespace Member {
    export enum role {
        ADMIN = 'admin',
        MEMBER = 'member',
    }
}


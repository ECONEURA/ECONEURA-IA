import { z } from 'zod';
export declare const CreateUserRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<["admin", "manager", "editor", "viewer"]>;
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "manager" | "viewer" | "editor";
    password?: string;
}, {
    organizationId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "manager" | "viewer" | "editor";
    password?: string;
}>;
export declare const UpdateUserRequestSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "manager", "editor", "viewer"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "pending"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "active" | "inactive" | "suspended";
    firstName?: string;
    lastName?: string;
    role?: "admin" | "manager" | "viewer" | "editor";
}, {
    status?: "pending" | "active" | "inactive" | "suspended";
    firstName?: string;
    lastName?: string;
    role?: "admin" | "manager" | "viewer" | "editor";
}>;
export declare const DeleteUserRequestSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId?: string;
}, {
    userId?: string;
}>;
export declare const GetUserRequestSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId?: string;
}, {
    userId?: string;
}>;
export declare const SearchUsersRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    query: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "manager", "editor", "viewer"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "pending"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "email", "createdAt", "lastLoginAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    status?: "pending" | "active" | "inactive" | "suspended";
    organizationId?: string;
    page?: number;
    limit?: number;
    role?: "admin" | "manager" | "viewer" | "editor";
    sortBy?: "name" | "email" | "createdAt" | "lastLoginAt";
    sortOrder?: "asc" | "desc";
}, {
    query?: string;
    status?: "pending" | "active" | "inactive" | "suspended";
    organizationId?: string;
    page?: number;
    limit?: number;
    role?: "admin" | "manager" | "viewer" | "editor";
    sortBy?: "name" | "email" | "createdAt" | "lastLoginAt";
    sortOrder?: "asc" | "desc";
}>;
export declare const BulkUpdateUsersRequestSchema: z.ZodObject<{
    userIds: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<["admin", "manager", "editor", "viewer"]>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "pending"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "active" | "inactive" | "suspended";
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
    }, {
        status?: "pending" | "active" | "inactive" | "suspended";
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        status?: "pending" | "active" | "inactive" | "suspended";
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
    };
    userIds?: string[];
}, {
    updates?: {
        status?: "pending" | "active" | "inactive" | "suspended";
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
    };
    userIds?: string[];
}>;
export declare const BulkDeleteUsersRequestSchema: z.ZodObject<{
    userIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    userIds?: string[];
}, {
    userIds?: string[];
}>;
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodEnum<["admin", "manager", "editor", "viewer"]>;
    status: z.ZodEnum<["active", "inactive", "suspended", "pending"]>;
    isEmailVerified: z.ZodBoolean;
    mfaEnabled: z.ZodBoolean;
    lastLoginAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "active" | "inactive" | "suspended";
    organizationId?: string;
    id?: string;
    email?: string;
    createdAt?: Date;
    updatedAt?: Date;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "manager" | "viewer" | "editor";
    lastLoginAt?: Date;
    isEmailVerified?: boolean;
    mfaEnabled?: boolean;
    fullName?: string;
}, {
    status?: "pending" | "active" | "inactive" | "suspended";
    organizationId?: string;
    id?: string;
    email?: string;
    createdAt?: Date;
    updatedAt?: Date;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "manager" | "viewer" | "editor";
    lastLoginAt?: Date;
    isEmailVerified?: boolean;
    mfaEnabled?: boolean;
    fullName?: string;
}>;
export declare const UserListResponseSchema: z.ZodObject<{
    users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        fullName: z.ZodString;
        role: z.ZodEnum<["admin", "manager", "editor", "viewer"]>;
        status: z.ZodEnum<["active", "inactive", "suspended", "pending"]>;
        isEmailVerified: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastLoginAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "active" | "inactive" | "suspended";
        organizationId?: string;
        id?: string;
        email?: string;
        createdAt?: Date;
        updatedAt?: Date;
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
        lastLoginAt?: Date;
        isEmailVerified?: boolean;
        mfaEnabled?: boolean;
        fullName?: string;
    }, {
        status?: "pending" | "active" | "inactive" | "suspended";
        organizationId?: string;
        id?: string;
        email?: string;
        createdAt?: Date;
        updatedAt?: Date;
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
        lastLoginAt?: Date;
        isEmailVerified?: boolean;
        mfaEnabled?: boolean;
        fullName?: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrevious: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    users?: {
        status?: "pending" | "active" | "inactive" | "suspended";
        organizationId?: string;
        id?: string;
        email?: string;
        createdAt?: Date;
        updatedAt?: Date;
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
        lastLoginAt?: Date;
        isEmailVerified?: boolean;
        mfaEnabled?: boolean;
        fullName?: string;
    }[];
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}, {
    page?: number;
    limit?: number;
    users?: {
        status?: "pending" | "active" | "inactive" | "suspended";
        organizationId?: string;
        id?: string;
        email?: string;
        createdAt?: Date;
        updatedAt?: Date;
        firstName?: string;
        lastName?: string;
        role?: "admin" | "manager" | "viewer" | "editor";
        lastLoginAt?: Date;
        isEmailVerified?: boolean;
        mfaEnabled?: boolean;
        fullName?: string;
    }[];
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}>;
export declare const UserStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    byRole: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    lastLogin: z.ZodObject<{
        today: z.ZodNumber;
        thisWeek: z.ZodNumber;
        thisMonth: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        today?: number;
        thisWeek?: number;
        thisMonth?: number;
    }, {
        today?: number;
        thisWeek?: number;
        thisMonth?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    byRole?: Record<string, number>;
    byStatus?: Record<string, number>;
    lastLogin?: {
        today?: number;
        thisWeek?: number;
        thisMonth?: number;
    };
}, {
    active?: number;
    inactive?: number;
    total?: number;
    byRole?: Record<string, number>;
    byStatus?: Record<string, number>;
    lastLogin?: {
        today?: number;
        thisWeek?: number;
        thisMonth?: number;
    };
}>;
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    requestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    message?: string;
    success?: boolean;
    requestId?: string;
    timestamp?: Date;
    data?: any;
}, {
    error?: string;
    message?: string;
    success?: boolean;
    requestId?: string;
    timestamp?: Date;
    data?: any;
}>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type DeleteUserRequest = z.infer<typeof DeleteUserRequestSchema>;
export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;
export type SearchUsersRequest = z.infer<typeof SearchUsersRequestSchema>;
export type BulkUpdateUsersRequest = z.infer<typeof BulkUpdateUsersRequestSchema>;
export type BulkDeleteUsersRequest = z.infer<typeof BulkDeleteUsersRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UserStatsResponse = z.infer<typeof UserStatsResponseSchema>;
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
    data?: T;
};
export declare const validateCreateUserRequest: (data: unknown) => CreateUserRequest;
export declare const validateUpdateUserRequest: (data: unknown) => UpdateUserRequest;
export declare const validateDeleteUserRequest: (data: unknown) => DeleteUserRequest;
export declare const validateGetUserRequest: (data: unknown) => GetUserRequest;
export declare const validateSearchUsersRequest: (data: unknown) => SearchUsersRequest;
export declare const validateBulkUpdateUsersRequest: (data: unknown) => BulkUpdateUsersRequest;
export declare const validateBulkDeleteUsersRequest: (data: unknown) => BulkDeleteUsersRequest;
export declare const transformUserToResponse: (user: any) => UserResponse;
export declare const transformUserListToResponse: (userList: any) => UserListResponse;
export declare const transformUserStatsToResponse: (stats: any) => UserStatsResponse;
//# sourceMappingURL=user.dto.d.ts.map
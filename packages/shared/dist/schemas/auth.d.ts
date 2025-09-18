import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    displayName: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "suspended", "pending"]>>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    emailVerifiedAt: z.ZodOptional<z.ZodString>;
    lastLoginAt: z.ZodOptional<z.ZodString>;
    passwordChangedAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deletedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "suspended" | "pending";
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
    emailVerified?: boolean;
    emailVerifiedAt?: string;
    lastLoginAt?: string;
    passwordChangedAt?: string;
    deletedAt?: string;
}, {
    status?: "active" | "inactive" | "suspended" | "pending";
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
    emailVerified?: boolean;
    emailVerifiedAt?: string;
    lastLoginAt?: string;
    passwordChangedAt?: string;
    deletedAt?: string;
}>;
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<z.ZodEnum<["es-ES", "en-US"]>>;
    currency: z.ZodDefault<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    billingEmail: z.ZodOptional<z.ZodString>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    }, {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    }>>;
    plan: z.ZodDefault<z.ZodEnum<["trial", "starter", "professional", "enterprise"]>>;
    planExpiresAt: z.ZodOptional<z.ZodString>;
    maxUsers: z.ZodDefault<z.ZodNumber>;
    maxStorage: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "suspended"]>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deletedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "suspended";
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    email?: string;
    phone?: string;
    deletedAt?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    timezone?: string;
    locale?: "es-ES" | "en-US";
    currency?: string;
    taxId?: string;
    billingEmail?: string;
    billingAddress?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
    plan?: "trial" | "starter" | "professional" | "enterprise";
    planExpiresAt?: string;
    maxUsers?: number;
    maxStorage?: number;
}, {
    status?: "active" | "inactive" | "suspended";
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    email?: string;
    phone?: string;
    deletedAt?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    timezone?: string;
    locale?: "es-ES" | "en-US";
    currency?: string;
    taxId?: string;
    billingEmail?: string;
    billingAddress?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
    plan?: "trial" | "starter" | "professional" | "enterprise";
    planExpiresAt?: string;
    maxUsers?: number;
    maxStorage?: number;
}>;
export declare const UserOrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    organizationId: z.ZodString;
    roleId: z.ZodString;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
    joinedAt: z.ZodString;
    leftAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "invited"]>>;
    invitedByUserId: z.ZodOptional<z.ZodString>;
    invitedAt: z.ZodOptional<z.ZodString>;
    inviteToken: z.ZodOptional<z.ZodString>;
    inviteExpiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "invited";
    id?: string;
    userId?: string;
    organizationId?: string;
    roleId?: string;
    isPrimary?: boolean;
    joinedAt?: string;
    leftAt?: string;
    invitedByUserId?: string;
    invitedAt?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
}, {
    status?: "active" | "inactive" | "invited";
    id?: string;
    userId?: string;
    organizationId?: string;
    roleId?: string;
    isPrimary?: boolean;
    joinedAt?: string;
    leftAt?: string;
    invitedByUserId?: string;
    invitedAt?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
}>;
export declare const RoleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isSystem: z.ZodDefault<z.ZodBoolean>;
    organizationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    slug?: string;
    description?: string;
    organizationId?: string;
    isSystem?: boolean;
}, {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    slug?: string;
    description?: string;
    organizationId?: string;
    isSystem?: boolean;
}>;
export declare const PermissionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    resource: z.ZodString;
    action: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    name?: string;
    slug?: string;
    description?: string;
    resource?: string;
    action?: string;
}, {
    id?: string;
    createdAt?: string;
    name?: string;
    slug?: string;
    description?: string;
    resource?: string;
    action?: string;
}>;
export declare const RolePermissionSchema: z.ZodObject<{
    id: z.ZodString;
    roleId: z.ZodString;
    permissionId: z.ZodString;
    scope: z.ZodDefault<z.ZodEnum<["organization", "own"]>>;
    conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    roleId?: string;
    permissionId?: string;
    scope?: "organization" | "own";
    conditions?: Record<string, unknown>;
}, {
    id?: string;
    createdAt?: string;
    roleId?: string;
    permissionId?: string;
    scope?: "organization" | "own";
    conditions?: Record<string, unknown>;
}>;
export declare const DeviceSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    organizationId: z.ZodString;
    deviceId: z.ZodString;
    deviceName: z.ZodOptional<z.ZodString>;
    deviceType: z.ZodDefault<z.ZodEnum<["web", "mobile", "tablet", "desktop", "api"]>>;
    userAgent: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodString;
    location: z.ZodOptional<z.ZodObject<{
        country: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }, {
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }>>;
    accessToken: z.ZodString;
    accessTokenExpiresAt: z.ZodString;
    refreshToken: z.ZodString;
    refreshTokenExpiresAt: z.ZodString;
    refreshTokenVersion: z.ZodDefault<z.ZodNumber>;
    lastActivityAt: z.ZodString;
    createdAt: z.ZodString;
    revokedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    revokedReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    userId?: string;
    createdAt?: string;
    organizationId?: string;
    deviceId?: string;
    deviceName?: string;
    deviceType?: "web" | "mobile" | "tablet" | "desktop" | "api";
    userAgent?: string;
    ipAddress?: string;
    location?: {
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    accessToken?: string;
    accessTokenExpiresAt?: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
    refreshTokenVersion?: number;
    lastActivityAt?: string;
    revokedAt?: string;
    revokedReason?: string;
}, {
    id?: string;
    userId?: string;
    createdAt?: string;
    organizationId?: string;
    deviceId?: string;
    deviceName?: string;
    deviceType?: "web" | "mobile" | "tablet" | "desktop" | "api";
    userAgent?: string;
    ipAddress?: string;
    location?: {
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    accessToken?: string;
    accessTokenExpiresAt?: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
    refreshTokenVersion?: number;
    lastActivityAt?: string;
    revokedAt?: string;
    revokedReason?: string;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    organizationSlug: z.ZodOptional<z.ZodString>;
    deviceId: z.ZodOptional<z.ZodString>;
    deviceName: z.ZodOptional<z.ZodString>;
    rememberMe: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    deviceId?: string;
    deviceName?: string;
    password?: string;
    organizationSlug?: string;
    rememberMe?: boolean;
}, {
    email?: string;
    deviceId?: string;
    deviceName?: string;
    password?: string;
    organizationSlug?: string;
    rememberMe?: boolean;
}>;
export declare const LoginResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        displayName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "suspended", "pending"]>>;
        emailVerified: z.ZodDefault<z.ZodBoolean>;
        emailVerifiedAt: z.ZodOptional<z.ZodString>;
        lastLoginAt: z.ZodOptional<z.ZodString>;
        passwordChangedAt: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deletedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    }, {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    }>;
    organization: z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        locale: z.ZodDefault<z.ZodEnum<["es-ES", "en-US"]>>;
        currency: z.ZodDefault<z.ZodString>;
        taxId: z.ZodOptional<z.ZodString>;
        billingEmail: z.ZodOptional<z.ZodString>;
        billingAddress: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        }, {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        }>>;
        plan: z.ZodDefault<z.ZodEnum<["trial", "starter", "professional", "enterprise"]>>;
        planExpiresAt: z.ZodOptional<z.ZodString>;
        maxUsers: z.ZodDefault<z.ZodNumber>;
        maxStorage: z.ZodDefault<z.ZodNumber>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "suspended"]>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deletedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    }, {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    }>;
    permissions: z.ZodArray<z.ZodString, "many">;
    tokens: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
        tokenType: z.ZodLiteral<"Bearer">;
    }, "strip", z.ZodTypeAny, {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    }, {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    }>;
    session: z.ZodObject<{
        id: z.ZodString;
        deviceId: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        createdAt?: string;
        deviceId?: string;
    }, {
        id?: string;
        createdAt?: string;
        deviceId?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    organization?: {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    };
    user?: {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    };
    permissions?: string[];
    tokens?: {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    };
    session?: {
        id?: string;
        createdAt?: string;
        deviceId?: string;
    };
}, {
    organization?: {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    };
    user?: {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    };
    permissions?: string[];
    tokens?: {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    };
    session?: {
        id?: string;
        createdAt?: string;
        deviceId?: string;
    };
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
    deviceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceId?: string;
    refreshToken?: string;
}, {
    deviceId?: string;
    refreshToken?: string;
}>;
export declare const RefreshTokenResponseSchema: z.ZodObject<{
    tokens: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
        tokenType: z.ZodLiteral<"Bearer">;
    }, "strip", z.ZodTypeAny, {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    }, {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    }>;
}, "strip", z.ZodTypeAny, {
    tokens?: {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    };
}, {
    tokens?: {
        accessToken?: string;
        refreshToken?: string;
        expiresIn?: number;
        tokenType?: "Bearer";
    };
}>;
export declare const LogoutRequestSchema: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
    allDevices: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string;
    allDevices?: boolean;
}, {
    refreshToken?: string;
    allDevices?: boolean;
}>;
export declare const MeResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        displayName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "suspended", "pending"]>>;
        emailVerified: z.ZodDefault<z.ZodBoolean>;
        emailVerifiedAt: z.ZodOptional<z.ZodString>;
        lastLoginAt: z.ZodOptional<z.ZodString>;
        passwordChangedAt: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deletedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    }, {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    }>;
    organization: z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        locale: z.ZodDefault<z.ZodEnum<["es-ES", "en-US"]>>;
        currency: z.ZodDefault<z.ZodString>;
        taxId: z.ZodOptional<z.ZodString>;
        billingEmail: z.ZodOptional<z.ZodString>;
        billingAddress: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        }, {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        }>>;
        plan: z.ZodDefault<z.ZodEnum<["trial", "starter", "professional", "enterprise"]>>;
        planExpiresAt: z.ZodOptional<z.ZodString>;
        maxUsers: z.ZodDefault<z.ZodNumber>;
        maxStorage: z.ZodDefault<z.ZodNumber>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "suspended"]>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deletedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    }, {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    }>;
    role: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        isSystem: z.ZodDefault<z.ZodBoolean>;
        organizationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        slug?: string;
        description?: string;
        organizationId?: string;
        isSystem?: boolean;
    }, {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        slug?: string;
        description?: string;
        organizationId?: string;
        isSystem?: boolean;
    }>;
    permissions: z.ZodArray<z.ZodString, "many">;
    sessions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        deviceType: z.ZodString;
        lastActivityAt: z.ZodString;
        isCurrent: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        deviceName?: string;
        deviceType?: string;
        lastActivityAt?: string;
        isCurrent?: boolean;
    }, {
        id?: string;
        deviceName?: string;
        deviceType?: string;
        lastActivityAt?: string;
        isCurrent?: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    organization?: {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    };
    user?: {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    };
    permissions?: string[];
    role?: {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        slug?: string;
        description?: string;
        organizationId?: string;
        isSystem?: boolean;
    };
    sessions?: {
        id?: string;
        deviceName?: string;
        deviceType?: string;
        lastActivityAt?: string;
        isCurrent?: boolean;
    }[];
}, {
    organization?: {
        status?: "active" | "inactive" | "suspended";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        email?: string;
        phone?: string;
        deletedAt?: string;
        slug?: string;
        description?: string;
        logoUrl?: string;
        website?: string;
        timezone?: string;
        locale?: "es-ES" | "en-US";
        currency?: string;
        taxId?: string;
        billingEmail?: string;
        billingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        plan?: "trial" | "starter" | "professional" | "enterprise";
        planExpiresAt?: string;
        maxUsers?: number;
        maxStorage?: number;
    };
    user?: {
        status?: "active" | "inactive" | "suspended" | "pending";
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        avatarUrl?: string;
        phone?: string;
        emailVerified?: boolean;
        emailVerifiedAt?: string;
        lastLoginAt?: string;
        passwordChangedAt?: string;
        deletedAt?: string;
    };
    permissions?: string[];
    role?: {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
        name?: string;
        slug?: string;
        description?: string;
        organizationId?: string;
        isSystem?: boolean;
    };
    sessions?: {
        id?: string;
        deviceName?: string;
        deviceType?: string;
        lastActivityAt?: string;
        isCurrent?: boolean;
    }[];
}>;
export declare const SessionsResponseSchema: z.ZodObject<{
    sessions: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        userId: z.ZodString;
        organizationId: z.ZodString;
        deviceId: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        deviceType: z.ZodDefault<z.ZodEnum<["web", "mobile", "tablet", "desktop", "api"]>>;
        userAgent: z.ZodOptional<z.ZodString>;
        ipAddress: z.ZodString;
        location: z.ZodOptional<z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            latitude: z.ZodOptional<z.ZodNumber>;
            longitude: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        }, {
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        }>>;
        accessToken: z.ZodString;
        accessTokenExpiresAt: z.ZodString;
        refreshToken: z.ZodString;
        refreshTokenExpiresAt: z.ZodString;
        refreshTokenVersion: z.ZodDefault<z.ZodNumber>;
        lastActivityAt: z.ZodString;
        createdAt: z.ZodString;
        revokedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        revokedReason: z.ZodOptional<z.ZodString>;
    }, "accessToken" | "refreshToken"> & {
        isCurrent: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        userId?: string;
        createdAt?: string;
        organizationId?: string;
        deviceId?: string;
        deviceName?: string;
        deviceType?: "web" | "mobile" | "tablet" | "desktop" | "api";
        userAgent?: string;
        ipAddress?: string;
        location?: {
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        };
        accessTokenExpiresAt?: string;
        refreshTokenExpiresAt?: string;
        refreshTokenVersion?: number;
        lastActivityAt?: string;
        revokedAt?: string;
        revokedReason?: string;
        isCurrent?: boolean;
    }, {
        id?: string;
        userId?: string;
        createdAt?: string;
        organizationId?: string;
        deviceId?: string;
        deviceName?: string;
        deviceType?: "web" | "mobile" | "tablet" | "desktop" | "api";
        userAgent?: string;
        ipAddress?: string;
        location?: {
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        };
        accessTokenExpiresAt?: string;
        refreshTokenExpiresAt?: string;
        refreshTokenVersion?: number;
        lastActivityAt?: string;
        revokedAt?: string;
        revokedReason?: string;
        isCurrent?: boolean;
    }>, "many">;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total?: number;
    sessions?: {
        id?: string;
        userId?: string;
        createdAt?: string;
        organizationId?: string;
        deviceId?: string;
        deviceName?: string;
        deviceType?: "web" | "mobile" | "tablet" | "desktop" | "api";
        userAgent?: string;
        ipAddress?: string;
        location?: {
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        };
        accessTokenExpiresAt?: string;
        refreshTokenExpiresAt?: string;
        refreshTokenVersion?: number;
        lastActivityAt?: string;
        revokedAt?: string;
        revokedReason?: string;
        isCurrent?: boolean;
    }[];
}, {
    total?: number;
    sessions?: {
        id?: string;
        userId?: string;
        createdAt?: string;
        organizationId?: string;
        deviceId?: string;
        deviceName?: string;
        deviceType?: "web" | "mobile" | "tablet" | "desktop" | "api";
        userAgent?: string;
        ipAddress?: string;
        location?: {
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        };
        accessTokenExpiresAt?: string;
        refreshTokenExpiresAt?: string;
        refreshTokenVersion?: number;
        lastActivityAt?: string;
        revokedAt?: string;
        revokedReason?: string;
        isCurrent?: boolean;
    }[];
}>;
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    orgId: z.ZodString;
    userId: z.ZodString;
    userEmail: z.ZodString;
    action: z.ZodString;
    resource: z.ZodString;
    resourceId: z.ZodOptional<z.ZodString>;
    changes: z.ZodOptional<z.ZodObject<{
        before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
    }, {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        ipAddress: z.ZodOptional<z.ZodString>;
        userAgent: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        correlationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userAgent?: string;
        ipAddress?: string;
        sessionId?: string;
        correlationId?: string;
    }, {
        userAgent?: string;
        ipAddress?: string;
        sessionId?: string;
        correlationId?: string;
    }>>;
    result: z.ZodEnum<["success", "failure"]>;
    errorMessage: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orgId?: string;
    id?: string;
    metadata?: {
        userAgent?: string;
        ipAddress?: string;
        sessionId?: string;
        correlationId?: string;
    };
    userId?: string;
    createdAt?: string;
    resource?: string;
    action?: string;
    userEmail?: string;
    resourceId?: string;
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
    };
    result?: "success" | "failure";
    errorMessage?: string;
}, {
    orgId?: string;
    id?: string;
    metadata?: {
        userAgent?: string;
        ipAddress?: string;
        sessionId?: string;
        correlationId?: string;
    };
    userId?: string;
    createdAt?: string;
    resource?: string;
    action?: string;
    userEmail?: string;
    resourceId?: string;
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
    };
    result?: "success" | "failure";
    errorMessage?: string;
}>;
export type User = z.infer<typeof UserSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type UserOrganization = z.infer<typeof UserOrganizationSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type RolePermission = z.infer<typeof RolePermissionSchema>;
export type DeviceSession = z.infer<typeof DeviceSessionSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
//# sourceMappingURL=auth.d.ts.map
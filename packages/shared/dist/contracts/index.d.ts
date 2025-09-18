import { z } from 'zod';
export declare const BaseResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
    timestamp: z.ZodString;
    processingTime: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    message?: string;
    timestamp?: string;
    data?: any;
    success?: boolean;
    requestId?: string;
    processingTime?: number;
}, {
    error?: string;
    message?: string;
    timestamp?: string;
    data?: any;
    success?: boolean;
    requestId?: string;
    processingTime?: number;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
    totalPages: z.ZodOptional<z.ZodNumber>;
    hasNext: z.ZodOptional<z.ZodBoolean>;
    hasPrev: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    total?: number;
    page?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}, {
    limit?: number;
    total?: number;
    page?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}>;
export declare const PaginatedResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
    timestamp: z.ZodString;
    processingTime: z.ZodOptional<z.ZodNumber>;
} & {
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
        hasNext: z.ZodOptional<z.ZodBoolean>;
        hasPrev: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        limit?: number;
        total?: number;
        page?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        limit?: number;
        total?: number;
        page?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    message?: string;
    timestamp?: string;
    data?: any[];
    pagination?: {
        limit?: number;
        total?: number;
        page?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
    success?: boolean;
    requestId?: string;
    processingTime?: number;
}, {
    error?: string;
    message?: string;
    timestamp?: string;
    data?: any[];
    pagination?: {
        limit?: number;
        total?: number;
        page?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
    success?: boolean;
    requestId?: string;
    processingTime?: number;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
    rememberMe: z.ZodDefault<z.ZodBoolean>;
    mfaToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    organizationId?: string;
    password?: string;
    rememberMe?: boolean;
    mfaToken?: string;
}, {
    email?: string;
    organizationId?: string;
    password?: string;
    rememberMe?: boolean;
    mfaToken?: string;
}>;
export declare const LoginResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        organizationId: z.ZodString;
        roles: z.ZodArray<z.ZodString, "many">;
        permissions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        name?: string;
        email?: string;
        organizationId?: string;
        permissions?: string[];
        roles?: string[];
    }, {
        id?: string;
        name?: string;
        email?: string;
        organizationId?: string;
        permissions?: string[];
        roles?: string[];
    }>;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
    tokenType: z.ZodLiteral<"Bearer">;
}, "strip", z.ZodTypeAny, {
    accessToken?: string;
    refreshToken?: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
        organizationId?: string;
        permissions?: string[];
        roles?: string[];
    };
    expiresIn?: number;
    tokenType?: "Bearer";
}, {
    accessToken?: string;
    refreshToken?: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
        organizationId?: string;
        permissions?: string[];
        roles?: string[];
    };
    expiresIn?: number;
    tokenType?: "Bearer";
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string;
}, {
    refreshToken?: string;
}>;
export declare const RefreshTokenResponseSchema: z.ZodObject<{
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
export declare const LogoutRequestSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
}, {
    sessionId?: string;
}>;
export declare const CreateApiKeyRequestSchema: z.ZodObject<{
    permissions: z.ZodArray<z.ZodString, "many">;
    expiresIn: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    permissions?: string[];
    expiresIn?: number;
}, {
    permissions?: string[];
    expiresIn?: number;
}>;
export declare const ApiKeyResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    key: z.ZodString;
    permissions: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodString;
    createdAt: z.ZodString;
    lastUsedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    expiresAt?: string;
    name?: string;
    permissions?: string[];
    key?: string;
    lastUsedAt?: string;
}, {
    id?: string;
    createdAt?: string;
    expiresAt?: string;
    name?: string;
    permissions?: string[];
    key?: string;
    lastUsedAt?: string;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    organizationId: z.ZodString;
    roles: z.ZodArray<z.ZodString, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodBoolean;
    lastLoginAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    isActive?: boolean;
    updatedAt?: string;
    name?: string;
    email?: string;
    lastLoginAt?: string;
    organizationId?: string;
    permissions?: string[];
    roles?: string[];
}, {
    id?: string;
    createdAt?: string;
    isActive?: boolean;
    updatedAt?: string;
    name?: string;
    email?: string;
    lastLoginAt?: string;
    organizationId?: string;
    permissions?: string[];
    roles?: string[];
}>;
export declare const CreateUserRequestSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    password: z.ZodString;
    organizationId: z.ZodString;
    roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    organizationId?: string;
    password?: string;
    roles?: string[];
}, {
    name?: string;
    email?: string;
    organizationId?: string;
    password?: string;
    roles?: string[];
}>;
export declare const UpdateUserRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean;
    name?: string;
    email?: string;
    roles?: string[];
}, {
    isActive?: boolean;
    name?: string;
    email?: string;
    roles?: string[];
}>;
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    settings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    isActive?: boolean;
    updatedAt?: string;
    name?: string;
    domain?: string;
    settings?: Record<string, any>;
}, {
    id?: string;
    createdAt?: string;
    isActive?: boolean;
    updatedAt?: string;
    name?: string;
    domain?: string;
    settings?: Record<string, any>;
}>;
export declare const CreateOrganizationRequestSchema: z.ZodObject<{
    name: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    settings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    domain?: string;
    settings?: Record<string, any>;
}, {
    name?: string;
    domain?: string;
    settings?: Record<string, any>;
}>;
export declare const UpdateOrganizationRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean;
    name?: string;
    domain?: string;
    settings?: Record<string, any>;
}, {
    isActive?: boolean;
    name?: string;
    domain?: string;
    settings?: Record<string, any>;
}>;
export declare const ContactSchema: z.ZodObject<{
    id: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    organizationId?: string;
    tags?: string[];
    company?: string;
    customFields?: Record<string, any>;
}, {
    title?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    organizationId?: string;
    tags?: string[];
    company?: string;
    customFields?: Record<string, any>;
}>;
export declare const CreateContactRequestSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    title?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    company?: string;
    customFields?: Record<string, any>;
}, {
    title?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    company?: string;
    customFields?: Record<string, any>;
}>;
export declare const UpdateContactRequestSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    title?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    company?: string;
    customFields?: Record<string, any>;
}, {
    title?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    company?: string;
    customFields?: Record<string, any>;
}>;
export declare const DealSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    value: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    stage: z.ZodString;
    probability: z.ZodDefault<z.ZodNumber>;
    contactId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodString;
    expectedCloseDate: z.ZodOptional<z.ZodString>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value?: number;
    title?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    currency?: string;
    organizationId?: string;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    contactId?: string;
    customFields?: Record<string, any>;
}, {
    value?: number;
    title?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    currency?: string;
    organizationId?: string;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    contactId?: string;
    customFields?: Record<string, any>;
}>;
export declare const CreateDealRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    value: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    stage: z.ZodString;
    probability: z.ZodDefault<z.ZodNumber>;
    contactId: z.ZodOptional<z.ZodString>;
    expectedCloseDate: z.ZodOptional<z.ZodString>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    title?: string;
    description?: string;
    currency?: string;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    contactId?: string;
    customFields?: Record<string, any>;
}, {
    value?: number;
    title?: string;
    description?: string;
    currency?: string;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    contactId?: string;
    customFields?: Record<string, any>;
}>;
export declare const UpdateDealRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    stage: z.ZodOptional<z.ZodString>;
    probability: z.ZodOptional<z.ZodNumber>;
    contactId: z.ZodOptional<z.ZodString>;
    expectedCloseDate: z.ZodOptional<z.ZodString>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    title?: string;
    description?: string;
    currency?: string;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    contactId?: string;
    customFields?: Record<string, any>;
}, {
    value?: number;
    title?: string;
    description?: string;
    currency?: string;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    contactId?: string;
    customFields?: Record<string, any>;
}>;
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    category?: string;
    createdAt?: string;
    isActive?: boolean;
    updatedAt?: string;
    name?: string;
    description?: string;
    currency?: string;
    organizationId?: string;
    sku?: string;
    customFields?: Record<string, any>;
    price?: number;
}, {
    id?: string;
    category?: string;
    createdAt?: string;
    isActive?: boolean;
    updatedAt?: string;
    name?: string;
    description?: string;
    currency?: string;
    organizationId?: string;
    sku?: string;
    customFields?: Record<string, any>;
    price?: number;
}>;
export declare const CreateProductRequestSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    category?: string;
    name?: string;
    description?: string;
    currency?: string;
    sku?: string;
    customFields?: Record<string, any>;
    price?: number;
}, {
    category?: string;
    name?: string;
    description?: string;
    currency?: string;
    sku?: string;
    customFields?: Record<string, any>;
    price?: number;
}>;
export declare const UpdateProductRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    category?: string;
    isActive?: boolean;
    name?: string;
    description?: string;
    currency?: string;
    sku?: string;
    customFields?: Record<string, any>;
    price?: number;
}, {
    category?: string;
    isActive?: boolean;
    name?: string;
    description?: string;
    currency?: string;
    sku?: string;
    customFields?: Record<string, any>;
    price?: number;
}>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    orderNumber: z.ZodString;
    customerId: z.ZodString;
    organizationId: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "shipped", "delivered", "cancelled"]>;
    total: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total?: number;
        productId?: string;
        quantity?: number;
        price?: number;
    }, {
        total?: number;
        productId?: string;
        quantity?: number;
        price?: number;
    }>, "many">;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    }, {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    }>>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "cancelled" | "processing" | "shipped" | "delivered";
    total?: number;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    currency?: string;
    organizationId?: string;
    orderNumber?: string;
    items?: {
        total?: number;
        productId?: string;
        quantity?: number;
        price?: number;
    }[];
    customFields?: Record<string, any>;
    customerId?: string;
    shippingAddress?: {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    };
}, {
    status?: "pending" | "cancelled" | "processing" | "shipped" | "delivered";
    total?: number;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    currency?: string;
    organizationId?: string;
    orderNumber?: string;
    items?: {
        total?: number;
        productId?: string;
        quantity?: number;
        price?: number;
    }[];
    customFields?: Record<string, any>;
    customerId?: string;
    shippingAddress?: {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    };
}>;
export declare const CreateOrderRequestSchema: z.ZodObject<{
    customerId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId?: string;
        quantity?: number;
        price?: number;
    }, {
        productId?: string;
        quantity?: number;
        price?: number;
    }>, "many">;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    }, {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    }>>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    items?: {
        productId?: string;
        quantity?: number;
        price?: number;
    }[];
    customFields?: Record<string, any>;
    customerId?: string;
    shippingAddress?: {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    };
}, {
    items?: {
        productId?: string;
        quantity?: number;
        price?: number;
    }[];
    customFields?: Record<string, any>;
    customerId?: string;
    shippingAddress?: {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    };
}>;
export declare const UpdateOrderRequestSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "shipped", "delivered", "cancelled"]>>;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    }, {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    }>>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "cancelled" | "processing" | "shipped" | "delivered";
    customFields?: Record<string, any>;
    shippingAddress?: {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    };
}, {
    status?: "pending" | "cancelled" | "processing" | "shipped" | "delivered";
    customFields?: Record<string, any>;
    shippingAddress?: {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
        zipCode?: string;
    };
}>;
export declare const AIRequestSchema: z.ZodObject<{
    prompt: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    temperature: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    organizationId: z.ZodString;
    userId: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    model?: string;
    context?: Record<string, any>;
    userId?: string;
    organizationId?: string;
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
}, {
    model?: string;
    context?: Record<string, any>;
    userId?: string;
    organizationId?: string;
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
}>;
export declare const AIResponseSchema: z.ZodObject<{
    id: z.ZodString;
    prompt: z.ZodString;
    response: z.ZodString;
    model: z.ZodString;
    usage: z.ZodObject<{
        promptTokens: z.ZodNumber;
        completionTokens: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    }, {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    }>;
    cost: z.ZodNumber;
    processingTime: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    model?: string;
    id?: string;
    createdAt?: string;
    cost?: number;
    prompt?: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    processingTime?: number;
    response?: string;
}, {
    model?: string;
    id?: string;
    createdAt?: string;
    cost?: number;
    prompt?: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    processingTime?: number;
    response?: string;
}>;
export declare const WebhookSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    url: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    organizationId: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    secret: z.ZodOptional<z.ZodString>;
    headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    url?: string;
    createdAt?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
    headers?: Record<string, string>;
    updatedAt?: string;
    name?: string;
    organizationId?: string;
}, {
    id?: string;
    url?: string;
    createdAt?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
    headers?: Record<string, string>;
    updatedAt?: string;
    name?: string;
    organizationId?: string;
}>;
export declare const CreateWebhookRequestSchema: z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    url?: string;
    events?: string[];
    headers?: Record<string, string>;
    name?: string;
}, {
    url?: string;
    events?: string[];
    headers?: Record<string, string>;
    name?: string;
}>;
export declare const UpdateWebhookRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    url?: string;
    events?: string[];
    isActive?: boolean;
    headers?: Record<string, string>;
    name?: string;
}, {
    url?: string;
    events?: string[];
    isActive?: boolean;
    headers?: Record<string, string>;
    name?: string;
}>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse<T = any> = Omit<BaseResponse, 'data'> & {
    data: T[];
    pagination: Pagination;
};
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type CreateContactRequest = z.infer<typeof CreateContactRequestSchema>;
export type UpdateContactRequest = z.infer<typeof UpdateContactRequestSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type CreateDealRequest = z.infer<typeof CreateDealRequestSchema>;
export type UpdateDealRequest = z.infer<typeof UpdateDealRequestSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type Webhook = z.infer<typeof WebhookSchema>;
export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
export declare const validateResponse: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
//# sourceMappingURL=index.d.ts.map
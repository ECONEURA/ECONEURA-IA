import { z } from 'zod';

// ============================================================================
// USER DTOs
// ============================================================================

// ========================================================================
// REQUEST DTOs
// ========================================================================

export const CreateUserRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  role: z.enum(['admin', 'manager', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: admin, manager, editor, viewer' })
  }),
  organizationId: z.string().uuid('Invalid organization ID format')
});

export const UpdateUserRequestSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters').optional(),
  role: z.enum(['admin', 'manager', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: admin, manager, editor, viewer' })
  }).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending'], {
    errorMap: () => ({ message: 'Status must be one of: active, inactive, suspended, pending' })
  }).optional()
});

export const DeleteUserRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
});

export const GetUserRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
});

export const SearchUsersRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID format'),
  query: z.string().optional(),
  role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const BulkUpdateUsersRequestSchema = z.object({
  userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(100, 'Cannot update more than 100 users at once'),
  updates: UpdateUserRequestSchema
});

export const BulkDeleteUsersRequestSchema = z.object({
  userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(100, 'Cannot delete more than 100 users at once')
});

// ========================================================================
// RESPONSE DTOs
// ========================================================================

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  role: z.enum(['admin', 'manager', 'editor', 'viewer']),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']),
  isEmailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserListResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrevious: z.boolean()
});

export const UserStatsResponseSchema = z.object({
  total: z.number().int().min(0),
  byRole: z.record(z.string(), z.number().int().min(0)),
  byStatus: z.record(z.string(), z.number().int().min(0)),
  active: z.number().int().min(0),
  inactive: z.number().int().min(0),
  lastLogin: z.object({
    today: z.number().int().min(0),
    thisWeek: z.number().int().min(0),
    thisMonth: z.number().int().min(0)
  })
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.date(),
  requestId: z.string().optional()
});

// ========================================================================
// TYPE EXPORTS
// ========================================================================

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
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T };

// ========================================================================
// VALIDATION FUNCTIONS
// ========================================================================

export const validateCreateUserRequest = (data: unknown): CreateUserRequest => {
  return CreateUserRequestSchema.parse(data);
};

export const validateUpdateUserRequest = (data: unknown): UpdateUserRequest => {
  return UpdateUserRequestSchema.parse(data);
};

export const validateDeleteUserRequest = (data: unknown): DeleteUserRequest => {
  return DeleteUserRequestSchema.parse(data);
};

export const validateGetUserRequest = (data: unknown): GetUserRequest => {
  return GetUserRequestSchema.parse(data);
};

export const validateSearchUsersRequest = (data: unknown): SearchUsersRequest => {
  return SearchUsersRequestSchema.parse(data);
};

export const validateBulkUpdateUsersRequest = (data: unknown): BulkUpdateUsersRequest => {
  return BulkUpdateUsersRequestSchema.parse(data);
};

export const validateBulkDeleteUsersRequest = (data: unknown): BulkDeleteUsersRequest => {
  return BulkDeleteUsersRequestSchema.parse(data);
};

// ========================================================================
// TRANSFORMATION FUNCTIONS
// ========================================================================

export const transformUserToResponse = (user: any): UserResponse => {
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    mfaEnabled: user.mfaEnabled,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const transformUserListToResponse = (userList: any): UserListResponse => {
  return {
    users: userList.users.map(transformUserToResponse),
    total: userList.total,
    page: userList.page,
    limit: userList.limit,
    totalPages: userList.totalPages,
    hasNext: userList.hasNext,
    hasPrevious: userList.hasPrevious
  };
};

export const transformUserStatsToResponse = (stats: any): UserStatsResponse => {
  return {
    total: stats.total,
    byRole: stats.byRole,
    byStatus: stats.byStatus,
    active: stats.active,
    inactive: stats.inactive,
    lastLogin: stats.lastLogin
  };
};

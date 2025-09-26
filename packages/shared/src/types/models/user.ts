import { TenantEntity } from './base.js';
/
// User type definitions
export interface User extends TenantEntity {;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  lastLogin?: Date;
  status: UserStatus;
  preferences?: UserPreferences;
  profile?: UserProfile;
}

export type UserRole = ;
  | 'owner'
  | 'admin'
  | 'manager'
  | 'user'
  | 'readonly';

export type UserStatus = ;
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending';

export interface Permission {;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface UserPreferences {;
  language: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    slack?: boolean;
  };
}

export interface UserProfile {;
  avatar?: string;
  title?: string;
  department?: string;
  phone?: string;
  location?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}
/
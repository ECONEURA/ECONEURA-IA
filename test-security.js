import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Simple Security System Test
class SimpleSecuritySystem {
  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.auditLogs = [];
    this.securityEvents = [];
    this.threatIntelligence = new Map();
  }

  async createUser(email, username, password, roles = []) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      username,
      passwordHash,
      salt,
      roles,
      permissions: [],
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    console.log(`✅ User created: ${email}`);
    return user;
  }

  async authenticateUser(email, password) {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return null;
    }

    const passwordHash = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex');
    if (passwordHash !== user.passwordHash) {
      console.log(`❌ Invalid password for: ${email}`);
      return null;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`✅ User authenticated: ${email}`);
    return { user, token };
  }

  async setupMFA(userId, method) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const secret = crypto.randomBytes(20).toString('hex');
    const qrCode = method === 'totp' ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`otpauth://totp/ECONEURA-IA:${user.email}?secret=${secret}&issuer=ECONEURA-IA`)}` : undefined;

    user.mfaEnabled = true;
    user.mfaSecret = secret;
    user.updatedAt = new Date();

    this.users.set(userId, user);
    console.log(`✅ MFA setup completed for user: ${user.email}`);
    return { secret, qrCode };
  }

  async createRole(name, description, permissions, orgId) {
    const role = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      permissions,
      orgId,
      createdAt: new Date(),
    };

    this.roles.set(role.id, role);
    console.log(`✅ Role created: ${name}`);
    return role;
  }

  async createPermission(name, description, resource, action, orgId) {
    const permission = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      resource,
      action,
      orgId,
      createdAt: new Date(),
    };

    this.permissions.set(permission.id, permission);
    console.log(`✅ Permission created: ${name}`);
    return permission;
  }

  async getSecurityStats() {
    const totalUsers = this.users.size;
    const totalRoles = this.roles.size;
    const totalPermissions = this.permissions.size;
    const totalAuditLogs = this.auditLogs.length;
    const totalSecurityEvents = this.securityEvents.length;
    const mfaEnabledUsers = Array.from(this.users.values()).filter(u => u.mfaEnabled).length;

    return {
      users: {
        total: totalUsers,
        mfaEnabled: mfaEnabledUsers,
        mfaPercentage: totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0,
      },
      rbac: {
        roles: totalRoles,
        permissions: totalPermissions,
      },
      audit: {
        total: totalAuditLogs,
      },
      security: {
        events: {
          total: totalSecurityEvents,
        },
      },
      threats: {
        tracked: this.threatIntelligence.size,
      },
      timestamp: new Date(),
    };
  }
}

// Test the security system
async function testSecuritySystem() {
  console.log('🔒 Testing Simple Security System');
  console.log('=====================================');

  const security = new SimpleSecuritySystem();

  try {
    // Test 1: Create user
    console.log('\n1. Testing User Creation');
    const user = await security.createUser('test@example.com', 'testuser', 'password123', ['user']);

    // Test 2: Authenticate user
    console.log('\n2. Testing User Authentication');
    const authResult = await security.authenticateUser('test@example.com', 'password123');
    if (!authResult) {
      throw new Error('Authentication failed');
    }

    // Test 3: Setup MFA
    console.log('\n3. Testing MFA Setup');
    const mfaResult = await security.setupMFA(user.id, 'totp');
    console.log(`MFA Secret: ${mfaResult.secret}`);
    console.log(`QR Code: ${mfaResult.qrCode}`);

    // Test 4: Create role
    console.log('\n4. Testing Role Creation');
    const role = await security.createRole('admin', 'Administrator role', ['read:users', 'write:users'], 'default');

    // Test 5: Create permission
    console.log('\n5. Testing Permission Creation');
    const permission = await security.createPermission('read:users', 'Read user data', 'users', 'read', 'default');

    // Test 6: Get security stats
    console.log('\n6. Testing Security Statistics');
    const stats = await security.getSecurityStats();
    console.log('Security Stats:', JSON.stringify(stats, null, 2));

    console.log('\n🎉 All security tests passed successfully!');
    console.log('\nSummary:');
    console.log(`- Users: ${stats.users.total}`);
    console.log(`- MFA Enabled: ${stats.users.mfaEnabled}`);
    console.log(`- Roles: ${stats.rbac.roles}`);
    console.log(`- Permissions: ${stats.rbac.permissions}`);
    console.log(`- Audit Logs: ${stats.audit.total}`);
    console.log(`- Security Events: ${stats.security.events.total}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSecuritySystem();

import dotenv from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

// Load env from root .env first, then apps/api/.env.local with override
dotenv.config({ path: resolve(import.meta.dirname, '../../../.env') });
dotenv.config({ path: resolve(import.meta.dirname, '../.env.local'), override: true });

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── Clean existing seed data (idempotent re-runs) ────────────
  console.log('  ↻ Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.file.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log('  ✓ Clean');

  // ── Create Multiple Organizations ────────────

  const organizations = [
    {
      name: 'Vestara',
      slug: 'vestara',
    },
    {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
    {
      name: 'Global Tech Solutions',
      slug: 'global-tech',
    },
    {
      name: 'StartupXYZ',
      slug: 'startup-xyz',
    },
  ];

  const createdOrgs: Array<{ id: string; name: string; slug: string }> = [];

  for (const orgData of organizations) {
    const org = await prisma.organization.upsert({
      where: { slug: orgData.slug },
      update: {},
      create: orgData,
    });
    createdOrgs.push(org);
    console.log(`  ✓ Organization created: ${org.name} (${org.slug})`);
  }

  // ── Create Admin Users ─────────────────────

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Create users across different organizations
  const userData = [
    // Vestara organization
    { email: 'superadmin@vestara.com', firstName: 'Super', lastName: 'Admin', role: UserRole.super_admin, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'admin@vestara.com', firstName: 'Admin', lastName: 'User', role: UserRole.admin, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'moderator@vestara.com', firstName: 'Moderator', lastName: 'User', role: UserRole.moderator, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'support@vestara.com', firstName: 'Support', lastName: 'Agent', role: UserRole.support, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'elena.chen@vestara.com', firstName: 'Elena', lastName: 'Chen', role: UserRole.admin, orgIndex: 0, avatarUrl: null, provider: 'google', providerId: 'google-101' },
    { email: 'marcus.johnson@vestara.com', firstName: 'Marcus', lastName: 'Johnson', role: UserRole.moderator, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'sarah.parker@vestara.com', firstName: 'Sarah', lastName: 'Parker', role: UserRole.support, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'david.kim@vestara.com', firstName: 'David', lastName: 'Kim', role: UserRole.support, orgIndex: 0, avatarUrl: null, provider: null },
    { email: 'lisa.thompson@vestara.com', firstName: 'Lisa', lastName: 'Thompson', role: UserRole.moderator, orgIndex: 0, avatarUrl: null, provider: null },
    // Acme Corporation
    { email: 'admin@acme.com', firstName: 'Admin', lastName: 'Acme', role: UserRole.admin, orgIndex: 1, avatarUrl: null, provider: null },
    { email: 'moderator@acme.com', firstName: 'Moderator', lastName: 'Acme', role: UserRole.moderator, orgIndex: 1, avatarUrl: null, provider: null },
    { email: 'support@acme.com', firstName: 'Support', lastName: 'Acme', role: UserRole.support, orgIndex: 1, avatarUrl: null, provider: null },
    { email: 'jane.doe@acme.com', firstName: 'Jane', lastName: 'Doe', role: UserRole.support, orgIndex: 1, avatarUrl: null, provider: null },
    { email: 'bob.smith@acme.com', firstName: 'Bob', lastName: 'Smith', role: UserRole.moderator, orgIndex: 1, avatarUrl: null, provider: null },
    // Global Tech Solutions
    { email: 'admin@globaltech.com', firstName: 'Admin', lastName: 'Global', role: UserRole.admin, orgIndex: 2, avatarUrl: null, provider: null },
    { email: 'support@globaltech.com', firstName: 'Support', lastName: 'Global', role: UserRole.support, orgIndex: 2, avatarUrl: null, provider: null },
    { email: 'alice.wong@globaltech.com', firstName: 'Alice', lastName: 'Wong', role: UserRole.admin, orgIndex: 2, avatarUrl: null, provider: null },
    { email: 'tom.jones@globaltech.com', firstName: 'Tom', lastName: 'Jones', role: UserRole.support, orgIndex: 2, avatarUrl: null, provider: null },
    // StartupXYZ
    { email: 'admin@startupxyz.com', firstName: 'Admin', lastName: 'Startup', role: UserRole.admin, orgIndex: 3, avatarUrl: null, provider: null },
    { email: 'emma.lee@startupxyz.com', firstName: 'Emma', lastName: 'Lee', role: UserRole.moderator, orgIndex: 3, avatarUrl: null, provider: null },
  ];

  const createdUsers: Array<{ id: string; email: string; organizationId: string }> = [];

  for (const user of userData) {
    const org = createdOrgs[user.orgIndex];
    const userRecord = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: org.id,
        isActive: true,
        ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
        ...(user.provider ? { provider: user.provider, providerId: user.providerId } : {}),
      },
    });
    createdUsers.push({ id: userRecord.id, email: userRecord.email, organizationId: org.id });
    console.log(`  ✓ User created: ${userRecord.email} (${user.role}) in ${org.name}`);
  }

  // ── Create System Settings per Organization ─────────────────

  const defaultSettings = [
    {
      key: 'app_name',
      value: { name: 'Vestara Admin' },
    },
    {
      key: 'appearance',
      value: { theme: 'dark', sidebarCollapsed: false },
    },
    {
      key: 'security',
      value: {
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        passwordMinLength: 8,
        requireSpecialChar: true,
        sessionTimeoutMinutes: 60,
      },
    },
    {
      key: 'notifications',
      value: {
        emailEnabled: true,
        pushEnabled: false,
        auditAlertThreshold: 100,
      },
    },
    {
      key: 'pagination',
      value: { defaultPageSize: 20, maxPageSize: 100 },
    },
  ];

  for (const org of createdOrgs) {
    const orgSuperAdmin = createdUsers.find(u => u.organizationId === org.id && u.email.includes('superadmin'));
    const orgAdmin = createdUsers.find(u => u.organizationId === org.id && u.email.includes('admin@'));
    const settingCreator = orgSuperAdmin?.id || orgAdmin?.id || createdUsers[0].id;

    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { organizationId_key: { organizationId: org.id, key: setting.key } },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          organizationId: org.id,
          updatedBy: settingCreator,
        },
      });
    }
    console.log(`  ✓ ${defaultSettings.length} system settings created for ${org.name}`);
  }

  // ── Create Audit Log Entries ─────────────────

  const logActions = ['create', 'update', 'login', 'logout', 'update', 'login', 'create', 'password_change'];
  const logEntities = ['user', 'user', 'user', 'user', 'setting', 'user', 'user', 'user'];

  for (const org of createdOrgs) {
    const orgUsers = createdUsers.filter(u => u.organizationId === org.id);
    const auditUser = orgUsers[0]?.id || createdUsers[0].id;

    // Create a sequence of audit log entries over the past few days
    const now = Date.now();
    for (let i = 0; i < logActions.length; i++) {
      const offset = (logActions.length - i) * 3600000; // one hour apart going backwards
      const auditUserId = orgUsers[i % orgUsers.length]?.id || auditUser;

      await prisma.auditLog.create({
        data: {
          action: logActions[i],
          entity: logEntities[i],
          entityId: auditUserId,
          userId: auditUserId,
          organizationId: org.id,
          metadata: { description: `${logActions[i]} action on ${logEntities[i]}` },
          ipAddress: '127.0.0.1',
          userAgent: 'seed-script',
          createdAt: new Date(now - offset),
        },
      });
    }

    // Add the seed event at the earliest time
    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'setting',
        entityId: auditUser,
        userId: auditUser,
        organizationId: org.id,
        metadata: { description: `Database seeded with initial data for ${org.name}` },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        createdAt: new Date(now - logActions.length * 3600000 - 3600000),
      },
    });

    console.log(`  ✓ ${logActions.length + 1} audit log entries created for ${org.name}`);
  }

  console.log('\n✅ Database seeding complete!');
  console.log('   Organizations created:');
  for (const org of createdOrgs) {
    console.log(`   - ${org.name} (${org.slug})`);
  }
  console.log('   Login credentials (password: Admin123!):');
  console.log('   - superadmin@vestara.com   (Super Admin – full access)');
  console.log('   - admin@vestara.com        (Admin – Vestara)');
  console.log('   - admin@acme.com           (Admin – Acme Corp)');
  console.log('   - admin@globaltech.com     (Admin – Global Tech)');
  console.log('   - admin@startupxyz.com     (Admin – StartupXYZ)');
  console.log('   - elena.chen@vestara.com   (Admin – OAuth Google account)');
  console.log('   All users use password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

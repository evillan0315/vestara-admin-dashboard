import dotenv from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
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

  // ── Create 2 Organizations ────────────

  const organizations = [
    { name: 'Vestara', slug: 'vestara' },
    { name: 'Acme Corporation', slug: 'acme-corp' },
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

  // ── Create 3 Users per Organization ─────────────────────

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Users: 1 admin, 1 moderator, 1 support per org
  const userData = [
    // Vestara organization (index 0)
    {
      email: 'admin@vestara.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      orgIndex: 0,
    },
    {
      email: 'moderator@vestara.com',
      firstName: 'Moderator',
      lastName: 'User',
      role: UserRole.moderator,
      orgIndex: 0,
    },
    {
      email: 'support@vestara.com',
      firstName: 'Support',
      lastName: 'Agent',
      role: UserRole.support,
      orgIndex: 0,
    },
    // Acme Corporation organization (index 1)
    {
      email: 'admin@acme.com',
      firstName: 'Admin',
      lastName: 'Acme',
      role: UserRole.admin,
      orgIndex: 1,
    },
    {
      email: 'moderator@acme.com',
      firstName: 'Moderator',
      lastName: 'Acme',
      role: UserRole.moderator,
      orgIndex: 1,
    },
    {
      email: 'support@acme.com',
      firstName: 'Support',
      lastName: 'Acme',
      role: UserRole.support,
      orgIndex: 1,
    },
  ];

  const createdUsers: Array<{ id: string; email: string; organizationId: string; role: UserRole }> =
    [];

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
      },
    });
    createdUsers.push({
      id: userRecord.id,
      email: userRecord.email,
      organizationId: org.id,
      role: userRecord.role,
    });

    // Create a demo user profile (1:1) so the profile module has data.
    await prisma.userProfile.upsert({
      where: { userId: userRecord.id },
      update: {},
      create: {
        userId: userRecord.id,
        organizationId: org.id,
        phone: '+1 (555) 010-1000',
        bio: `Demo ${user.role} account for the ${org.name} organization.`,
        contactEmail: user.email,
        addressLine1: '123 Market Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94103',
        country: 'United States',
        language: 'en',
        timezone: 'America/Los_Angeles',
        dateFormat: 'mdy',
        themeMode: 'system',
        kycStatus: user.role === UserRole.admin ? 'verified' : 'unverified',
      },
    });

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
    const orgAdmin = createdUsers.find(
      (u) => u.organizationId === org.id && u.role === UserRole.admin,
    );
    const settingCreator = orgAdmin?.id || createdUsers[0].id;

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

  const logActions = ['create', 'update', 'login', 'logout', 'update'];
  const logEntities = ['user', 'user', 'user', 'user', 'setting'];

  for (const org of createdOrgs) {
    const orgUsers = createdUsers.filter((u) => u.organizationId === org.id);
    const auditUser = orgUsers[0]?.id || createdUsers[0].id;

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
  console.log('   Users per organization: 3 (admin, moderator, support)');
  console.log('   Total users: 6');
  console.log('   Login credentials (password: Admin123!):');
  console.log('   - admin@vestara.com     (Admin – Vestara)');
  console.log('   - moderator@vestara.com (Moderator – Vestara)');
  console.log('   - support@vestara.com   (Support – Vestara)');
  console.log('   - admin@acme.com        (Admin – Acme Corp)');
  console.log('   - moderator@acme.com    (Moderator – Acme Corp)');
  console.log('   - support@acme.com      (Support – Acme Corp)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

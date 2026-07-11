import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

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
    { email: 'superadmin@vestara.com', firstName: 'Super', lastName: 'Admin', role: UserRole.super_admin, orgIndex: 0 },
    { email: 'admin@vestara.com', firstName: 'Admin', lastName: 'User', role: UserRole.admin, orgIndex: 0 },
    { email: 'moderator@vestara.com', firstName: 'Moderator', lastName: 'User', role: UserRole.moderator, orgIndex: 0 },
    { email: 'support@vestara.com', firstName: 'Support', lastName: 'Agent', role: UserRole.support, orgIndex: 0 },
    // Acme Corporation
    { email: 'admin@acme.com', firstName: 'Admin', lastName: 'Acme', role: UserRole.admin, orgIndex: 1 },
    { email: 'moderator@acme.com', firstName: 'Moderator', lastName: 'Acme', role: UserRole.moderator, orgIndex: 1 },
    { email: 'support@acme.com', firstName: 'Support', lastName: 'Acme', role: UserRole.support, orgIndex: 1 },
    // Global Tech Solutions
    { email: 'admin@globaltech.com', firstName: 'Admin', lastName: 'Global', role: UserRole.admin, orgIndex: 2 },
    { email: 'support@globaltech.com', firstName: 'Support', lastName: 'Global', role: UserRole.support, orgIndex: 2 },
    // StartupXYZ
    { email: 'admin@startupxyz.com', firstName: 'Admin', lastName: 'Startup', role: UserRole.admin, orgIndex: 3 },
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

  for (const org of createdOrgs) {
    const orgSuperAdmin = createdUsers.find(u => u.organizationId === org.id && u.email.includes('superadmin'));
    const auditUser = orgSuperAdmin?.id || createdUsers.find(u => u.organizationId === org.id)?.id || createdUsers[0].id;

    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'user',
        entityId: auditUser,
        userId: auditUser,
        organizationId: org.id,
        metadata: { description: `Database seeded with initial data for ${org.name}` },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
    });
    console.log(`  ✓ Initial audit log entry created for ${org.name}`);
  }

  console.log('\n✅ Database seeding complete!');
  console.log('   Organizations created:');
  for (const org of createdOrgs) {
    console.log(`   - ${org.name} (${org.slug})`);
  }
  console.log('   Login credentials (password: Admin123!):');
  console.log('   Email:      superadmin@vestara.com');
  console.log('   Email:      admin@acme.com');
  console.log('   Email:      admin@globaltech.com');
  console.log('   Email:      admin@startupxyz.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

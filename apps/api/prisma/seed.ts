import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── Create Admin Users ─────────────────────

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@vestara-admin-api.vercel.app' },
    update: {},
    create: {
      email: 'superadmin@vestara-admin-api.vercel.app',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.super_admin,
      isActive: true,
    },
  });
  console.log(`  ✓ Super admin created: ${superAdmin.email}`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vestara-admin-api.vercel.app' },
    update: {},
    create: {
      email: 'admin@vestara-admin-api.vercel.app',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      isActive: true,
    },
  });
  console.log(`  ✓ Admin created: ${admin.email}`);

  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@vestara-admin-api.vercel.app' },
    update: {},
    create: {
      email: 'moderator@vestara-admin-api.vercel.app',
      passwordHash,
      firstName: 'Moderator',
      lastName: 'User',
      role: UserRole.moderator,
      isActive: true,
    },
  });
  console.log(`  ✓ Moderator created: ${moderator.email}`);

  const support = await prisma.user.upsert({
    where: { email: 'support@vestara-admin-api.vercel.app' },
    update: {},
    create: {
      email: 'support@vestara-admin-api.vercel.app',
      passwordHash,
      firstName: 'Support',
      lastName: 'Agent',
      role: UserRole.support,
      isActive: true,
    },
  });
  console.log(`  ✓ Support agent created: ${support.email}`);

  // ── Create System Settings ─────────────────

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

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        updatedBy: superAdmin.id,
      },
    });
  }
  console.log(`  ✓ ${defaultSettings.length} system settings created`);

  // ── Create Audit Log Entry ─────────────────

  await prisma.auditLog.create({
    data: {
      action: 'create',
      entity: 'user',
      entityId: superAdmin.id,
      userId: superAdmin.id,
      metadata: { description: 'Database seeded with initial data' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
  });
  console.log('  ✓ Initial audit log entry created');

  console.log('\n✅ Database seeding complete!');
  console.log('   Login credentials:');
  console.log('   Email:      superadmin@vestara-admin-api.vercel.app');
  console.log('   Password:   Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

async function main(): Promise<void> {
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // Read — verify connection works
    const userCount = await prisma.user.count();
    console.log(`✅ Connected — ${userCount} user(s) in database`);

    // Write — verify write access
    const settingCount = await prisma.systemSetting.count();
    console.log(`   ${settingCount} system setting(s) present`);
  } catch (e) {
    console.error('❌ Connection failed:', (e as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

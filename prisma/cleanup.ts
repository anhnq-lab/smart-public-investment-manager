import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up conflicting tables...');
    try {
        // Drop known conflicting tables from Supabase starter templates
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."employees" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."users" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."channels" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."messages" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."role_permissions" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."user_roles" CASCADE;`);
        console.log('Cleanup successful');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

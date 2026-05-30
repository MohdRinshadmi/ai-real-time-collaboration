import { PrismaClient, Plan, Role, ChannelType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@collab.dev' },
    update: {},
    create: {
      email: 'demo@collab.dev',
      name: 'Demo User',
      emailVerified: new Date(),
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Workspace',
      plan: Plan.PRO,
      members: { create: { userId: user.id, role: Role.OWNER } },
    },
  });

  await prisma.channel.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'general' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'general',
      topic: 'Workspace-wide announcements',
      type: ChannelType.PUBLIC,
    },
  });

  console.warn('Seed complete:', { userId: user.id, workspaceId: workspace.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync("admin1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@beautyup.com" },
    update: {},
    create: {
      email: "admin@beautyup.com",
      passwordHash: hash,
      fullName: "Admin BeautyUp",
    },
  });
  console.log("✓ Seed user created:", user.email);
  console.log("  Password: admin1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

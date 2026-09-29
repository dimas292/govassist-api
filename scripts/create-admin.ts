import dotenv from "dotenv";
import { PrismaClient, UserRole } from "@prisma/client";

dotenv.config({ override: true });

type Args = {
  name?: string;
  organization?: string;
  id?: number;
  help?: boolean;
};

const HELP = `Membuat atau memperbarui akun admin (role ADMIN) di database.

Penggunaan:
  npm run db:create-admin -- --name "Admin GovAssist" [--organization "UNAS"] [--id 1]

Opsi:
  --name         Nama tampilan admin (wajib)
  --organization Nama organisasi; dibuat otomatis bila belum ada
  --id           ID user tertentu untuk di-upsert, mis. nilai ADMIN_ACTOR_ID
  --help         Tampilkan bantuan ini

Login admin tetap memakai ADMIN_USERNAME dan ADMIN_PASSWORD dari environment.
Pastikan ADMIN_ACTOR_ID diisi dengan ID user yang dicetak oleh script ini.
`;

const readArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--help" || flag === "-h") args.help = true;
    else if (flag === "--name" && value) { args.name = value; i += 1; }
    else if (flag === "--organization" && value) { args.organization = value; i += 1; }
    else if (flag === "--id" && value) { args.id = Number(value); i += 1; }
  }
  return args;
};

async function main() {
  const args = readArgs(process.argv);
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (!args.name || (args.id !== undefined && (!Number.isInteger(args.id) || args.id < 1))) {
    console.log(HELP);
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const admin = await prisma.$transaction(async (tx) => {
      let organizationId: number | null = null;
      if (args.organization) {
        const existing = await tx.organization.findFirst({ where: { name: args.organization } });
        organizationId = existing
          ? existing.id
          : (await tx.organization.create({ data: { name: args.organization } })).id;
      }

      const data = { name: args.name, role: UserRole.ADMIN, organizationId };
      if (args.id) {
        return tx.user.upsert({
          where: { id: args.id },
          update: data,
          create: { id: args.id, ...data },
        });
      }
      return tx.user.create({ data });
    });

    console.log("Admin berhasil dibuat:");
    console.log(`  id: ${admin.id}`);
    console.log(`  name: ${admin.name}`);
    console.log(`  role: ${admin.role}`);
    console.log(`  organizationId: ${admin.organizationId ?? "-"}`);
    if (args.id) {
      console.log(`\nPastikan ADMIN_ACTOR_ID=${admin.id} di .env sudah sesuai.`);
    } else {
      console.log(`\nSet ADMIN_ACTOR_ID=${admin.id} di .env agar login admin terhubung ke user ini.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Gagal membuat admin:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

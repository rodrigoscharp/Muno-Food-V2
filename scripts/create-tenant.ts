import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const RESERVED_SLUGS = new Set(["www", "api", "adm", "admin", "app", "default", "mail", "static"]);

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Faltou valor para --${key}`);
      }
      args[key] = value;
      i++;
    }
  }
  return args;
}

function buildTenantBaseUrl(slug: string): string {
  const rootDomain = (process.env.ROOT_DOMAIN ?? "localhost:3000").split(",")[0];
  const protocol = rootDomain.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${slug}.${rootDomain}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const nome = args.nome;
  const slug = args.slug;
  const email = args.email;
  const senha = args.senha ?? crypto.randomBytes(9).toString("base64url");

  if (!nome || !slug || !email) {
    console.error(
      'Uso: npm run tenant:create -- --nome "Restaurante X" --slug "restaurante-x" --email "admin@restaurantex.com" [--senha "..."]'
    );
    process.exit(1);
  }

  if (!/^[a-z0-9](-?[a-z0-9])*$/.test(slug)) {
    console.error("Slug inválido: use apenas letras minúsculas, números e hífens (ex: burger-house).");
    process.exit(1);
  }

  if (RESERVED_SLUGS.has(slug)) {
    console.error(`Slug "${slug}" é reservado pela plataforma. Escolha outro.`);
    process.exit(1);
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    console.error(`Já existe um tenant com o slug "${slug}".`);
    process.exit(1);
  }

  const tenant = await prisma.tenant.create({
    data: { nome, slug },
  });

  const hashedPassword = await bcrypt.hash(senha, 12);
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: `Administrador ${nome}`,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("\nTenant criado com sucesso!\n");
  console.log(`  Nome:   ${tenant.nome}`);
  console.log(`  Slug:   ${tenant.slug}`);
  console.log(`  URL:    ${buildTenantBaseUrl(tenant.slug)}`);
  console.log(`  Admin:  ${admin.email}`);
  console.log(`  Senha:  ${senha}`);
  console.log(
    "\nLembre de garantir que o domínio wildcard (*.seudominio.com) está apontado pro projeto na Vercel."
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Garante que o binário nativo arm64 do lightningcss esteja instalado.
 * Necessário quando Node.js roda como x64 (Rosetta) mas o PostCSS worker
 * executa como arm64 nativo no Apple Silicon.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  require("lightningcss-darwin-arm64");
  // Já instalado, nada a fazer
} catch {
  const pkgPath = path.join(__dirname, "../node_modules/lightningcss/package.json");
  if (!fs.existsSync(pkgPath)) process.exit(0);
  const { version } = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  console.log(`[setup] Instalando lightningcss-darwin-arm64@${version}...`);
  execSync(
    `npm install --force --cpu=arm64 --no-save lightningcss-darwin-arm64@${version}`,
    { stdio: "inherit", cwd: path.join(__dirname, "..") }
  );
  console.log("[setup] lightningcss-darwin-arm64 instalado com sucesso.");
}

/**
 * Garante que o @next/swc-wasm-nodejs esteja instalado como fallback do compilador.
 * Necessário quando nenhum binário nativo SWC é encontrado para a arquitetura atual.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

try {
  require("@next/swc-wasm-nodejs");
} catch {
  const pkgPath = path.join(root, "node_modules/next/package.json");
  if (fs.existsSync(pkgPath)) {
    const { version } = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    console.log(`[setup] Instalando @next/swc-wasm-nodejs@${version}...`);
    execSync(`npm install --force --no-save @next/swc-wasm-nodejs@${version}`, {
      stdio: "inherit",
      cwd: root,
    });
    console.log("[setup] @next/swc-wasm-nodejs instalado.");
  }
}

/**
 * Garante que os binários nativos arm64 estejam instalados.
 * Necessário quando Node.js roda como x64 (Rosetta) mas workers nativos
 * executam como arm64 no Apple Silicon.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function forceInstall(pkg, version) {
  const spec = version ? `${pkg}@${version}` : pkg;
  console.log(`[setup] Instalando ${spec}...`);
  execSync(`npm install --force --cpu=arm64 --no-save ${spec}`, { stdio: "inherit", cwd: root });
  console.log(`[setup] ${spec} instalado.`);
}

// lightningcss-darwin-arm64
try {
  require("lightningcss-darwin-arm64");
} catch {
  const pkgPath = path.join(root, "node_modules/lightningcss/package.json");
  if (fs.existsSync(pkgPath)) {
    const { version } = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    forceInstall("lightningcss-darwin-arm64", version);
  }
}

// @next/swc-wasm-nodejs (fallback SWC quando binário nativo não é encontrado)
try {
  require("@next/swc-wasm-nodejs");
} catch {
  const pkgPath = path.join(root, "node_modules/next/package.json");
  if (fs.existsSync(pkgPath)) {
    const { version } = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    forceInstall("@next/swc-wasm-nodejs", version);
  }
}

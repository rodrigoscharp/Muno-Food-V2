/**
 * Garante que os pacotes nativos corretos estejam instalados após npm install.
 *
 * Contexto: Node.js roda como x64 (Rosetta) nesta máquina.
 * - lightningcss-darwin-x64 é necessário para webpack/PostCSS (processo x64)
 * - @next/swc-wasm-nodejs é necessário como fallback do compilador SWC
 *
 * O --force no install de @next/swc-wasm-nodejs pode trocar o lightningcss
 * para arm64, por isso reinstalamos o x64 em seguida.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function forceInstall(pkg, version, cpu) {
  const spec = `${pkg}@${version}`;
  const cpuFlag = cpu ? `--cpu=${cpu}` : "";
  console.log(`[setup] Instalando ${spec}...`);
  execSync(`npm install --force ${cpuFlag} --no-save ${spec}`, {
    stdio: "inherit",
    cwd: root,
  });
}

function getVersion(pkgName) {
  const p = path.join(root, "node_modules", pkgName, "package.json");
  return fs.existsSync(p)
    ? JSON.parse(fs.readFileSync(p, "utf8")).version
    : null;
}

// 1. Instalar @next/swc-wasm-nodejs se ausente
try {
  require("@next/swc-wasm-nodejs");
} catch {
  const v = getVersion("next");
  if (v) forceInstall("@next/swc-wasm-nodejs", v, null);
}

// 2. Garantir lightningcss-darwin-x64 (processo x64 / webpack)
try {
  require("lightningcss-darwin-x64");
} catch {
  const v = getVersion("lightningcss");
  if (v) forceInstall("lightningcss-darwin-x64", v, "x64");
}

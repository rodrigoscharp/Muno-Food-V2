/**
 * Garante que lightningcss funcione para QUALQUER arquitetura (x64 e arm64).
 *
 * Estratégia definitiva: copia os binários .node diretamente para dentro do
 * diretório node_modules/lightningcss/ como fallback permanente.
 *
 * O index.js do lightningcss já tem esse fallback embutido:
 *   require(`../lightningcss.${platform}-${arch}.node`)
 *
 * Assim, mesmo que os pacotes lightningcss-darwin-* sejam removidos pelo npm,
 * os arquivos .node dentro de lightningcss/ continuam funcionando.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const root = path.join(__dirname, "..");

const lcDir = path.join(root, "node_modules", "lightningcss");
const arm64Dest = path.join(lcDir, "lightningcss.darwin-arm64.node");
const x64Dest = path.join(lcDir, "lightningcss.darwin-x64.node");

function getVersion(pkgName) {
  const p = path.join(root, "node_modules", pkgName, "package.json");
  return fs.existsSync(p)
    ? JSON.parse(fs.readFileSync(p, "utf8")).version
    : null;
}

function forceInstall(pkg, version, cpu) {
  const cpuFlag = cpu ? `--cpu=${cpu}` : "";
  execSync(`npm install --force ${cpuFlag} --no-save ${pkg}@${version}`, {
    stdio: "inherit",
    cwd: root,
  });
}

function ensureLightningcss() {
  if (!fs.existsSync(lcDir)) return;

  const v = getVersion("lightningcss");
  if (!v) return;

  const needsArm64 = !fs.existsSync(arm64Dest);
  const needsX64 = !fs.existsSync(x64Dest);

  if (!needsArm64 && !needsX64) return; // tudo ok

  console.log("[fix-lightningcss] Instalando binários nativos...");

  const tmpDir = path.join(os.tmpdir(), `lc-fix-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  if (needsArm64) {
    forceInstall("lightningcss-darwin-arm64", v, "arm64");
    const src = path.join(root, "node_modules", "lightningcss-darwin-arm64", "lightningcss.darwin-arm64.node");
    if (fs.existsSync(src)) {
      // salva cópia no tmp antes de instalar x64 (que vai remover arm64)
      fs.copyFileSync(src, path.join(tmpDir, "lightningcss.darwin-arm64.node"));
    }
  }

  if (needsX64) {
    forceInstall("lightningcss-darwin-x64", v, "x64");
    const src = path.join(root, "node_modules", "lightningcss-darwin-x64", "lightningcss.darwin-x64.node");
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, x64Dest);
      console.log("[fix-lightningcss] lightningcss.darwin-x64.node instalado.");
    }
  }

  // Restaurar arm64 do tmp (o install de x64 removeu o pacote arm64)
  const arm64Tmp = path.join(tmpDir, "lightningcss.darwin-arm64.node");
  if (fs.existsSync(arm64Tmp)) {
    fs.copyFileSync(arm64Tmp, arm64Dest);
    console.log("[fix-lightningcss] lightningcss.darwin-arm64.node instalado.");
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// 1. Garantir lightningcss para x64 e arm64
ensureLightningcss();

// 2. Instalar @next/swc-wasm-nodejs se ausente (fallback SWC)
try {
  require("@next/swc-wasm-nodejs");
} catch {
  const v = getVersion("next");
  if (v) {
    console.log("[fix-lightningcss] Instalando @next/swc-wasm-nodejs...");
    forceInstall("@next/swc-wasm-nodejs", v, null);
  }
}

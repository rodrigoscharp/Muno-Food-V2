/**
 * Garante que os binários nativos funcionem para QUALQUER arquitetura (x64 e arm64).
 *
 * Pacotes afetados:
 *   - lightningcss         (usado pelo PostCSS/Tailwind)
 *   - @tailwindcss/oxide   (engine Rust do Tailwind v4)
 *
 * Estratégia: copia os .node de cada pacote para dentro do diretório pai
 * como fallback permanente. O index.js de cada pacote já tem esse fallback
 * embutido (require('./nome.darwin-x64.node')), então funciona mesmo se
 * o pacote opcional for removido pelo npm.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const root = path.join(__dirname, "..");

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

/**
 * Garante que arm64 e x64 estejam disponíveis como fallback em destDir.
 * arm64PkgName/x64PkgName: nome do pacote npm opcional
 * arm64File/x64File: nome do arquivo .node dentro do pacote
 * arm64Dest/x64Dest: caminho de destino dentro do pacote principal
 */
function ensureBothArch({
  pkgDir, version,
  arm64Pkg, x64Pkg,
  arm64File, x64File,
}) {
  if (!fs.existsSync(pkgDir)) return;
  if (!version) return;

  const arm64Dest = path.join(pkgDir, arm64File);
  const x64Dest   = path.join(pkgDir, x64File);

  if (fs.existsSync(arm64Dest) && fs.existsSync(x64Dest)) return;

  const label = path.basename(pkgDir);
  console.log(`[fix] Instalando binários ${label}...`);

  const tmpDir = path.join(os.tmpdir(), `fix-${label}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Instala arm64, salva binário no tmp
  if (!fs.existsSync(arm64Dest)) {
    forceInstall(arm64Pkg, version, "arm64");
    const src = path.join(root, "node_modules", arm64Pkg, arm64File);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tmpDir, arm64File));
  }

  // Instala x64, copia direto ao destino (isso remove arm64 pkg)
  if (!fs.existsSync(x64Dest)) {
    forceInstall(x64Pkg, version, "x64");
    const src = path.join(root, "node_modules", x64Pkg, x64File);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, x64Dest);
      console.log(`[fix] ${x64File} instalado.`);
    }
  }

  // Restaura arm64 do tmp
  const arm64Tmp = path.join(tmpDir, arm64File);
  if (fs.existsSync(arm64Tmp) && !fs.existsSync(arm64Dest)) {
    fs.copyFileSync(arm64Tmp, arm64Dest);
    console.log(`[fix] ${arm64File} instalado.`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── 1. lightningcss ──────────────────────────────────────────────────────────
ensureBothArch({
  pkgDir:    path.join(root, "node_modules", "lightningcss"),
  version:   getVersion("lightningcss"),
  arm64Pkg:  "lightningcss-darwin-arm64",
  x64Pkg:    "lightningcss-darwin-x64",
  arm64File: "lightningcss.darwin-arm64.node",
  x64File:   "lightningcss.darwin-x64.node",
});

// ── 2. @tailwindcss/oxide ────────────────────────────────────────────────────
ensureBothArch({
  pkgDir:    path.join(root, "node_modules", "@tailwindcss", "oxide"),
  version:   getVersion("@tailwindcss/oxide"),
  arm64Pkg:  "@tailwindcss/oxide-darwin-arm64",
  x64Pkg:    "@tailwindcss/oxide-darwin-x64",
  arm64File: "tailwindcss-oxide.darwin-arm64.node",
  x64File:   "tailwindcss-oxide.darwin-x64.node",
});

// ── 3. @next/swc-wasm-nodejs (fallback compilador SWC) ───────────────────────
try {
  require("@next/swc-wasm-nodejs");
} catch {
  const v = getVersion("next");
  if (v) {
    console.log("[fix] Instalando @next/swc-wasm-nodejs...");
    forceInstall("@next/swc-wasm-nodejs", v, null);
  }
}

const path = require("path");
const { pathToFileURL } = require("url");

const frontendDir = path.join(__dirname, "..", "frontend");
const port = Number(process.env.PORT || 8080);

async function main() {
  let viteDir;
  try {
    viteDir = path.dirname(require.resolve("vite/package.json", { paths: [frontendDir] }));
  } catch (_) {
    throw new Error("Vispirms izpildi: cd frontend && npm install");
  }
  const { createServer } = await import(pathToFileURL(path.join(viteDir, "dist", "node", "index.js")).href);

  const server = await createServer({
    root: frontendDir,
    configFile: path.join(frontendDir, "vite.config.js"),
    server: {
      port,
      host: true,
      strictPort: true,
      allowedHosts: true,
      fs: { strict: true, allow: [frontendDir] },
    },
  });

  await server.listen();
  server.printUrls();
  console.log("Tiek pasniegta tikai mape: " + frontendDir);
}

main().catch((e) => {
  console.error("✗ " + (e.message || e));
  process.exitCode = 1;
});

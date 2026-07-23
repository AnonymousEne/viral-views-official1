// Integration smoke test: boots the Vite dev server, loads test/harness.html
// in a real headless Chromium (so the actual AudioWorklet/WASM engine runs),
// and asserts the full MIDI -> pitch-detect -> align -> render pipeline
// produces correctly pitched, correctly timed, correctly silenced audio.
//
// Usage: node test/run-e2e.mjs
// Env:   PLAYWRIGHT_CHROMIUM_PATH - explicit path to a Chromium binary,
//        for sandboxes that ship a browser outside Playwright's own cache.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteBin = path.join(__dirname, "..", "node_modules", ".bin", "vite");

const PORT = 5183 + Math.floor(Math.random() * 1000);
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await delay(200);
  }
  throw new Error(`Dev server did not come up at ${url} within ${timeoutMs}ms`);
}

async function main() {
  const vite = spawn(viteBin, ["--port", String(PORT), "--strictPort"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let viteOutput = "";
  vite.stdout.on("data", (d) => (viteOutput += d));
  vite.stderr.on("data", (d) => (viteOutput += d));

  const browserOptions = {
    args: ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    browserOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }

  try {
    await waitForServer(BASE_URL, 20000);

    const browser = await chromium.launch(browserOptions);
    const page = await browser.newPage();
    page.on("pageerror", (err) => console.error("[pageerror]", err.message));

    await page.goto(`${BASE_URL}/test/harness.html`);
    await page.waitForSelector("#status[data-done]", { timeout: 60000 });

    const result = await page.evaluate(() => window.__harnessResult);
    await browser.close();

    for (const c of result.checks ?? []) {
      console.log(`${c.pass ? "PASS" : "FAIL"} ${c.name}: ${c.detail}`);
    }
    if (result.error) console.error("ERROR:", result.error);

    if (!result.ok) {
      console.error("\nE2E smoke test FAILED");
      process.exitCode = 1;
    } else {
      console.log("\nE2E smoke test passed");
    }
  } catch (err) {
    console.error(viteOutput);
    throw err;
  } finally {
    vite.kill("SIGTERM");
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

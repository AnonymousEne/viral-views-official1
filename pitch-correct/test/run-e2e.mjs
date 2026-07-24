// Integration smoke tests: boots the Vite dev server and loads each of the
// browser test pages below in a real headless Chromium (so the actual
// AudioWorklet/WASM engine runs), asserting they each report data-done=pass
// on their #status element.
//
//   harness.html  - full MIDI -> pitch-detect -> align -> render pipeline
//                   against a synthesized mistuned/mistimed take
//   accuracy.html - YIN pitch-tracker accuracy across the vocal range,
//                   with vibrato, harmonics, and breath noise
//   stress.html   - alignment plan sanity under mismatched note counts
//                   (skipped notes, ad-libs, severe under/over-singing)
//   loopcheck.html - the loop-to-sustain fallback for a short sung note
//                    matched to a much longer target note
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

const PAGES = ["harness.html", "accuracy.html", "stress.html", "loopcheck.html"];

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

async function runPage(browser, page_) {
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (msg) => logs.push(msg.text()));
  page.on("pageerror", (err) => logs.push("[pageerror] " + err.message));

  await page.goto(`${BASE_URL}/test/${page_}`);
  await page.waitForSelector("#status[data-done]", { timeout: 90000 });
  const done = await page.getAttribute("#status", "data-done");
  await page.close();

  const ok = done === "pass" || done === "true";
  console.log(`\n=== ${page_}: ${ok ? "PASS" : "FAIL"} ===`);
  for (const line of logs) {
    if (line.startsWith("[vite]") || line.includes("404")) continue;
    console.log(line);
  }
  return ok;
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

    let allOk = true;
    for (const p of PAGES) {
      const ok = await runPage(browser, p);
      allOk = allOk && ok;
    }

    await browser.close();

    console.log(allOk ? "\nAll e2e smoke tests passed" : "\nSome e2e smoke tests FAILED");
    process.exitCode = allOk ? 0 : 1;
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

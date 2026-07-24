// UI-level smoke test: drives the *real* app (not internal functions) with
// Playwright - uploads a real WAV + a real MIDI file through the actual
// file inputs, clicks the actual "Snap to MIDI" button, and asserts the
// actual result panel (download link, corrected <audio>) appears. Runs
// against the single-file production build (dist-singlefile/index.html),
// the same artifact that gets published/shared.
//
// Usage: node test/run-ui.mjs
// Env:   PLAYWRIGHT_CHROMIUM_PATH - explicit path to a Chromium binary.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const viteBin = path.join(root, "node_modules", ".bin", "vite");
const fixturesDir = path.join(__dirname, "fixtures");
const wavPath = path.join(fixturesDir, "sample-vocal.wav");
const midiPath = path.join(fixturesDir, "target-melody.mid");

const browserOptions = {
  args: ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
};
if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
  browserOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
}

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
  throw new Error(`Server did not come up at ${url} within ${timeoutMs}ms`);
}

async function generateFixtures(browser, port) {
  const vite = spawn(viteBin, ["--port", String(port), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
  try {
    await waitForServer(`http://localhost:${port}`, 20000);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/test/fixtures.html`);
    await page.waitForSelector("#status[data-done]", { timeout: 30000 });
    const done = await page.getAttribute("#status", "data-done");
    if (done !== "true") throw new Error("Fixture generation failed: " + (await page.textContent("#status")));

    const fixtures = await page.evaluate(() => window.__fixtures);
    await page.close();

    fs.mkdirSync(fixturesDir, { recursive: true });
    fs.writeFileSync(wavPath, Buffer.from(fixtures.wavBase64, "base64"));
    fs.writeFileSync(midiPath, Buffer.from(fixtures.midiBase64, "base64"));
    console.log(`Wrote fixtures: ${wavPath} (${fs.statSync(wavPath).size}B), ${midiPath} (${fs.statSync(midiPath).size}B)`);
  } finally {
    vite.kill("SIGTERM");
  }
}

function serveStatic(dir, port) {
  const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
  const server = http.createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url;
    const filePath = path.join(dir, decodeURIComponent(urlPath.split("?")[0]));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function main() {
  const fixturePort = 5280 + Math.floor(Math.random() * 500);
  const appPort = fixturePort + 1;

  const browser = await chromium.launch(browserOptions);
  const consoleErrors = [];

  try {
    if (!fs.existsSync(wavPath) || !fs.existsSync(midiPath)) {
      await generateFixtures(browser, fixturePort);
    } else {
      console.log("Reusing existing fixtures.");
    }

    const singlefileDir = path.join(root, "dist-singlefile");
    if (!fs.existsSync(path.join(singlefileDir, "index.html"))) {
      throw new Error(`${singlefileDir}/index.html not found - run "npm run build:singlefile" first.`);
    }

    const server = await serveStatic(singlefileDir, appPort);
    try {
      const page = await browser.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      await page.goto(`http://localhost:${appPort}/`);
      await page.waitForSelector("text=Pitch Correct");

      // Upload the vocal take via the hidden file input inside the Recorder panel.
      const vocalInput = page.locator('input[type="file"][accept="audio/*"]');
      await vocalInput.setInputFiles(wavPath);
      await page.waitForSelector("audio.preview");

      // Upload the reference MIDI.
      const midiInput = page.locator('input[type="file"][accept*="mid"]');
      await midiInput.setInputFiles(midiPath);
      await page.waitForSelector("text=/\\d+ notes,/");

      // Run correction.
      const correctButton = page.getByRole("button", { name: /Snap to MIDI/ });
      await correctButton.click();

      await page.waitForSelector("text=4. Result", { timeout: 30000 });
      await page.waitForSelector('a[download="corrected-vocal.wav"]', { timeout: 10000 });

      const href = await page.getAttribute('a[download="corrected-vocal.wav"]', "href");
      const matchedText = await page.textContent(".meta");

      console.log("Result download href:", href?.slice(0, 30) + "...");
      console.log("Match summary:", matchedText);

      const ok =
        Boolean(href && href.startsWith("blob:")) &&
        Boolean(matchedText && /3 note\(s\) matched of 3 target note\(s\)/.test(matchedText)) &&
        consoleErrors.length === 0;

      if (consoleErrors.length > 0) {
        console.error("Console errors during run:\n" + consoleErrors.join("\n"));
      }

      console.log(ok ? "\nUI smoke test passed" : "\nUI smoke test FAILED");
      process.exitCode = ok ? 0 : 1;
    } finally {
      server.close();
    }
  } finally {
    await browser.close();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

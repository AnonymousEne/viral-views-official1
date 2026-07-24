// Drives the actual Live Monitor UI against the real signalsmith-stretch
// engine: uses Chromium's --use-file-for-fake-audio-capture to feed a
// synthesized, known-pitch tone as the "microphone" input (a sustained A3,
// deliberately different from the MIDI target note), loads a one-note MIDI
// reference (C4) into the real Live Monitor tab, clicks the real "Start
// singing" button, and reads the real on-screen status readout to confirm
// the live engine is actually detecting A3 and computing a ~+3 semitone
// correction toward C4 - not just reasoning about the code path.
//
// Usage: node test/run-live.mjs
// Env:   PLAYWRIGHT_CHROMIUM_PATH
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const viteBin = path.join(root, "node_modules", ".bin", "vite");
const fixturesDir = path.join(__dirname, "fixtures");
const wavPath = path.join(fixturesDir, "fake-mic-tone.wav");
const midiPath = path.join(fixturesDir, "live-target.mid");

const PORT = 5750 + Math.floor(Math.random() * 500);
const baseUrl = `http://localhost:${PORT}`;

function launchOptions(extraArgs) {
  const opts = {
    args: ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", ...extraArgs],
  };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) opts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  return opts;
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
  throw new Error(`Dev server did not come up at ${url} within ${timeoutMs}ms`);
}

async function generateFixtures(browser) {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/test/gentone.html`);
  await page.waitForSelector("#status[data-done]", { timeout: 30000 });
  const tone = await page.evaluate(() => window.__tone);
  await page.close();

  fs.mkdirSync(fixturesDir, { recursive: true });
  fs.writeFileSync(wavPath, Buffer.from(tone.wavBase64, "base64"));
  fs.writeFileSync(midiPath, Buffer.from(tone.midiBase64, "base64"));

  return { toneMidi: tone.midi, targetMidi: tone.targetMidi };
}

async function main() {
  const vite = spawn(viteBin, ["--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
  let viteOutput = "";
  vite.stdout.on("data", (d) => (viteOutput += d));
  vite.stderr.on("data", (d) => (viteOutput += d));

  try {
    await waitForServer(baseUrl, 20000);

    const browser = await chromium.launch(launchOptions([]));
    const { toneMidi, targetMidi } = await generateFixtures(browser);

    const liveBrowser = await chromium.launch(launchOptions([`--use-file-for-fake-audio-capture=${wavPath}`]));
    const context = await liveBrowser.newContext();
    await context.grantPermissions(["microphone"]);
    const page = await context.newPage();
    page.on("pageerror", (err) => console.error("[pageerror]", err.message));

    await page.goto(`${baseUrl}/`);
    await page.getByRole("button", { name: "Live monitor" }).click();

    const midiInput = page.locator('input[type="file"][accept*="mid"]');
    await midiInput.setInputFiles(midiPath);
    await page.waitForSelector("text=/\\d+ notes,/");

    await page.getByRole("button", { name: /Start singing/ }).click();
    await page.waitForSelector(".live-status", { timeout: 10000 });
    await page.waitForTimeout(1500); // let a few detection ticks land

    const statusText = await page.textContent(".live-status");
    console.log("Live status:", statusText);

    await page.getByRole("button", { name: /Stop/ }).click();
    await liveBrowser.close();
    await browser.close();

    const match = statusText?.match(/target (\S+) · you (\S+) · shift (-?\d+\.\d+) st/);
    if (!match) {
      console.error("Could not parse live status text");
      process.exitCode = 1;
      return;
    }
    const [, targetName, youName, shiftStr] = match;
    const shift = parseFloat(shiftStr);

    console.log(`toneMidi=${toneMidi} targetMidi=${targetMidi} parsed target=${targetName} you=${youName} shift=${shift}`);

    const shiftOk = Math.abs(shift - (targetMidi - toneMidi)) < 0.5;
    const targetOk = targetName === "C4";
    const youOk = youName === "A3";

    console.log(`${targetOk ? "PASS" : "FAIL"} target note reads C4`);
    console.log(`${youOk ? "PASS" : "FAIL"} detected note reads A3 (the fake mic tone)`);
    console.log(`${shiftOk ? "PASS" : "FAIL"} correction shift ~= +3 semitones (got ${shift})`);

    const ok = targetOk && youOk && shiftOk;
    console.log(ok ? "\nLive mode UI test passed" : "\nLive mode UI test FAILED");
    process.exitCode = ok ? 0 : 1;
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

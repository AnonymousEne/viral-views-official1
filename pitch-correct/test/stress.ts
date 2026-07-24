import { buildCorrectionPlan } from "../src/audio/align";
import { buildSchedule, DEFAULT_ENGINE_OPTIONS } from "../src/audio/correctionEngine";
import type { SungNote, TargetNote } from "../src/audio/types";

const statusEl = document.getElementById("status")!;
const log = (m: string) => {
  console.log(m);
  statusEl.textContent += "\n" + m;
};

function sung(startTime: number, endTime: number, midi: number): SungNote {
  return { startTime, endTime, midi, frames: [] };
}
function target(startTime: number, endTime: number, midi: number): TargetNote {
  return { startTime, endTime, midi, velocity: 0.8 };
}

interface Scenario {
  name: string;
  sungNotes: SungNote[];
  targetNotes: TargetNote[];
}

const scenarios: Scenario[] = [
  {
    name: "Exact match (baseline)",
    targetNotes: [target(0, 0.5, 60), target(0.5, 1.0, 62), target(1.0, 1.5, 64), target(1.5, 2.0, 65)],
    sungNotes: [sung(0.02, 0.48, 59.8), sung(0.52, 0.97, 61.9), sung(1.03, 1.46, 64.1), sung(1.52, 1.98, 65.2)],
  },
  {
    name: "Singer skipped a note (4 target, 3 sung)",
    targetNotes: [target(0, 0.5, 60), target(0.5, 1.0, 62), target(1.0, 1.5, 64), target(1.5, 2.0, 65)],
    sungNotes: [sung(0.02, 0.48, 59.8), sung(0.52, 0.97, 61.9), sung(1.05, 1.95, 65.1)],
  },
  {
    name: "Singer added an ad-lib note (3 target, 4 sung)",
    targetNotes: [target(0, 0.7, 60), target(0.7, 1.4, 64), target(1.4, 2.0, 67)],
    sungNotes: [sung(0.02, 0.3, 59.9), sung(0.32, 0.68, 61.0), sung(0.72, 1.38, 64.1), sung(1.42, 1.98, 67.2)],
  },
  {
    name: "Severe under-singing (5 target, 2 sung)",
    targetNotes: [
      target(0, 0.4, 60),
      target(0.4, 0.8, 62),
      target(0.8, 1.2, 64),
      target(1.2, 1.6, 65),
      target(1.6, 2.0, 67),
    ],
    sungNotes: [sung(0.05, 0.9, 61), sung(1.0, 1.95, 65.5)],
  },
  {
    name: "Very short blip sung note vs long target note",
    targetNotes: [target(0, 3.0, 60)],
    sungNotes: [sung(0.1, 0.15, 60.2)],
  },
  {
    name: "Very long sung note vs short target note",
    targetNotes: [target(0, 0.15, 60)],
    sungNotes: [sung(0.0, 3.0, 60.1)],
  },
];

const MAX_SANE_RATE = 8;
const MIN_SANE_RATE = 1 / 8;

async function main() {
  let allOk = true;

  for (const sc of scenarios) {
    const plan = buildCorrectionPlan(sc.sungNotes, sc.targetNotes);
    let scenarioOk = true;
    const issues: string[] = [];

    if (plan.segments.length === 0 && sc.targetNotes.length > 0 && sc.sungNotes.length > 0) {
      issues.push("produced zero segments despite having both sung and target notes");
      scenarioOk = false;
    }

    for (const seg of plan.segments) {
      const dur = seg.outEnd - seg.outStart;
      const srcDur = seg.sungEnd - seg.sungStart;
      const rate = dur > 0 ? srcDur / dur : NaN;

      if (!Number.isFinite(rate) || rate <= 0) {
        issues.push(`segment [${seg.outStart.toFixed(2)},${seg.outEnd.toFixed(2)}) has invalid rate=${rate}`);
        scenarioOk = false;
      } else if (rate > MAX_SANE_RATE || rate < MIN_SANE_RATE) {
        // The raw alignment plan can legitimately ask for an extreme rate
        // (a real mismatch between what was sung and the target) - that's
        // fine, since buildSchedule() (checked below) is responsible for
        // clamping it before it reaches the DSP node. Informational only.
        issues.push(
          `(pre-clamp) segment [${seg.outStart.toFixed(2)},${seg.outEnd.toFixed(2)}) wants natural rate=${rate.toFixed(2)}x ` +
            `(source ${srcDur.toFixed(2)}s -> output ${dur.toFixed(2)}s)`,
        );
      }

      if (seg.sungStart < 0 || seg.sungEnd < seg.sungStart) {
        issues.push(`segment has invalid source range [${seg.sungStart},${seg.sungEnd}]`);
        scenarioOk = false;
      }
    }

    // What actually reaches the DSP node, after buildSchedule()'s clamping
    // (cap extreme speed-ups, loop extreme slow-downs) - this is the part
    // that determines what the user will actually hear.
    const schedulePoints = buildSchedule(plan, DEFAULT_ENGINE_OPTIONS.maxStretchRate);
    for (const point of schedulePoints) {
      if (point.rate != null && (!Number.isFinite(point.rate) || point.rate <= 0)) {
        issues.push(`schedule point at output=${point.output} has invalid rate=${point.rate}`);
        scenarioOk = false;
      } else if (point.rate != null && (point.rate > DEFAULT_ENGINE_OPTIONS.maxStretchRate + 1e-6 || point.rate < 1 / DEFAULT_ENGINE_OPTIONS.maxStretchRate - 1e-6)) {
        issues.push(`schedule point at output=${point.output} exceeds maxStretchRate: rate=${point.rate}`);
        scenarioOk = false;
      }
    }

    // Coverage: every target note's time range should be touched by exactly the segments overlapping it.
    const coveredTargets = new Set(plan.segments.map((s) => `${s.outStart}-${s.outEnd}`));
    const missingTargets = sc.targetNotes.filter((t) => !coveredTargets.has(`${t.startTime}-${t.endTime}`));

    log(
      `${scenarioOk ? "OK" : "FAIL"} ${sc.name}: ${plan.segments.length} segments, ${sc.targetNotes.length} targets, ` +
        `${missingTargets.length} target(s) with no assigned audio` +
        (issues.length ? `\n    ${issues.join("\n    ")}` : ""),
    );

    allOk = allOk && scenarioOk;
  }

  statusEl.setAttribute("data-done", allOk ? "pass" : "fail");
}

main().catch((err) => {
  log("ERROR: " + (err instanceof Error ? err.stack : String(err)));
  statusEl.setAttribute("data-done", "fail");
});

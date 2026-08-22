import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveExamRemainingSeconds,
  shouldAutoSubmitFromTimer,
} from "./examTimer.js";

test("uses the server-calculated remaining seconds as the primary timer source", () => {
  assert.equal(
    resolveExamRemainingSeconds(
      { remainingSeconds: 3598, examEndsAtUtc: "invalid" },
      60
    ),
    3598
  );
});

test("rejects timezone-less server timestamps instead of treating them as expired", () => {
  assert.equal(
    resolveExamRemainingSeconds(
      { examEndsAtUtc: "2026-08-01T21:52:13" },
      60,
      Date.parse("2026-08-02T00:00:00+03:00")
    ),
    3600
  );
});

test("parses timestamps only when they carry an explicit UTC offset", () => {
  assert.equal(
    resolveExamRemainingSeconds(
      { examEndsAtUtc: "2026-08-01T22:52:13+00:00" },
      60,
      Date.parse("2026-08-01T21:52:13+00:00")
    ),
    3600
  );
});

test("never auto-submits from an initial zero timer", () => {
  assert.equal(shouldAutoSubmitFromTimer(0, 0), false);
  assert.equal(shouldAutoSubmitFromTimer(1, 0), true);
});

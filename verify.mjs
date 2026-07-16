#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const checkIds = [
  "football-1x2-scoring-benchmark",
  "football-1x2-margin-removal-benchmark",
  "football-1x2-probability-calibration-benchmark",
  "football-poisson-scenario-grid",
  "poisson-vs-dixon-coles-football-benchmark",
];
const sha256Pattern = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(message);
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(`${label} has missing or unsupported fields`);
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validate(payload) {
  exactKeys(payload, ["schemaVersion", "checkedAt", "producer", "checks"], "receipt");
  if (payload.schemaVersion !== "footballproofai-research-reproducibility/1.0.0") {
    fail("unsupported schemaVersion");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(payload.checkedAt)) {
    fail("checkedAt must use canonical UTC whole-second precision");
  }
  exactKeys(
    payload.producer,
    ["repository", "workflow", "runId", "runAttempt", "commitSha"],
    "producer",
  );
  if (!/^\d+$/.test(payload.producer.runId) || !/^[a-f0-9]{40}$/.test(payload.producer.commitSha)) {
    fail("producer identity is invalid");
  }
  if (!Array.isArray(payload.checks) || payload.checks.length !== 5) {
    fail("checks must contain exactly five rows");
  }
  for (const [index, check] of payload.checks.entries()) {
    exactKeys(
      check,
      [
        "benchmarkId", "benchmarkVersion", "manifestPath", "manifestSha256",
        "generatorPath", "generatorSha256", "sourceDigestSha256",
        "artifactDigestSha256", "reproduced", "errorSha256",
      ],
      `checks[${index}]`,
    );
    if (check.benchmarkId !== checkIds[index]) fail(`checks[${index}] is out of order`);
    for (const field of [
      "manifestSha256", "generatorSha256", "sourceDigestSha256", "artifactDigestSha256",
    ]) {
      if (!sha256Pattern.test(check[field])) fail(`checks[${index}].${field} is invalid`);
    }
    if (typeof check.reproduced !== "boolean") fail(`checks[${index}].reproduced is invalid`);
    if (check.reproduced ? check.errorSha256 !== null : !sha256Pattern.test(check.errorSha256 ?? "")) {
      fail(`checks[${index}].errorSha256 does not match reproduced`);
    }
  }
}

const [file, expectedPayloadSha256] = process.argv.slice(2);
if (!file) fail("usage: node verify.mjs <receipt.json> [expected-payload-sha256]");
const bytes = await readFile(file);
const payload = JSON.parse(bytes.toString("utf8"));
validate(payload);
const payloadSha256 = sha256(JSON.stringify(canonicalize(payload)));
const documentSha256 = sha256(bytes);
if (expectedPayloadSha256 && payloadSha256 !== expectedPayloadSha256) {
  fail(`payload SHA-256 mismatch: observed ${payloadSha256}`);
}
console.log(JSON.stringify({ file, payloadSha256, documentSha256 }, null, 2));

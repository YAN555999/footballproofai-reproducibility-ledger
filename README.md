# Football Proof AI reproducibility receipts

This public repository is the append-only receipt mirror for the five benchmark
checks shown at [footballproofai.com/research/reproducibility-ledger](https://footballproofai.com/research/reproducibility-ledger).

Each `runs/<github-run-id>-<attempt>.json` file is committed here and then read
back anonymously from its commit-pinned raw URL before the same run is accepted
by the public [Football Proof AI API](https://footballproofai.com/api/v1/research-reproducibility-runs).
The API publishes both the public commit SHA and the SHA-256 of these exact file
bytes.

## Verify a receipt

```bash
node verify.mjs runs/<github-run-id>-<attempt>.json <payloadSha256-from-the-api>
```

The verifier checks the strict five-benchmark shape and recomputes the payload
hash. Canonicalization recursively sorts object keys lexicographically,
preserves array order, serializes compact UTF-8 JSON, and applies SHA-256.

## Evidence boundary

A receipt shows what the named workflow reported and binds that report to public
bytes and Git history. It is not independent replication, a trusted timestamp,
external peer review, source-data licensing, model-accuracy evidence, or proof
of profitability. The originating source workflow is retained in each record
but may require private-repository access. Failed reproduction checks remain
public instead of being replaced.

See [`receipt.schema.json`](receipt.schema.json), [`LICENSE.md`](LICENSE.md), and
the canonical [research page](https://footballproofai.com/research/reproducibility-ledger)
for the field and licensing contracts.

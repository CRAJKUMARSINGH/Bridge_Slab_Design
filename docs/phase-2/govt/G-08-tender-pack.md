# G-08 — TENDER-READY DELIVERABLE PACK
Prereq: W09A, W10 | Feeds: W12A

## What a pack contains
00-cover.pdf · 01-index.pdf · 02-technical-report.pdf · 03-boq.xlsx · 03a-boq.pdf ·
04-drawings/*.dxf + drawings.pdf · 05-specifications.pdf · 06-design-report.pdf ·
07-evidence/manifest.json + checksums.txt · 08-readme.txt

## CODE — lib/pack/build.ts
```ts
export interface PackOptions { runId: string; includeDrawings: boolean; locale: "en" | "hi" | "bilingual"; sign?: SignerMeta }

export async function buildTenderPack(o: PackOptions) {
  const run = await loadRun(o.runId);
  const zip = archiver("zip", { zlib: { level: 9 } });

  const index: PackEntry[] = [];
  const add = async (name: string, data: Buffer | string, kind: ArtifactKind) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    zip.append(buf, { name });
    index.push({ name, bytes: buf.length, sha256: sha256(buf), kind });
  };

  await add("00-cover.pdf", await renderCover(run, o.locale), "REPORT_PDF");
  await add("02-technical-report.pdf", await renderDPR(run, o.locale), "REPORT_PDF");
  await add("03-boq.xlsx", await renderBOQ(run), "BOQ_XLSX");
  await add("03a-boq.pdf", await renderBOQPdf(run, o.locale), "BOQ_PDF");
  await add("06-design-report.pdf", await renderReport(run, o.locale), "REPORT_PDF");
  if (o.includeDrawings) for (const d of await listDrawings(run.id)) await add(`04-drawings/${d.name}`, await readArtifact(run.id, d.path), "DXF");

  const manifest: EvidenceManifest = {
    manifestVersion: "1.0.0", runId: run.id, fingerprint: run.fingerprint,
    producedAt: new Date().toISOString(), artifacts: index.map(e => ({ ...e, path: e.name })),
    previousManifestSha256: run.previousManifestSha256, chainHash: "",
  };
  manifest.chainHash = chainHash({ ...manifest, chainHash: undefined } as any);

  await add("01-index.pdf", await renderIndex(index, manifest), "REPORT_PDF");
  await add("07-evidence/manifest.json", JSON.stringify(manifest, null, 2), "RESULT_JSON");
  await add("07-evidence/checksums.txt", index.map(e => `${e.sha256}  ${e.name}`).join("\n"), "RESULT_JSON");

  if (o.sign) { const signed = await signManifest(manifest, o.sign); await add("07-evidence/manifest.p7s", signed, "RESULT_JSON"); }
  zip.finalize();
  return { zip, manifest, index };
}
```

## Rule
The pack is only TENDER-READY when: every drawing carries a title and revision block,
the BOQ total equals the DPR cost line, and the manifest chain verifies. Otherwise the
cover states **NOT TENDER-READY** with the reasons.

## Exit gate
[ ] Pack builds for all three bridge families
[ ] Index page lists every entry with its hash and byte count
[ ] checksums.txt verifies with `sha256sum -c`
[ ] DPR cost == BOQ total (else the cover says why)
[ ] Re-importing the pack reproduces the run (round-trip test)

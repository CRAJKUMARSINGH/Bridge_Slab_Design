# G-01 — DIGITAL SIGNATURE, STAMP BLOCK & HASH CHAIN
Prereq: W05 (fingerprints exist) | Feeds: W10 (stamp block), W12A (launch evidence)
Risk: HIGH — a signed report that can be silently altered is worse than an unsigned one.

## Tasks
G1.1 Three signing modes (see the DSC tab above). Implement all three; make Mode B the
     documented default for site work.
G1.2 Never persist a private key server-side. Modes A and B only.
G1.3 Chain-hash the evidence manifest so any artifact tamper is detectable.
G1.4 Visible stamp block on every report and drawing sheet: name, licence no., date,
     scope, signature image, and the chain hash in 8-char groups.
G1.5 `verify:signature` gate: walk manifest -> artifacts -> report -> drawing -> BOQ.
G1.6 A report is DRAFT until a signature row exists for it.

## CODE — lib/signing/hash-chain.ts
```ts
import { createHash } from "node:crypto";

export type ArtifactKind =
  | "REPORT_HTML" | "REPORT_PDF" | "DXF" | "BOQ_XLSX" | "BOQ_PDF"
  | "RESULT_JSON" | "INPUT_JSON" | "FIGURE_SVG";

export interface ArtifactRef { path: string; sha256: string; bytes: number; kind: ArtifactKind }

export interface EvidenceManifest {
  manifestVersion: "1.0.0";
  runId: string;
  fingerprint: RunFingerprint;
  producedAt: string;
  artifacts: ArtifactRef[];
  previousManifestSha256: string | null;
  chainHash: string;
}

const canonical = (m: Omit<EvidenceManifest, "chainHash">) =>
  JSON.stringify({ ...m, artifacts: [...m.artifacts].sort((a, b) => a.path.localeCompare(b.path)) });

export const chainHash = (m: Omit<EvidenceManifest, "chainHash">) =>
  createHash("sha256").update(canonical(m)).digest("hex");

export function verifyChain(m: EvidenceManifest): { ok: boolean; reason?: string } {
  const { chainHash: given, ...rest } = m;
  if (chainHash(rest) !== given) return { ok: false, reason: "manifest tampered" };
  for (const a of m.artifacts)
    if (!/^[0-9a-f]{64}$/.test(a.sha256)) return { ok: false, reason: `bad hash ${a.path}` };
  return { ok: true };
}
```

## CODE — lib/signing/sign-pdf.ts (Mode A)
```ts
import { PDFDocument } from "pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";

export interface SignerMeta { name: string; licence: string; email: string; location: string; scope: string }

export async function signPdf(pdf: Uint8Array, p12: Buffer, pass: string, meta: SignerMeta, chain: string) {
  const doc = await PDFDocument.load(pdf);
  pdflibAddPlaceholder({
    pdfDoc: doc,
    reason: `${meta.scope} | chain ${chain}`,
    contactInfo: meta.email,
    name: `${meta.name} (${meta.licence})`,
    location: meta.location,
    signatureLength: 16384,
  });
  const staged = await doc.save();
  return new SignPdf().sign(Buffer.from(staged), new P12Signer(p12, { passphrase: pass }));
}
```

## CODE — tools/dsc-agent.ts (Mode B, USB token, localhost:7717)
```ts
import express from "express";
import { createHash } from "node:crypto";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use((_, res, next) => { res.set("Access-Control-Allow-Origin", "*"); next(); });

// PKCS#11 against the token driver. Fallback: openssl dgst -sha256 -sign
app.post("/sign", async (req, res) => {
  const { bytesBase64, name, licence, scope } = req.body;
  const digest = createHash("sha256").update(Buffer.from(bytesBase64, "base64")).digest();
  // tokenSign(digest) -> detached PKCS#7 DER, via graphene-pk11 or openssl
  const pkcs7 = await tokenSign(digest, { name, licence, scope });
  res.json({ detached: pkcs7.toString("base64"), digest: digest.toString("hex") });
});

app.post("/health", (_, res) => res.json({ ok: true, token: !!process.env.PKCS11_LIB }));
app.listen(7717);
```

## CODE — client/src/components/SignatureBlock.tsx
```tsx
export function SignatureBlock({ run, chain }: { run: RunView; chain: string }) {
  const groups = chain.match(/.{1,8}/g) ?? [];
  return (
    <section className="stamp" aria-labelledby="sig-h">
      <h3 id="sig-h">Certification</h3>
      <dl>
        <dt>Calculated by</dt><dd>Bridge Report Studio, engine {run.engineVersion.engine}</dd>
        <dt>Input fingerprint</dt><dd><code>{run.fingerprint.inputSha256.slice(0, 16)}</code></dd>
        <dt>Evidence chain</dt>
        <dd><code aria-label={`chain hash ${chain}`}>{groups.join(" ")}</code></dd>
        <dt>Review state</dt><dd>{run.reviewState}</dd>
      </dl>
      {run.signature ? (
        <div className="signed">
          <img src={run.signature.image} alt="" aria-hidden />
          <p><strong>{run.signature.name}</strong> — Lic. {run.signature.licence}</p>
          <p>{formatDateIndian(new Date(run.signature.signedAt))} · {run.signature.location}</p>
          <p className="scope">{run.signature.scope}</p>
        </div>
      ) : (
        <p className="draft" role="status">DRAFT — no licensed engineer has signed this run.</p>
      )}
      <p className="not-assessed">
        This software did not assess: {run.notAssessed.join(", ")}. A qualified engineer must confirm.
      </p>
    </section>
  );
}
```

## CODE — scripts/gates/verify-signature.ts
```ts
export async function verifySignature(runId: string) {
  const m = await loadManifest(runId);
  const v = verifyChain(m);
  if (!v.ok) return fail(`chain broken: ${v.reason}`);
  for (const a of m.artifacts) {
    const buf = await readArtifact(runId, a.path);
    if (sha256(buf) !== a.sha256) return fail(`artifact tampered: ${a.path}`);
  }
  const sig = await loadSignature(runId);
  if (sig && !(await verifyPkcs7(sig.detached, sig.digest))) return fail("bad signature");
  pass(`${m.artifacts.length} artifacts, chain intact`);
}
```

## Exit gate
[ ] All three modes work; no key persisted server-side
[ ] verify:signature green; tampering one byte makes it red (test)
[ ] Stamp block on report and every drawing sheet
[ ] Unsigned run cannot leave DRAFT
[ ] not-assessed statement present and generated from the check registry, not typed

## Tests
Falsify: flip one byte in a PDF -> verify:signature red. Delete an artifact -> red.
Re-order artifacts in the manifest -> chain still valid (canonical sort proven).

import { Router, type IRouter } from "express";
import { resolve } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { spawn, execSync } from "child_process";

const router: IRouter = Router();

const WORKSPACE_ROOT = resolve(process.cwd(), "../../");
const GIT_REPOS_DIR = resolve(WORKSPACE_ROOT, "git-repos");
const SYNC_STATE_FILE = resolve(WORKSPACE_ROOT, "sync-state.json");

if (!existsSync(GIT_REPOS_DIR)) {
  mkdirSync(GIT_REPOS_DIR, { recursive: true });
}

const REPOS = [
  { url: "https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design", label: "Bridge Slab Design", primary: true, desc: "IRC submersible & high-level slab bridge design — 100+ LFS assets" },
  { url: "https://github.com/CRAJKUMARSINGH/M4_Bridge", label: "M4 Bridge", primary: false, desc: "Module 4 bridge design workbook series" },
  { url: "https://github.com/CRAJKUMARSINGH/M3_Bridge", label: "M3 Bridge", primary: false, desc: "Module 3 bridge design workbook series" },
  { url: "https://github.com/CRAJKUMARSINGH/M2_Bridge", label: "M2 Bridge", primary: false, desc: "Module 2 bridge design workbook series" },
  { url: "https://github.com/CRAJKUMARSINGH/D4_Bridge", label: "D4 Bridge", primary: false, desc: "D-series bridge design — variant 4" },
  { url: "https://github.com/CRAJKUMARSINGH/D3_Bridge", label: "D3 Bridge", primary: false, desc: "D-series bridge design — variant 3" },
  { url: "https://github.com/CRAJKUMARSINGH/D2_Bridge", label: "D2 Bridge", primary: false, desc: "D-series bridge design — variant 2" },
  { url: "https://github.com/CRAJKUMARSINGH/D1_Bridge", label: "D1 Bridge", primary: false, desc: "D-series bridge design — variant 1" },
  { url: "https://github.com/CRAJKUMARSINGH/Dwg-Dxf-Record-Keeper", label: "DWG-DXF Record Keeper", primary: false, desc: "Drawing and DXF asset record management" },
  { url: "https://github.com/CRAJKUMARSINGH/Bridge-Drawing-Manager", label: "Bridge Drawing Manager", primary: false, desc: "Bridge drawing set organisation and management" },
  { url: "https://github.com/CRAJKUMARSINGH/Bridge_GAD_Yogendra_Borse", label: "Bridge GAD (Yogendra Borse)", primary: false, desc: "General Arrangement Drawings — Yogendra Borse format" },
  { url: "https://github.com/CRAJKUMARSINGH/BridgeCanvas", label: "Bridge Canvas", primary: false, desc: "Canvas-based bridge visualisation tool" },
  { url: "https://github.com/CRAJKUMARSINGH/Bridge-Causeway-Design", label: "Bridge Causeway Design", primary: false, desc: "Causeway and low-level crossing design" },
  { url: "https://github.com/CRAJKUMARSINGH/BridgeDraw", label: "Bridge Draw", primary: false, desc: "Parametric bridge drawing generation" },
  { url: "https://github.com/CRAJKUMARSINGH/BridgeGADdrafter", label: "Bridge GAD Drafter", primary: false, desc: "General Arrangement Drawing drafter utility" },
  { url: "https://github.com/CRAJKUMARSINGH/bridge-plotter-cad", label: "Bridge Plotter CAD", primary: false, desc: "CAD plotter interface for bridge drawings" },
  { url: "https://github.com/CRAJKUMARSINGH/Bridge-Engineering-Staad-uTube", label: "Bridge Engineering STAAD (YouTube)", primary: false, desc: "STAAD.Pro tutorials and bridge engineering videos" },
  { url: "https://github.com/CRAJKUMARSINGH/Raj_Bridge_Design", label: "Raj Bridge Design", primary: false, desc: "Rajasthan state bridge design collection" },
];

function repoName(url: string) {
  return url.split("/").pop()!;
}

function loadState(): Record<string, Record<string, unknown>> {
  try {
    if (existsSync(SYNC_STATE_FILE)) {
      return JSON.parse(readFileSync(SYNC_STATE_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveState(state: Record<string, Record<string, unknown>>) {
  try {
    writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

// GET /api/lfs-sync/repos — list all repos with sync status
router.get("/lfs-sync/repos", (_req, res) => {
  const state = loadState();
  const repos = REPOS.map((repo) => {
    const name = repoName(repo.url);
    const rs = state[name] ?? {};
    return {
      name,
      url: repo.url,
      label: repo.label,
      desc: repo.desc,
      primary: repo.primary,
      exists: existsSync(resolve(GIT_REPOS_DIR, name)),
      status: (rs["status"] as string) ?? "never",
      lastSync: (rs["lastSync"] as string) ?? null,
      lastError: (rs["lastError"] as string) ?? null,
      fileCount: (rs["fileCount"] as number) ?? 0,
      lfsFiles: (rs["lfsFiles"] as number) ?? 0,
      lastCommit: (rs["lastCommit"] as string) ?? null,
    };
  });
  res.json({ repos, reposDir: GIT_REPOS_DIR, stateFile: SYNC_STATE_FILE });
});

// POST /api/lfs-sync/pull — SSE stream: clone/pull + lfs pull
router.post("/lfs-sync/pull", (req, res) => {
  const { repoUrl } = (req.body ?? {}) as { repoUrl?: string };
  const repo = REPOS.find((r) => r.url === repoUrl);
  if (!repo) {
    res.status(400).json({ error: "Unknown repo", available: REPOS.map((r) => r.url) });
    return;
  }

  const name = repoName(repo.url);
  const localPath = resolve(GIT_REPOS_DIR, name);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (ev: string, data: unknown) =>
    res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`);

  const run = (cmd: string, args: string[], cwd: string): Promise<number> =>
    new Promise((ok) => {
      send("cmd", { line: `$ ${cmd} ${args.join(" ")}` });
      const p = spawn(cmd, args, {
        cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_LFS_SKIP_SMUDGE: "0" },
      });
      const handle = (d: Buffer) =>
        d.toString().split("\n").filter(Boolean).forEach((l) => send("log", { line: l }));
      p.stdout.on("data", handle);
      p.stderr.on("data", handle);
      p.on("close", (c) => ok(c ?? 0));
    });

  const doSync = async () => {
    const state = loadState();
    const rs: Record<string, unknown> = state[name] ?? {};
    rs["status"] = "syncing";
    state[name] = rs;
    saveState(state);

    try {
      // 1 — ensure git lfs is active
      send("phase", { n: 1, total: 4, label: "Initialising Git LFS" });
      await run("git", ["lfs", "install"], GIT_REPOS_DIR);

      // 2 — clone or pull
      if (!existsSync(localPath)) {
        send("phase", { n: 2, total: 4, label: `Cloning ${name} (shallow)` });
        const code = await run("git", ["clone", "--depth=1", repo.url, name], GIT_REPOS_DIR);
        if (code !== 0) throw new Error(`git clone exited with code ${code}`);
      } else {
        send("phase", { n: 2, total: 4, label: `Fetching latest commits for ${name}` });
        await run("git", ["fetch", "--all", "--prune"], localPath);
        // try main then master
        const code = await run("git", ["reset", "--hard", "origin/main"], localPath);
        if (code !== 0) await run("git", ["reset", "--hard", "origin/master"], localPath);
      }

      // 3 — LFS pull
      send("phase", { n: 3, total: 4, label: "git lfs pull — downloading binary assets" });
      const lfscode = await run("git", ["lfs", "pull"], localPath);
      if (lfscode !== 0) {
        send("warn", { line: "LFS pull returned non-zero — some files may remain as pointer stubs" });
      }

      // 4 — inventory
      send("phase", { n: 4, total: 4, label: "Counting files and building inventory" });
      let fileCount = 0, lfsFiles = 0, lastCommit = "";
      try { fileCount = parseInt(execSync(`find "${localPath}" -not -path '*/.git/*' -type f | wc -l`).toString().trim(), 10); } catch {}
      try { lfsFiles = parseInt(execSync(`git -C "${localPath}" lfs ls-files 2>/dev/null | wc -l`).toString().trim(), 10); } catch {}
      try { lastCommit = execSync(`git -C "${localPath}" log -1 --pretty=format:"%h  %ai  %s"`, { encoding: "utf8" }).trim(); } catch {}

      send("log", { line: `Repository inventory: ${fileCount} files total, ${lfsFiles} tracked by Git LFS` });
      send("log", { line: `Latest commit: ${lastCommit || "(unknown)"}` });

      rs["status"] = "ok";
      rs["lastSync"] = new Date().toISOString();
      rs["lastError"] = null;
      rs["fileCount"] = fileCount;
      rs["lfsFiles"] = lfsFiles;
      rs["lastCommit"] = lastCommit;
      state[name] = rs;
      saveState(state);
      send("done", { success: true, fileCount, lfsFiles, lastCommit });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rs["status"] = "error";
      rs["lastError"] = msg;
      rs["lastSync"] = new Date().toISOString();
      state[name] = rs;
      saveState(state);
      send("error", { line: `FATAL: ${msg}` });
      send("done", { success: false, error: msg });
    }
    res.end();
  };

  doSync();
});

// GET /api/lfs-sync/status — quick JSON status for all repos
router.get("/lfs-sync/status", (_req, res) => {
  const state = loadState();
  const summary = REPOS.map((repo) => {
    const name = repoName(repo.url);
    const rs = state[name] ?? {};
    return { name, status: rs["status"] ?? "never", lastSync: rs["lastSync"] ?? null };
  });
  const ok = summary.filter((r) => r.status === "ok").length;
  const never = summary.filter((r) => r.status === "never").length;
  const errors = summary.filter((r) => r.status === "error").length;
  res.json({ total: REPOS.length, ok, never, errors, repos: summary });
});

export default router;

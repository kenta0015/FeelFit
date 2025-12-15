// lib/workoutEngine.ts
// Minimal global Workout Engine + unified event wiring.
// Events: "feelFit:workout-start|pause|resume|finish" with detail.origin (string) and optional detail.totalSec (number).
// - Singleton on globalThis.__feelFit.engine (never override if already present).
// - Hard reset helper: window.__ffHardReset()

type TickFn = () => void;

function nowSec(): number { return Math.floor(Date.now() / 1000); }
function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }

function getGlobal(): any {
  // No "as" assertion
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof window !== "undefined") return (window as any);
  return {};
}

function ensureNamespace(g: any): any {
  g.__feelFit = g.__feelFit || {};
  return g.__feelFit;
}

function createEngine(): any {
  let totalSec: number = 600;        // default 10 min
  let remainSec: number = 600;
  let running = false;
  let lastTickAt = nowSec();
  let timerId: any = null;
  const tickSubs: TickFn[] = [];

  function notifyTick(): void {
    for (let i = 0; i < tickSubs.length; i++) {
      try { tickSubs[i](); } catch (_) {}
    }
  }

  function clearTimer(): void {
    if (timerId != null) { try { clearInterval(timerId); } catch (_) {} }
    timerId = null;
  }

  function startCount(): void {
    clearTimer();
    // coarse 250ms tick; time computed by wall clock
    timerId = setInterval(() => {
      if (!running) return;
      const t = nowSec();
      const delta = t - lastTickAt;
      if (delta > 0) {
        remainSec = clamp(remainSec - delta, 0, totalSec);
        lastTickAt = t;
        notifyTick();
        if (remainSec <= 0) {
          running = false;
          clearTimer();
          // emit finish for anyone interested
          try {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("feelFit:workout-finish", { detail: { origin: "engine", ts: Date.now() } }));
            }
          } catch (_) {}
        }
      }
    }, 250);
  }

  const api = {
    // Engine API (no async needed, but keep signature simple)
    start: (opt?: { totalSec?: number }) => {
      const t = opt && typeof opt.totalSec === "number" && opt.totalSec > 0 ? Math.floor(opt.totalSec) : totalSec;
      totalSec = t;
      remainSec = t;
      running = true;
      lastTickAt = nowSec();
      startCount();
      notifyTick();
    },
    restart: (opt?: { totalSec?: number }) => {
      const t = opt && typeof opt.totalSec === "number" && opt.totalSec > 0 ? Math.floor(opt.totalSec) : totalSec;
      totalSec = t;
      remainSec = t;
      running = true;
      lastTickAt = nowSec();
      startCount();
      notifyTick();
    },
    pause: () => {
      running = false;
      clearTimer();
      notifyTick();
    },
    resume: () => {
      if (remainSec <= 0) return;
      running = true;
      lastTickAt = nowSec();
      startCount();
      notifyTick();
    },
    stop: () => {
      running = false;
      remainSec = 0;
      clearTimer();
      notifyTick();
    },

    // Info
    getTotalSeconds: () => totalSec,
    getRemainingSeconds: () => remainSec,
    isRunning: () => running,

    // Plan setter (optional)
    setTotalSeconds: (sec: number) => {
      const v = Math.floor(Math.max(1, sec || 0));
      totalSec = v;
      if (remainSec > v) remainSec = v;
      notifyTick();
    },

    // Tick subscription
    onTick: (fn: TickFn) => {
      if (typeof fn !== "function") return () => {};
      tickSubs.push(fn);
      return () => {
        const i = tickSubs.indexOf(fn);
        if (i >= 0) tickSubs.splice(i, 1);
      };
    },
  };

  return api;
}

function attachEventWiring(engine: any): void {
  const g = getGlobal();
  const ns = ensureNamespace(g);

  // guard: only once
  if (ns.__engineEventWired) return;
  ns.__engineEventWired = true;

  // single-flight guard for start spam
  let lastStartAt = 0;

  function onStart(ev: any): void {
    const d = ev && ev.detail ? ev.detail : {};
    const t = typeof d.totalSec === "number" && d.totalSec > 0 ? Math.floor(d.totalSec) : undefined;
    const now = Date.now();
    if (now - lastStartAt < 300) return;
    lastStartAt = now;

    // Always start from 0:00
    engine.restart({ totalSec: t });
  }

  function onPause(): void { engine.pause(); }
  function onResume(): void { engine.resume(); }
  function onFinish(): void { engine.stop(); }

  try { window.addEventListener("feelFit:workout-start", onStart as any); } catch (_) {}
  try { window.addEventListener("feelFit:workout-pause", onPause as any); } catch (_) {}
  try { window.addEventListener("feelFit:workout-resume", onResume as any); } catch (_) {}
  try { window.addEventListener("feelFit:workout-finish", onFinish as any); } catch (_) {}
}

function attachHardReset(engine: any): void {
  const g = getGlobal();
  // Developer hard reset hook (keeps app recoverable during weird states)
  (g as any).__ffHardReset = function(): void {
    try {
      // stop engine
      if (engine && typeof engine.stop === "function") engine.stop();
    } catch (_) {}

    // try stop mixer if exists
    try {
      const mx = (g as any).__ffMixer;
      if (mx && mx.audio) {
        try { mx.audio.pause(); } catch(_) {}
        try { mx.audio.src = ""; } catch(_) {}
      }
      if (mx && Array.isArray(mx.tracks)) {
        try { mx.tracks.length = 0; } catch(_) {}
      }
      if (mx && mx.state) {
        try { mx.state.isReady = false; } catch(_) {}
      }
    } catch (_) {}

    // localStorage cleanups (non-destructive)
    try { localStorage.removeItem("healing.selection.v1"); } catch(_) {}
    try { localStorage.removeItem("healing.shuffle.v1"); } catch(_) {}
    try { localStorage.removeItem("mixer.volumeA.v1"); } catch(_) {}

    // emit finish for any listeners expecting “idle”
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("feelFit:workout-finish", { detail: { origin: "hard-reset", ts: Date.now() } }));
      }
    } catch(_) {}

    try { console.log("[FORCE RESET] done"); } catch(_) {}
  };
}

// ---- bootstrap (idempotent) ----
(function bootstrap(){
  const g = getGlobal();
  const ns = ensureNamespace(g);

  if (!ns.engine) {
    ns.engine = createEngine();
  }
  attachEventWiring(ns.engine);
  attachHardReset(ns.engine);
})();

export {}; // side-effect module (no default export)

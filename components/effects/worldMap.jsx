"use client";

// 访客地图：点阵 3D 地球 / 点阵平面地图两种视图 + 国家排行榜。
// 不再用 ECharts 和 1MB 的 world.json：陆地是 lib/land-mask.ts 里 8KB 的点阵，canvas 自己画。
// 数据来自 /api/stats/countries（已合并旧写法并带好坐标）。

import { useEffect, useMemo, useRef, useState } from "react";
import DataManager from "@/lib/data-manager";
import { isLand } from "@/lib/land-mask";
import styles from "./AudienceMap.module.css";

const DAY = 864e5;
const INK = "244,244,242";
const OK = "159,216,164";
const GRID = { latTop: 78, latBot: -58, step: 2.5 };

function ago(ms) {
  const m = Math.floor(ms / 6e4);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

const markerRadius = (v) => 1.6 + Math.log10(v + 1) * 2.6;

// 地球上的陆地点：斐波那契球面均匀取点，再用陆地点阵过滤（只算一次）
let globePoints = null;
function getGlobePoints() {
  if (globePoints) return globePoints;
  const N = 16000;
  const ga = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const t = ga * i;
    const lat = Math.asin(y);
    const lng = Math.atan2(Math.sin(t) * r, Math.cos(t) * r);
    if (isLand((lat * 180) / Math.PI, (lng * 180) / Math.PI)) pts.push([lat, lng]);
  }
  globePoints = pts;
  return pts;
}

// 平面点阵：每个陆地格子离访客国家越近越亮
function buildGridCells(points, maxV) {
  const { latTop, latBot, step } = GRID;
  const cols = 360 / step;
  const rows = (latTop - latBot) / step;
  const cells = [];
  const maxLog = Math.log10(maxV + 1) || 1;
  for (let j = 0; j < rows; j++) {
    const lat = latTop - (j + 0.5) * step;
    for (let i = 0; i < cols; i++) {
      const lng = -180 + (i + 0.5) * step;
      if (!isLand(lat, lng)) continue;
      let heat = 0;
      for (const d of points) {
        const dl = lat - d.lat;
        const dn = ((lng - d.lng + 540) % 360) - 180;
        const dist = dl * dl + dn * dn;
        const reach = 18 + Math.log10(d.v + 1) * 40;
        if (dist < reach) {
          heat = Math.max(heat, (1 - dist / reach) * (0.35 + (Math.log10(d.v + 1) / maxLog) * 0.65));
        }
      }
      cells.push([i, j, heat]);
    }
  }
  return { cells, cols, rows };
}

// 接口新旧两种格式都能读（旧缓存里没有坐标，只是先不画点）
function normalize(rows, now) {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.country && r.count > 0)
    .map((r) => {
      const ts = Date.parse(r.lastVisit || r.lastUpdated) || 0;
      return {
        key: r.code || r.country,
        name: r.country,
        code: r.code || r.country.slice(0, 2).toUpperCase(),
        v: r.count,
        ts,
        age: now - ts,
        fresh: now - ts < 7 * DAY,
        lat: typeof r.lat === "number" ? r.lat : null,
        lng: typeof r.lng === "number" ? r.lng : null,
      };
    })
    .sort((a, b) => b.v - a.v);
}

const AudienceMap = () => {
  const [raw, setRaw] = useState(() => DataManager.getInstance().getCountries() || []);
  const [mode, setMode] = useState("globe");
  const [order, setOrder] = useState("top");
  const [expanded, setExpanded] = useState(false);
  const [focusKey, setFocusKey] = useState(null);
  const [now] = useState(() => Date.now());

  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const live = useRef({ mode: "globe", focus: null, hover: null, points: [], grid: null });

  useEffect(() => {
    let alive = true;
    fetch("/api/stats/countries")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!alive) return;
        DataManager.getInstance().saveCountries(data);
        setRaw(data);
      })
      .catch((err) => console.error("Error fetching countries:", err));
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => normalize(raw, now), [raw, now]);
  const total = useMemo(() => data.reduce((s, d) => s + d.v, 0), [data]);
  const latest = useMemo(() => data.reduce((a, b) => (!a || b.ts > a.ts ? b : a), null), [data]);
  const maxV = data[0]?.v || 1;

  // 动画循环从 ref 里读最新状态，不随 React 渲染重启
  useEffect(() => {
    const L = live.current;
    L.points = data.filter((d) => d.lat !== null);
    L.grid = null;
    L.maxV = maxV;
    L.focus = L.points.find((d) => d.key === focusKey) || null;
  }, [data, maxV, focusKey]);

  useEffect(() => {
    live.current.mode = mode;
  }, [mode]);

  useEffect(() => {
    const stage = stageRef.current;
    const cv = canvasRef.current;
    const tip = tipRef.current;
    if (!stage || !cv || !tip) return;
    const ctx = cv.getContext("2d");
    const L = live.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gp = getGlobePoints();

    let W = 0;
    let H = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = stage.clientWidth;
      H = stage.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // 起始角度：美国在左边一点，地球慢慢往右转
    let rot = (98.5 * Math.PI) / 180 - 0.45;
    let tilt = 0.42;
    let tRot = rot;
    let tTilt = tilt;
    let lastFocus = null;
    const spin = reduce ? 0 : 0.0016;
    let drag = null;
    let onScreen = [];

    const project = (lat, lng) => {
      const l = lng + rot;
      const cl = Math.cos(lat);
      const x = cl * Math.sin(l);
      const y = Math.sin(lat);
      const z = cl * Math.cos(l);
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      return [x, y * ct - z * st, y * st + z * ct];
    };

    const drawMarker = (d, px, py, r, z, t) => {
      const on = L.focus === d || L.hover === d;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 3.2);
      glow.addColorStop(0, `rgba(${INK},${0.28 * z})`);
      glow.addColorStop(1, `rgba(${INK},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${INK},${0.55 + 0.45 * z})`;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1.4, r * 0.55), 0, Math.PI * 2);
      ctx.fill();
      if (d.fresh) {
        const p = reduce ? 0.5 : (t / 1600 + (d.ts % 1000) / 1000) % 1;
        ctx.strokeStyle = `rgba(${OK},${(1 - p) * 0.9 * z})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.8 + p * r * 2.4 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (on) {
        ctx.strokeStyle = `rgb(${INK})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.55 + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${INK},.35)`;
        ctx.beginPath();
        ctx.moveTo(px - r - 14, py); ctx.lineTo(px - r - 6, py);
        ctx.moveTo(px + r + 6, py); ctx.lineTo(px + r + 14, py);
        ctx.moveTo(px, py - r - 14); ctx.lineTo(px, py - r - 6);
        ctx.moveTo(px, py + r + 6); ctx.lineTo(px, py + r + 14);
        ctx.stroke();
      }
    };

    const drawGlobe = (t) => {
      const R = Math.min(W, H) * 0.43;
      const cx = W / 2;
      const cy = H / 2 + 4;
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
      atmo.addColorStop(0, `rgba(${INK},.07)`);
      atmo.addColorStop(1, `rgba(${INK},0)`);
      ctx.fillStyle = atmo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#08080a";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${INK},.08)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (const [la, lo] of gp) {
        const [x, y, z] = project(la, lo);
        if (z <= 0) continue;
        ctx.fillStyle = `rgba(170,170,166,${0.22 + z * 0.7})`;
        const s = 1.1 + z * 1.1;
        ctx.fillRect(cx + x * R - s / 2, cy - y * R - s / 2, s, s);
      }
      onScreen = [];
      for (let i = L.points.length - 1; i >= 0; i--) {
        const d = L.points[i];
        const [x, y, z] = project((d.lat * Math.PI) / 180, (d.lng * Math.PI) / 180);
        if (z <= 0.02) continue;
        const px = cx + x * R;
        const py = cy - y * R;
        const r = markerRadius(d.v) * (0.7 + 0.3 * z);
        drawMarker(d, px, py, r, z, t);
        onScreen.push({ d, x: px, y: py, r });
      }
    };

    const drawGrid = (t) => {
      if (!L.grid) L.grid = buildGridCells(L.points, L.maxV || 1);
      const { cells, cols, rows } = L.grid;
      const { latTop, step } = GRID;
      const cell = Math.min(W / cols, (H - 20) / rows);
      const ox = (W - cols * cell) / 2;
      const oy = (H - rows * cell) / 2;
      for (const [i, j, heat] of cells) {
        ctx.fillStyle = heat > 0 ? `rgba(${INK},${0.16 + heat * 0.55})` : "rgba(138,138,134,.22)";
        ctx.beginPath();
        ctx.arc(ox + (i + 0.5) * cell, oy + (j + 0.5) * cell, cell * (0.26 + heat * 0.16), 0, Math.PI * 2);
        ctx.fill();
      }
      onScreen = [];
      for (let k = L.points.length - 1; k >= 0; k--) {
        const d = L.points[k];
        const px = ox + ((d.lng + 180) / step) * cell;
        const py = oy + ((latTop - d.lat) / step) * cell;
        const r = markerRadius(d.v) * 0.85;
        drawMarker(d, px, py, r, 1, t);
        onScreen.push({ d, x: px, y: py, r });
      }
    };

    const showTip = (m) => {
      if (!m) {
        tip.hidden = true;
        return;
      }
      tip.hidden = false;
      tip.style.left = `${m.x}px`;
      tip.style.top = `${m.y - m.r * 0.4}px`;
      const key = `${m.d.key}:${m.d.v}`;
      if (tip.dataset.key !== key) {
        tip.dataset.key = key;
        tip.firstChild.textContent = m.d.name;
        tip.lastChild.textContent = `${m.d.v.toLocaleString("en-US")} visit${m.d.v > 1 ? "s" : ""} · ${ago(m.d.age)} ago`;
      }
    };

    let raf = 0;
    const frame = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (L.mode === "globe") {
        if (L.focus !== lastFocus) {
          lastFocus = L.focus;
          if (L.focus) {
            const target = -(L.focus.lng * Math.PI) / 180;
            const diff = ((((target - rot) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            tRot = rot + diff;
            tTilt = Math.max(-1.1, Math.min(1.1, (L.focus.lat * Math.PI) / 180));
          }
        }
        if (!drag) {
          if (L.focus) {
            rot += (tRot - rot) * 0.08;
            tilt += (tTilt - tilt) * 0.08;
          } else {
            rot += spin;
          }
        }
        drawGlobe(t);
      } else {
        drawGrid(t);
      }
      const target = L.hover || L.focus;
      showTip(target ? onScreen.find((m) => m.d === target) : null);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const pick = (e) => {
      const b = stage.getBoundingClientRect();
      const x = e.clientX - b.left;
      const y = e.clientY - b.top;
      let best = null;
      let bd = Infinity;
      for (const m of onScreen) {
        const dd = Math.hypot(m.x - x, m.y - y);
        if (dd < Math.max(12, m.r + 6) && dd < bd) {
          bd = dd;
          best = m;
        }
      }
      return best;
    };
    const onDown = (e) => {
      if (L.mode !== "globe") return;
      drag = { x: e.clientX, y: e.clientY, r: rot, t: tilt, moved: false };
      stage.setPointerCapture(e.pointerId);
      stage.dataset.dragging = "true";
    };
    const onMove = (e) => {
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        rot = drag.r + dx * 0.008;
        tilt = Math.max(-1.1, Math.min(1.1, drag.t + dy * 0.006));
        tRot = rot;
        tTilt = tilt;
        return;
      }
      const m = pick(e);
      L.hover = m ? m.d : null;
      stage.dataset.pointer = m ? "true" : "false";
    };
    const onUp = (e) => {
      const moved = drag && drag.moved;
      drag = null;
      delete stage.dataset.dragging;
      if (!moved) {
        const m = pick(e);
        setFocusKey((k) => (m ? (k === m.d.key ? null : m.d.key) : null));
      }
    };
    const onLeave = () => {
      L.hover = null;
    };
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const list = useMemo(
    () => [...data].sort(order === "top" ? (a, b) => b.v - a.v : (a, b) => b.ts - a.ts),
    [data, order]
  );
  const shown = expanded ? list : list.slice(0, 6);
  const maxLog = Math.log10(maxV + 1) || 1;

  return (
    <div className={styles.root}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.k}>Visits</span>
          <span className={styles.v}>{total.toLocaleString("en-US")}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.k}>Countries</span>
          <span className={styles.v}>{data.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.k}>Last visit</span>
          <span className={styles.v}>
            {latest ? (
              <>
                {ago(latest.age)} <small>{latest.code}</small>
              </>
            ) : (
              "–"
            )}
          </span>
        </div>
      </div>

      <div className={styles.bar}>
        <div className={styles.seg} role="group" aria-label="Map style">
          <button type="button" aria-pressed={mode === "globe"} onClick={() => setMode("globe")}>
            Globe
          </button>
          <button type="button" aria-pressed={mode === "grid"} onClick={() => setMode("grid")}>
            Dot grid
          </button>
        </div>
        <span className={styles.hint}>{mode === "globe" ? "drag to spin" : "tap a dot"}</span>
      </div>

      <div ref={stageRef} className={styles.stage} data-mode={mode}>
        <canvas ref={canvasRef} className={styles.canvas} aria-label="Visitor map" role="img" />
        <div ref={tipRef} className={styles.tip} hidden>
          <span className={styles.tipName} />
          <span className={styles.tipMeta} />
        </div>
      </div>

      <div className={styles.legend}>
        <span><i className={styles.land} />land</span>
        <span><i className={styles.dot} />visitors · size by visits</span>
        <span><i className={styles.ring} />visited in the last 7 days</span>
      </div>

      <div className={styles.ledger}>
        <div className={styles.bar}>
          <div className={styles.seg} role="group" aria-label="Sort countries">
            <button type="button" aria-pressed={order === "top"} onClick={() => setOrder("top")}>
              Top
            </button>
            <button type="button" aria-pressed={order === "recent"} onClick={() => setOrder("recent")}>
              Recent
            </button>
          </div>
          <span className={styles.hint}>{order === "top" ? "bar = log scale" : "newest first"}</span>
        </div>

        {data.length === 0 ? (
          <p className={styles.empty}>No visits recorded yet.</p>
        ) : (
          <ul className={styles.rows}>
            {shown.map((d, i) => {
              const toggle = () => setFocusKey((k) => (k === d.key ? null : d.key));
              return (
                <li
                  key={d.key}
                  tabIndex={0}
                  className={`${styles.row} ${d.fresh ? styles.fresh : ""} ${focusKey === d.key ? styles.on : ""}`}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  onMouseEnter={() => { live.current.hover = live.current.points.find((p) => p.key === d.key) || null; }}
                  onMouseLeave={() => { live.current.hover = null; }}
                >
                  <span className={styles.rk}>{i + 1}</span>
                  <span className={styles.cc}>{d.code}</span>
                  <span className={styles.nm}>
                    <span>{d.name}</span>
                    <span className={styles.track}>
                      <i style={{ width: `${Math.max(2, (Math.log10(d.v + 1) / maxLog) * 100)}%` }} />
                    </span>
                  </span>
                  <span className={styles.ct}>{d.v.toLocaleString("en-US")}</span>
                  <span className={styles.ago}>{ago(d.age)}</span>
                </li>
              );
            })}
          </ul>
        )}

        {data.length > 6 && (
          <button type="button" className={styles.more} onClick={() => setExpanded((x) => !x)}>
            {expanded ? "Show less" : `All ${data.length} countries`}
          </button>
        )}
      </div>
    </div>
  );
};

export default AudienceMap;

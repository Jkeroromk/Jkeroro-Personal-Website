"use client";

/**
 * 全屏 3D Showroom（参考 3DVista 的汽车展示页）
 * - 左侧：分区导航（镜头飞到预设机位，背景有大号水印标题）
 * - 右侧：车漆 / 轮毂 / 车灯
 * - 左下：白天/夜晚、隐藏界面、自动旋转
 * - 鼠标拖拽环绕、滚轮缩放（有距离和角度限制）；Esc 或右上角关闭
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Disc3, Eye, EyeOff, Lightbulb, Moon, Paintbrush, RotateCw, Sun, X } from "lucide-react";
import { createCarScene, PAINTS, RIMS, VIEWS } from "./carScene";

const SECTION_LABELS = {
  overview: "Overview",
  specs: "Specifications",
  wheels: "Wheels",
  lights: "Lights",
  rear: "Rear",
};

const SECTION_CAPTIONS = {
  overview: "Drag to orbit · scroll to zoom",
  wheels: "Pick a wheel finish on the right",
  lights: "Headlights on",
  rear: "JKERORO",
};

// 991.1 Carrera 4S Coupé（2012–2015）出厂数据，手动挡
const SPECS = [
  ["Engine", "3.8 L flat-six"],
  ["Power", "400 PS / 294 kW"],
  ["Torque", "440 Nm"],
  ["0–100 km/h", "4.5 s"],
  ["Top speed", "299 km/h"],
  ["Drive", "All-wheel drive"],
  ["Gearbox", "7-speed manual / PDK"],
  ["Weight", "1,445 kg (DIN)"],
];

const BACKGROUNDS = {
  night: "radial-gradient(120% 100% at 30% 15%, #8d8d92 0%, #5f5f64 45%, #2c2c30 100%)",
  day: "radial-gradient(120% 100% at 50% 20%, #ffffff 0%, #ececee 45%, #c9c9ce 100%)",
};

function ToolButton({ active, label, onClick, children, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex items-center justify-center w-10 h-10 rounded-full border backdrop-blur-md transition-colors ${
        dark
          ? active
            ? "bg-white/25 border-white/50 text-white"
            : "bg-black/20 border-white/20 text-white/85 hover:bg-white/15"
          : active
            ? "bg-black/80 border-black/80 text-white"
            : "bg-white/60 border-black/10 text-black/75 hover:bg-white/90"
      }`}
    >
      {children}
    </button>
  );
}

function Swatches({ options, value, onChange, dark }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-2 border backdrop-blur-md ${
        dark ? "bg-black/30 border-white/15" : "bg-white/70 border-black/10"
      }`}
    >
      {Object.entries(options).map(([key, option]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-label={option.label}
          title={option.label}
          aria-pressed={value === key}
          className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
            value === key ? (dark ? "ring-2 ring-white ring-offset-2 ring-offset-black/40" : "ring-2 ring-black ring-offset-2") : ""
          } ${dark ? "border-white/40" : "border-black/20"}`}
          style={{ background: option.swatch }}
        />
      ))}
      <span className={`ml-1 text-xs whitespace-nowrap ${dark ? "text-white/80" : "text-black/70"}`}>{options[value]?.label}</span>
    </div>
  );
}

export default function Showroom({ onClose }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const closeRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState("overview");
  const [paint, setPaint] = useState("black");
  const [rim, setRim] = useState("white");
  const [lights, setLights] = useState(false);
  const [day, setDay] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [uiHidden, setUiHidden] = useState(false);
  const [panel, setPanel] = useState(null); // "paint" | "rim" | null

  const dark = !day;

  // ---- 场景 ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = createCarScene(canvas, {
      mode: "showroom",
      onReady: () => setReady(true),
      onProgress: (p) => setProgress(p),
      onError: () => setFailed(true),
    });
    sceneRef.current = controller;
    return () => {
      controller.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current?.setPaint(paint), [paint]);
  useEffect(() => sceneRef.current?.setRim(rim), [rim]);
  useEffect(() => sceneRef.current?.setLights(lights), [lights]);
  useEffect(() => sceneRef.current?.setDay(day), [day]);
  useEffect(() => sceneRef.current?.setAutoRotate(autoRotate), [autoRotate]);

  const goTo = useCallback((name) => {
    setView(name);
    setPanel(name === "wheels" ? "rim" : null);
    if (name === "lights") setLights(true);
    sceneRef.current?.goTo(name);
  }, []);

  // ---- Esc 关闭、锁定页面滚动 ----
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const textMain = dark ? "text-white" : "text-black";
  const textSub = dark ? "text-white/70" : "text-black/60";
  const showUi = ready && !uiHidden;

  const content = (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Porsche 911 Showroom"
      className="fixed inset-0 z-[200] overflow-hidden select-none"
      style={{ background: BACKGROUNDS[day ? "day" : "night"], transition: "background 0.6s ease" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* 大号水印标题（在车后面） */}
      <AnimatePresence mode="wait">
        {ready && (
          <motion.div
            key={view}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-[14%] sm:top-[10%] text-center font-black uppercase leading-none tracking-tight whitespace-nowrap ${
              dark ? "text-white/[0.09]" : "text-black/[0.06]"
            }`}
            style={{ fontSize: "clamp(56px, 13vw, 220px)" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.6 }}
          >
            {SECTION_LABELS[view]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D 画布 */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className={`block w-full h-full transition-opacity duration-1000 cursor-grab active:cursor-grabbing ${ready ? "opacity-100" : "opacity-0"}`}
          style={{ touchAction: "none" }}
        />
      </div>

      {/* 加载 */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] tracking-[0.4em] uppercase text-white/70">{failed ? "Failed to load" : "Entering showroom"}</p>
            {!failed && (
              <div className="w-48 h-px bg-white/20 overflow-hidden">
                <div className="h-full bg-white transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右上角：关闭（始终显示） */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close showroom"
        className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full border backdrop-blur-md transition-colors ${
          dark ? "bg-black/20 border-white/25 text-white hover:bg-white/15" : "bg-white/60 border-black/10 text-black hover:bg-white"
        }`}
      >
        <X className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {showUi && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 左上：标题 */}
            <motion.div
              className="absolute top-5 left-5 sm:top-8 sm:left-10"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h2 className={`font-black uppercase tracking-tight leading-none text-2xl sm:text-4xl ${textMain}`}>Porsche 911</h2>
              <p className={`mt-1 font-semibold uppercase tracking-wide text-[11px] sm:text-sm ${textMain}`}>
                Carrera 4S · {PAINTS[paint].label}
              </p>
            </motion.div>

            {/* 左侧：分区导航（桌面） */}
            <nav className="pointer-events-auto absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
              {VIEWS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => goTo(name)}
                  className={`group flex items-center gap-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    view === name ? textMain : dark ? "text-white/60 hover:text-white" : "text-black/50 hover:text-black"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full border flex items-center justify-center ${dark ? "border-white/70" : "border-black/50"}`}
                  >
                    {view === name && <span className={`w-1.5 h-1.5 rounded-full ${dark ? "bg-white" : "bg-black"}`} />}
                  </span>
                  {SECTION_LABELS[name]}
                </button>
              ))}
            </nav>

            {/* 右侧：工具栏 */}
            <div className="pointer-events-auto absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-3">
              {[
                { key: "paint", label: "Paint", icon: <Paintbrush className="w-[18px] h-[18px]" /> },
                { key: "rim", label: "Wheels", icon: <Disc3 className="w-[18px] h-[18px]" /> },
              ].map((tool) => (
                <div key={tool.key} className="flex items-center gap-2">
                  <AnimatePresence>
                    {panel === tool.key && (
                      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                        <Swatches
                          dark={dark}
                          options={tool.key === "paint" ? PAINTS : RIMS}
                          value={tool.key === "paint" ? paint : rim}
                          onChange={tool.key === "paint" ? setPaint : setRim}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <ToolButton dark={dark} label={tool.label} active={panel === tool.key} onClick={() => setPanel(panel === tool.key ? null : tool.key)}>
                    {tool.icon}
                  </ToolButton>
                </div>
              ))}
              <ToolButton dark={dark} label={lights ? "Lights off" : "Lights on"} active={lights} onClick={() => setLights(!lights)}>
                <Lightbulb className="w-[18px] h-[18px]" />
              </ToolButton>
            </div>

            {/* 参数面板 */}
            <AnimatePresence>
              {view === "specs" && (
                <motion.div
                  className={`absolute right-16 sm:right-24 top-1/2 -translate-y-1/2 hidden md:block w-[340px] ${textMain}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">Specifications</h3>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {SPECS.map(([k, v]) => (
                      <div key={k}>
                        <dt className={`text-[10px] uppercase tracking-wider ${textSub}`}>{k}</dt>
                        <dd className="text-base font-bold leading-tight">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className={`mt-4 text-[10px] ${textSub}`}>991.1 Carrera 4S Coupé (2012–2015), factory figures</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 手机：参数面板放在底部 */}
            <AnimatePresence>
              {view === "specs" && (
                <motion.div
                  className={`md:hidden absolute inset-x-4 bottom-28 rounded-2xl p-4 border backdrop-blur-md ${
                    dark ? "bg-black/35 border-white/15 text-white" : "bg-white/75 border-black/10 text-black"
                  }`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                >
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {SPECS.map(([k, v]) => (
                      <div key={k}>
                        <dt className={`text-[9px] uppercase tracking-wider ${textSub}`}>{k}</dt>
                        <dd className="text-sm font-bold leading-tight">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 底部提示 */}
            <AnimatePresence mode="wait">
              {SECTION_CAPTIONS[view] && (
                <motion.p
                  key={view}
                  className={`absolute bottom-24 md:bottom-8 inset-x-0 text-center text-[11px] uppercase tracking-[0.3em] ${textSub}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {SECTION_CAPTIONS[view]}
                </motion.p>
              )}
            </AnimatePresence>

            {/* 手机：分区导航放在底部横排 */}
            <nav className="pointer-events-auto md:hidden absolute inset-x-0 bottom-14 flex gap-2 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
              {VIEWS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => goTo(name)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border backdrop-blur-md ${
                    view === name
                      ? dark
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-black"
                      : dark
                        ? "bg-black/20 text-white/85 border-white/20"
                        : "bg-white/60 text-black/75 border-black/10"
                  }`}
                >
                  {SECTION_LABELS[name]}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 左下：白天/夜晚、隐藏界面、自动旋转（隐藏界面时也保留这一组） */}
      {ready && (
        <div className="absolute left-4 bottom-3 sm:left-10 sm:bottom-8 z-10 flex items-center gap-2">
          <ToolButton dark={dark} label={day ? "Night mode" : "Day mode"} active={false} onClick={() => setDay(!day)}>
            {day ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
          </ToolButton>
          <ToolButton dark={dark} label={uiHidden ? "Show interface" : "Hide interface"} active={uiHidden} onClick={() => setUiHidden(!uiHidden)}>
            {uiHidden ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </ToolButton>
          <ToolButton dark={dark} label={autoRotate ? "Stop rotation" : "Auto rotate"} active={autoRotate} onClick={() => setAutoRotate(!autoRotate)}>
            <RotateCw className="w-[18px] h-[18px]" />
          </ToolButton>
        </div>
      )}

      {/* 出处 */}
      <a
        href="https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf"
        target="_blank"
        rel="noopener noreferrer"
        className={`absolute right-4 bottom-3 sm:right-6 sm:bottom-4 z-10 text-[10px] ${dark ? "text-white/40 hover:text-white/80" : "text-black/40 hover:text-black/80"}`}
      >
        Model: Porsche 911 Carrera 4S · CC BY-SA
      </a>
    </motion.div>
  );

  return createPortal(content, document.body);
}

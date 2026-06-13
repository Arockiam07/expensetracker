import * as React from "react";
import { useRef, useState, useEffect } from "react";

export function GlassTabs({ value, onChange, options, roundedFull = false }) {
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector("[data-active='true']");
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center bg-muted/40 p-1 border backdrop-blur-md ${roundedFull ? "rounded-full" : "rounded-xl"}`}
    >
      {/* Sliding Glass Highlight */}
      {indicatorStyle.width > 0 && (
        <div
          className={`absolute top-1 bottom-1 bg-transparent border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:border-white/15 dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] pointer-events-none ${roundedFull ? "rounded-full" : "rounded-lg"}`}
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
            transition:
              "left 0.38s cubic-bezier(0.25, 1.25, 0.5, 1.15), width 0.32s cubic-bezier(0.25, 1.25, 0.5, 1.15), opacity 0.2s ease",
          }}
        >
          {/* Specularity Reflection Shine */}
          <div
            className={`absolute inset-0 overflow-hidden pointer-events-none ${roundedFull ? "rounded-full" : "rounded-lg"}`}
          >
            <div
              className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/12 to-transparent transition-transform duration-350 ease-out"
              style={{
                transform: `skewX(-20deg) translateX(${indicatorStyle.left * 0.12}px)`,
              }}
            />
          </div>
        </div>
      )}

      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            data-active={isActive}
            onClick={() => onChange(opt.key)}
            className={`relative z-10 px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"} ${roundedFull ? "rounded-full" : "rounded-lg"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

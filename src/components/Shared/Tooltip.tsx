"use client";
import { useState, useRef } from "react";

export function Tooltip({ text }: { text: string }) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top - 12,
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <>
      <span
        ref={iconRef}
        className="tooltip-icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ opacity: visible ? 1 : 0.45, transition: "opacity 0.2s" }}
      >
        ⓘ
      </span>
      {visible && (
        <div
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            backgroundColor: "var(--surface-3)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            padding: "6px 9px",
            borderRadius: "6px",
            fontSize: "11.5px",
            lineHeight: "1.4",
            width: "220px",
            zIndex: 9999,
            whiteSpace: "normal",
            transform: "translateX(-50%) translateY(-100%)",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.04)",
          }}
        >
          {text}
        </div>
      )}
    </>
  );
}

import React from "react";

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, strokeWidth = 1.6, className = "", style }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
    "aria-hidden": true,
  };
  const F = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", className, style, "aria-hidden": true };

  switch (name) {
    case "check": return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "check-circle": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>;
    case "x": return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case "x-circle": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></svg>;
    case "arrow-left": return <svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
    case "arrow-up": return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case "arrow-down": return <svg {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>;
    case "grip": return <svg {...p}><circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" /></svg>;
    case "chevron-right": return <svg {...p}><path d="m9 18 6-6-6-6" /></svg>;
    case "chevron-down": return <svg {...p}><path d="m6 9 6 6 6-6" /></svg>;
    case "play": return <svg {...p}><path d="M7 5v14l11-7-11-7z" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "rocket": return <svg {...p}><path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.7a2 2 0 0 0-3 0Z" /><path d="M9 12a13 13 0 0 1 9-9 13 13 0 0 1-1 9c-1.5 2-4 3.5-5 4l-3-3c.5-1 .5-2 0-1Z" /><path d="M14.5 9.5a1 1 0 1 0 .01-.01Z" /></svg>;
    case "gauge": return <svg {...p}><path d="M12 14a2 2 0 1 0 .01 0" /><path d="m13.5 12.5 3-3" /><path d="M4 18a9 9 0 1 1 16 0" /></svg>;
    case "layers": return <svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>;
    case "story": return <svg {...p}><path d="M5 4h11l3 3v13H5z" /><path d="M9 9h6M9 13h6M9 17h3" /></svg>;
    case "help": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7" /><path d="M12 17h.01" /></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "target": return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>;
    case "flag": return <svg {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>;
    case "lock": return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "users": return <svg {...p}><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M21 19a6 6 0 0 0-4-5.7" /></svg>;
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>;
    case "shield": return <svg {...p}><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" /></svg>;
    case "bulb": return <svg {...p}><path d="M9 18h6M10 21h4" /><path d="M8 14a5 5 0 1 1 8 0c-.7.9-1 1.5-1 3H9c0-1.5-.3-2.1-1-3Z" /></svg>;
    case "link": return <svg {...p}><path d="M10 14a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-6-6l-1 1" /><path d="M14 10a4 4 0 0 0-6-.5l-2 2a4 4 0 0 0 6 6l1-1" /></svg>;
    case "git": return <svg {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="9" r="2.5" /><path d="M6 8.5v7M16 9.5c-2 2-4 2-7 3" /></svg>;
    case "alert": return <svg {...p}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></svg>;
    case "sparkles": return <svg {...p}><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" /><path d="M18 15l.7 1.8L20.5 17.5 18.7 18.2 18 20l-.7-1.8L15.5 17.5 17.3 16.8 18 15Z" /></svg>;
    case "command": return <svg {...p}><path d="M9 6a3 3 0 1 0 3 3h0v6h0a3 3 0 1 0-3-3h6a3 3 0 1 0-3 3V9a3 3 0 1 0 3-3" /></svg>;
    case "send": return <svg {...p}><path d="M4 12 20 4l-6 16-3-7-7-1Z" /></svg>;
    case "download": return <svg {...p}><path d="M12 4v11M7 11l5 4 5-4M5 20h14" /></svg>;
    case "copy": return <svg {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
    case "code": return <svg {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" /></svg>;
    case "inbox": return <svg {...p}><path d="M4 13h4l1.5 3h5L16 13h4" /><path d="M4 13 6 5h12l2 8v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" /></svg>;
    case "mail": return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "slack": return <svg {...p}><rect x="10" y="3" width="4" height="9" rx="2" /><rect x="12" y="10" width="9" height="4" rx="2" /><rect x="10" y="12" width="4" height="9" rx="2" /><rect x="3" y="10" width="9" height="4" rx="2" /></svg>;
    case "notes": return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
    case "transcript": return <svg {...p}><path d="M4 18V6a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><path d="M8 12h2M8 15h5M12 8h1" /></svg>;
    case "text": return <svg {...p}><path d="M5 6h14M5 6V4M9 6v14M7 20h4M14 12h6M17 12v8M15 20h4" /></svg>;
    case "markdown": return <svg {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 15V9l2.5 3L11 9v6M16 9v4m0 0 2-2m-2 2-2-2" /></svg>;
    case "jira": return <svg {...p}><path d="M12 3 5 10l3 3 4-4 4 4 3-3-7-7Z" /><path d="m8 13 4 4 4-4-4 4-4-4Z" /></svg>;
    case "azure": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M7 12h10" /></svg>;
    case "linear": return <svg {...p}><path d="M4 13 11 20M4 9l11 11M6 5l13 13M11 4l9 9" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5" /></svg>;
    case "dot": return <svg {...F}><circle cx="12" cy="12" r="4" /></svg>;
    case "minus": return <svg {...p}><path d="M5 12h14" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "pencil": return <svg {...p}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m13.5 6.5 3 3" /></svg>;
    case "trash": return <svg {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

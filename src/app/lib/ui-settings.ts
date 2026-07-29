import localforage from "localforage";
import { useState, useEffect } from "react";
import { defaultCustomRules } from "./custom-rules";

export interface CustomRule {
  id: string;
  selector: string;
  radius?: string;
  bg?: string;
  color?: string;
  border?: string;
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
}

export interface UiSettings {
  bg: string;
  bgImage: string;
  bgImageStyle?:
    | "cover"
    | "contain"
    | "original"
    | "pattern-sm"
    | "pattern-md"
    | "pattern-lg"
    | "brand-stripes-purple"
    | "brand-stripes-green"
    | "brand-stripes-brown";
  bgImageOpacity?: number;
  accent: string;
  text: string;
  border: string;
  fontSize: string;
  tablePadding: string;
  sidebarPos: "left" | "right";
  radius: string;
  tableRadius?: string;
  customRules?: CustomRule[];
  titleAlign: string;
  tableFont?: string;
  autoSave?: boolean;
  showHelp?: boolean;
  stripeColor1?: string;
  stripeColor2?: string;
  gridLineColor?: string;
  showPivotSubtotals?: boolean;
  showGrandTotals?: boolean;
  showMktCols?: boolean;
  showBusiness?: boolean;
  showL07?: boolean;
  showChargeToCenterMkt?: boolean;
  colWidthPreference?: "narrow" | "normal" | "wide";
  defaultAuditYear?: number;
  tableHeaderBg?: string;
  preset?: string;
}

export interface TastePreset {
  id: string;
  name: string;
  bg: string;
  accent: string;
  text: string;
  border: string;
  stripeColor1: string;
  stripeColor2: string;
  gridLineColor: string;
  tableHeaderBg: string;
  tableFont: string;
  tableRadius: string;
}

export const TASTE_PRESETS: Record<string, TastePreset> = {
  systematic: {
    id: "systematic",
    name: "Mặc định (Systematic Regular)",
    bg: "#F8F7F4",
    accent: "#5D111A",
    text: "#5D111A",
    border: "#E7DBDC",
    stripeColor1: "#F6F4F0",
    stripeColor2: "#F4ECD8",
    gridLineColor: "#E2E8F0",
    tableHeaderBg: "#FAF3E8",
    tableFont: "var(--font-mono)",
    tableRadius: "12px",
  },
  minimalist: {
    id: "minimalist",
    name: "Tối giản (Minimalist Linear Clean)",
    bg: "#FAFAFA",
    accent: "#09090B",
    text: "#18181B",
    border: "#E4E4E7",
    stripeColor1: "#F4F4F5",
    stripeColor2: "#FAFAFA",
    gridLineColor: "rgba(24, 24, 27, 0.05)",
    tableHeaderBg: "#F4F4F5",
    tableFont: "var(--font-inter)",
    tableRadius: "6px",
  },
  soft: {
    id: "soft",
    name: "Cao cấp (Soft Premium DTC)",
    bg: "#FDFBF7",
    accent: "#7A3B2E",
    text: "#3F2A26",
    border: "#EFE8DC",
    stripeColor1: "#FAF3E8",
    stripeColor2: "#FDFBF7",
    gridLineColor: "rgba(63, 42, 38, 0.06)",
    tableHeaderBg: "#FAF0DD",
    tableFont: "var(--font-nunito)",
    tableRadius: "16px",
  },
  neubrutalist: {
    id: "neubrutalist",
    name: "Phá cách (Brutalist Industrial)",
    bg: "#F4ECD8",
    accent: "#000000",
    text: "#000000",
    border: "#000000",
    stripeColor1: "#FEF9EC",
    stripeColor2: "#F4ECD8",
    gridLineColor: "#000000",
    tableHeaderBg: "#C88493",
    tableFont: "var(--font-mono)",
    tableRadius: "0px",
  },
  dark_tech: {
    id: "dark_tech",
    name: "Huyền bí (Dark Tech Midnight)",
    bg: "#09090B",
    accent: "#10B981",
    text: "#F4F4F5",
    border: "#27272A",
    stripeColor1: "#18181B",
    stripeColor2: "#09090B",
    gridLineColor: "rgba(244, 244, 245, 0.08)",
    tableHeaderBg: "#1F2937",
    tableFont: "var(--font-mono)",
    tableRadius: "8px",
  }
};

export const defaultSettings: UiSettings = {
  bg: "#F8F7F4",
  bgImage: "",
  bgImageStyle: "cover",
  bgImageOpacity: 100,
  accent: "#5D111A",
  text: "#5D111A",
  border: "#E7DBDC",
  fontSize: "13px",
  tablePadding: "12px 16px",
  sidebarPos: "left",
  radius: "1.25rem",
  tableRadius: "0px",
  customRules: defaultCustomRules,
  titleAlign: "flex-start|left",
  tableFont: "var(--font-mono)",
  autoSave: true,
  showHelp: true,
  stripeColor1: "#F6F4F0",
  stripeColor2: "#F4ECD8",
  gridLineColor: "#E2E8F0",
  tableHeaderBg: "#FAF3E8",
  showPivotSubtotals: true,
  showGrandTotals: true,
  showMktCols: true,
  showBusiness: true,
  showL07: true,
  colWidthPreference: "normal",
  defaultAuditYear: 2026,
  preset: "systematic",
};

export const UI_SETTINGS_KEY = "PayrollApp_UiSettings_Systematic_v1";

function isValidColor(color: unknown): boolean {
  if (typeof color !== "string") return false;
  const c = color.trim();
  return (
    /^#[0-9A-Fa-f]{3,8}$/.test(c) ||
    c.startsWith("rgba(") ||
    c.startsWith("rgb(") ||
    c === "transparent" ||
    c === "inherit"
  );
}

export function applyUiSettings(settings: UiSettings, previewRule?: Partial<CustomRule>) {
  const root = document.documentElement;

  if (settings.preset === "dark_tech") {
    root.classList.add("dark");
    root.style.setProperty("--card", "#18181B");
    root.style.setProperty("--card-foreground", "#F4F4F5");
    root.style.setProperty("--popover", "#18181B");
    root.style.setProperty("--popover-foreground", "#F4F4F5");
    root.style.setProperty("--muted", "#27272A");
    root.style.setProperty("--muted-foreground", "#A1A1AA");
  } else {
    root.classList.remove("dark");
    root.style.setProperty("--card", "#FFFFFF");
    root.style.setProperty("--card-foreground", settings.text || "#334155");
    root.style.setProperty("--popover", "#FFFFFF");
    root.style.setProperty("--popover-foreground", settings.text || "#334155");
    root.style.setProperty("--muted", "#F1F5F9");
    root.style.setProperty("--muted-foreground", "#64748B");
  }

  if (settings.bg) root.style.setProperty("--background", settings.bg);
  if (settings.text) root.style.setProperty("--foreground", settings.text);
  if (settings.border) {
    root.style.setProperty("--border", settings.border);
    root.style.setProperty("--shadow-hard", `4px 4px 0px ${settings.border}`);
    root.style.setProperty("--shadow-hard-sm", `2px 2px 0px ${settings.border}`);
  }
  if (settings.accent) {
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--primary", settings.accent);
    root.style.setProperty("--ring", settings.accent);
  }

  if (settings.bgImageStyle?.startsWith("brand-stripes-")) {
    root.style.setProperty(
      "--bg-image-opacity",
      ((settings.bgImageOpacity ?? 100) / 100).toString(),
    );
    root.style.setProperty("--bg-image-size", "20px 20px");
    root.style.setProperty("--bg-image-repeat", "repeat");
    root.style.setProperty("--bg-image-attachment", "fixed");

    if (settings.bgImageStyle === "brand-stripes-purple") {
      root.style.setProperty("--bg-image", "var(--pattern-stripes-purple)");
    } else if (settings.bgImageStyle === "brand-stripes-green") {
      root.style.setProperty("--bg-image", "var(--pattern-stripes-green)");
    } else if (settings.bgImageStyle === "brand-stripes-brown") {
      root.style.setProperty("--bg-image", "var(--pattern-stripes-brown)");
    }
  } else if (settings.bgImage) {
    root.style.setProperty("--bg-image", `url(${settings.bgImage})`);
    root.style.setProperty("--bg-image-attachment", "fixed");
    root.style.setProperty(
      "--bg-image-opacity",
      ((settings.bgImageOpacity ?? 100) / 100).toString(),
    );
    if (settings.bgImageStyle === "pattern-sm") {
      root.style.setProperty("--bg-image-size", "50px");
      root.style.setProperty("--bg-image-repeat", "repeat");
      root.style.setProperty("--bg-image-position", "top left");
    } else if (settings.bgImageStyle === "pattern-md") {
      root.style.setProperty("--bg-image-size", "100px");
      root.style.setProperty("--bg-image-repeat", "repeat");
      root.style.setProperty("--bg-image-position", "top left");
    } else if (settings.bgImageStyle === "pattern-lg") {
      root.style.setProperty("--bg-image-size", "200px");
      root.style.setProperty("--bg-image-repeat", "repeat");
      root.style.setProperty("--bg-image-position", "top left");
    } else if (settings.bgImageStyle === "contain") {
      root.style.setProperty("--bg-image-size", "contain");
      root.style.setProperty("--bg-image-repeat", "no-repeat");
      root.style.setProperty("--bg-image-position", "center");
    } else if (settings.bgImageStyle === "original") {
      root.style.setProperty("--bg-image-size", "auto");
      root.style.setProperty("--bg-image-repeat", "no-repeat");
      root.style.setProperty("--bg-image-position", "center");
    } else {
      root.style.setProperty("--bg-image-size", "cover");
      root.style.setProperty("--bg-image-repeat", "no-repeat");
      root.style.setProperty("--bg-image-position", "center");
    }
  } else {
    root.style.removeProperty("--bg-image");
    root.style.removeProperty("--bg-image-size");
    root.style.removeProperty("--bg-image-repeat");
    root.style.removeProperty("--bg-image-position");
    root.style.removeProperty("--bg-image-attachment");
    root.style.setProperty("--bg-image-opacity", "0");
  }

  if (settings.accent) {
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--primary", settings.accent);
    root.style.setProperty("--ring", settings.accent);
  }
  if (settings.text) {
    root.style.setProperty("--foreground", settings.text);
  }
  if (settings.border) {
    root.style.setProperty("--border", settings.border);
    root.style.setProperty("--shadow-hard", `4px 4px 0px ${settings.border}`);
    root.style.setProperty(
      "--shadow-hard-sm",
      `2px 2px 0px ${settings.border}`,
    );
  }
  if (settings.fontSize)
    root.style.setProperty("--font-size", settings.fontSize);
  if (settings.tableFont)
    root.style.setProperty("--font-table", settings.tableFont);
  if (settings.tablePadding)
    root.style.setProperty("--table-padding", settings.tablePadding);
  if (settings.radius) root.style.setProperty("--radius", settings.radius);
  if (settings.stripeColor1)
    root.style.setProperty("--stripe-color1", settings.stripeColor1);
  if (settings.stripeColor2)
    root.style.setProperty("--stripe-color2", settings.stripeColor2);
  if (settings.gridLineColor)
    root.style.setProperty("--grid-line-color", settings.gridLineColor);
  if (settings.tableHeaderBg)
    root.style.setProperty("--table-header-bg", settings.tableHeaderBg);

  if (settings.titleAlign) {
    const [flexAlign, textAlign] = settings.titleAlign.split("|");
    root.style.setProperty("--title-align", flexAlign);
    root.style.setProperty("--text-align", textAlign);
  }

  if (settings.sidebarPos === "right") {
    document.body.classList.add("sidebar-right");
  } else {
    document.body.classList.remove("sidebar-right");
  }

  // Inject custom CSS rules
  let styleEl = document.getElementById("custom-ui-rules");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "custom-ui-rules";
    document.head.appendChild(styleEl);
  }

  let css = "";
  css += `
    .table-container,
    .table-container table,
    .data-table-wrapper,
    .pivot-table-container,
    .master-ae-table-wrapper,
    #table-card,
    header.table-header,
    div.table-wrapper,
    .main-header-wrapper,
    .table-data-container {
      border-radius: ${settings.tableRadius || "0px"} !important;
    }

    button:not(.rounded-full):not(.rounded-none):not(.search-btn-exception),
    [role="button"]:not(.rounded-full):not(.rounded-none):not(.search-btn-exception) {
      border-radius: 20px !important;
    }

    span.rounded-full,
    div.rounded-full,
    input.rounded-full,
    button.rounded-full,
    .search-btn-exception,
    [class*="rounded-full"] {
      border-radius: 9999px !important;
    }

    .flex.bg-slate-200\\/30,
    div.flex.bg-slate-200\\/30,
    div[class*="bg-slate-200/30"] {
      background-color: transparent !important;
      border-width: 0px !important;
      box-shadow: none !important;
    }
  `;

  css += `
    .pivot-table-container,
    .pivot-table-container table,
    .pivot-table-container th,
    .pivot-table-container td,
    .pivot-table-container input,
    .master-ae-table-wrapper,
    .master-ae-table-wrapper table,
    .master-ae-table-wrapper th,
    .master-ae-table-wrapper td,
    .master-ae-table-wrapper input {
      font-family: var(--font-table, var(--font-mono)) !important;
      font-size: var(--font-size, 12px) !important;
    }

    .pivot-table-container thead,
    .pivot-table-container thead tr,
    .pivot-table-container thead th,
    .pivot-table-container tfoot,
    .pivot-table-container tfoot tr,
    .pivot-table-container tfoot td,
    .pivot-table-container .total-row,
    .pivot-table-container .total-row td {
      background-color: ${settings.tableHeaderBg || "#eed7fc"} !important;
    }

    .pivot-table-container thead input:not(:focus) {
      background-color: transparent !important;
    }
  `;

  if (settings.customRules && Array.isArray(settings.customRules)) {
    settings.customRules.forEach((rule) => {
      if (!rule.selector) return;
      css += `
        ${rule.selector} {
          ${rule.radius ? `border-radius: ${rule.radius} !important;` : ""}
          ${rule.bg ? `background-color: ${rule.bg} !important;` : ""}
          ${rule.color ? `color: ${rule.color} !important;` : ""}
          ${rule.border ? `border: ${rule.border} !important;` : ""}
          ${rule.padding ? `padding: ${rule.padding} !important;` : ""}
          ${rule.margin ? `margin: ${rule.margin} !important;` : ""}
          ${rule.width ? `width: ${rule.width} !important;` : ""}
          ${rule.height ? `height: ${rule.height} !important;` : ""}
        }
      `;
    });
  }

  // Inject preview rule if provided (for live feedback)
  if (previewRule && previewRule.selector) {
    const toPx = (val: string) => {
      if (!val) return "";
      if (/^\d+(\.\d+)?$/.test(val.trim())) return `${val.trim()}px`;
      return val.trim();
    };

    css += `
      ${previewRule.selector} {
        ${previewRule.radius ? `border-radius: ${toPx(previewRule.radius)} !important;` : ""}
        ${previewRule.bg ? `background-color: ${previewRule.bg} !important;` : ""}
        ${previewRule.color ? `color: ${previewRule.color} !important;` : ""}
        ${previewRule.border ? `border: ${previewRule.border} !important;` : ""}
        ${previewRule.padding ? `padding: ${toPx(previewRule.padding)} !important;` : ""}
        ${previewRule.margin ? `margin: ${toPx(previewRule.margin)} !important;` : ""}
        ${previewRule.width ? `width: ${toPx(previewRule.width)} !important;` : ""}
        ${previewRule.height ? `height: ${toPx(previewRule.height)} !important;` : ""}
        
        /* Focus highlight for the selected/focused element as requested */
        outline: 3px solid #3b82f6 !important;
        outline-offset: -3px !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.45) !important;
        position: relative !important;
        z-index: 50 !important;
      }
    `;
  }

  styleEl.innerHTML = css;
}

export async function loadUiSettings(): Promise<UiSettings> {
  const sanitize = (s: unknown): UiSettings => {
    const sObj = (s && typeof s === "object" ? s : {}) as Partial<UiSettings>;
    const result = { ...defaultSettings, ...sObj };
    // Force valid hex for specific fields
    if (!isValidColor(result.accent)) result.accent = defaultSettings.accent;
    if (!isValidColor(result.text)) result.text = defaultSettings.text;
    if (!isValidColor(result.border)) result.border = defaultSettings.border;
    if (!isValidColor(result.bg)) result.bg = defaultSettings.bg;
    if (result.stripeColor1 && !isValidColor(result.stripeColor1))
      result.stripeColor1 = defaultSettings.stripeColor1;
    if (result.stripeColor2 && !isValidColor(result.stripeColor2))
      result.stripeColor2 = defaultSettings.stripeColor2;
    if (result.gridLineColor && !isValidColor(result.gridLineColor))
      result.gridLineColor = defaultSettings.gridLineColor;
    if (result.tableHeaderBg && !isValidColor(result.tableHeaderBg))
      result.tableHeaderBg = defaultSettings.tableHeaderBg;

    // Validate bgImage URL (must start with http, https or data:)
    if (
      result.bgImage &&
      !result.bgImage.startsWith("http") &&
      !result.bgImage.startsWith("data:")
    ) {
      result.bgImage = "";
    }

    if (!result.customRules || !Array.isArray(result.customRules)) {
      result.customRules = [];
    }

    return result;
  };

  try {
    const saved = await localforage.getItem<UiSettings>(UI_SETTINGS_KEY);
    if (saved) return sanitize(saved);

    const legacySaved = localStorage.getItem(UI_SETTINGS_KEY);
    if (legacySaved) {
      try {
        const parsed = JSON.parse(legacySaved);
        return sanitize(parsed);
      } catch {
        // Ignore parsing errors
      }
    }
  } catch {
    // Ignore storage errors
  }
  return defaultSettings;
}

export function useUiSettings() {
  const [settings, setSettings] = useState<UiSettings>(defaultSettings);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const s = await loadUiSettings();
        if (active) {
          setSettings(s);
        }
      } catch (err) {
        console.error("Failed to load reactive UI settings:", err);
      }
    };

    fetchSettings();

    const handleUpdate = () => {
      fetchSettings();
    };

    window.addEventListener("ui-settings-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("ui-settings-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return settings;
}

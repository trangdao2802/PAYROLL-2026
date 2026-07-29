import { DEFAULT_CENTERS } from "../../constants";

/**
 * Normalizes text for comparison by removing accents and lowercasing
 */
const normalizeForMatch = (text: string): string => {
  if (!text) return "";
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

export const CENTER_MAPPING: Record<string, string> = {
  "HN1.PH": "HN0001.PHY",
  "BN1.NSL": "BN0001.LTT",
  "BN2.TUS": "BN0002.TSN",
  "HN2.TH": "HN0002.THA",
  "HN3.HQV": "HN0003.HQV",
  "HN4.LG": "HN0004.LGI",
  "HN5.NVL": "HN0005.NVL",
  "HN7.VQ": "HN0007.VQN",
  "HN10.TG": "HN0010.MDH",
  "HN12.NHT": "HN0012.NHT",
  "HN14.TM": "HN0014.TMI",
  "HN15.VP": "HN0015.VPU",
  "HN16.PDP": "HN0016.PDP",
  "HN17.HNI": "HN0017.HNI",
  "HN18.VTP": "HN0018.VTP",
  "HN19.NT": "HN0019.NTN",
  "HN21.NGD": "HN0021.NGD",
  "HN22.NVO": "HN0022.NVO",
  "HN23.LD": "HN0023.LDM",
  "HN24.TC": "HN0024.TCY",
  "HN25.LTT": "HN0025.LTT",
  "HN26.VH": "HN0026.VHG",
  "HN27.OP": "HN0027.OPK",
  "HN28.PVD": "HN0028.PVD",
  "HN29.VPH": "HN0029.VPH",
  "HN30.AKH": "HN0030.AKH",
  "HN31.AHG": "HN0031.AHG",
  "HN32.LLQ": "HN0032.LLQ",
  "HN33.DAH": "HN0033.DAH",
  "HN34.HTN": "HN0034.HTN",
  "HY01.ECP": "HY0001.ECP",
  "Hai Phong 1": "HP0001.LHP",
  "Hai Phong 2": "HP0002.HBT",
  "Hai Phong 3": "HP0003.VIN",
  "QN01.HL": "QN0001.HLG",
  "VIN01.CT": "VIN001.CTG",
  "VP01.PCT": "VP0001.PCT",
  "TH01.TPU": "TH0001.TPU",
  "TN01.LNQ": "TN0001.LNQ",
  "AA": "Apollo Advance -South", 
  "PT01.HVG": "PT0001.HVG",
  "MKT HP": "MKT LOCAL NORTH",
  "MKT TH": "MKT LOCAL NORTH",
  "MKT TN": "MKT LOCAL NORTH",
  "MKT PT": "MKT LOCAL NORTH",
  "MKT NORTH": "MKT LOCAL NORTH",
  "MKT HN": "MKT LOCAL NORTH",
  "MKT HY": "MKT LOCAL NORTH",
  "MKT BN": "MKT LOCAL NORTH",
  "MKT NA": "MKT LOCAL NORTH",
  "HAI PHONG": "MKT LOCAL NORTH",
  "THANH HOA": "MKT LOCAL NORTH",
  "THAI NGUYEN": "MKT LOCAL NORTH",
  "PHU THO": "MKT LOCAL NORTH",
  "NSL": "BN0001.LTT",
  "TUS": "BN0002.TSN",
  "PHY": "HN0001.PHY",
  "THA": "HN0002.THA",
  "HQV": "HN0003.HQV",
  "LGI": "HN0004.LGI",
  "NVL": "HN0005.NVL",
  "VQN": "HN0007.VQN",
  "MDH": "HN0010.MDH",
  "NHT": "HN0012.NHT",
  "TMI": "HN0014.TMI",
  "VPU": "HN0015.VPU",
  "PDP": "HN0016.PDP",
  "HNI": "HN0017.HNI",
  "VTP": "HN0018.VTP",
  "NTN": "HN0019.NTN",
  "NGD": "HN0021.NGD",
  "NVO": "HN0022.NVO",
  "LDM": "HN0023.LDM",
  "TCY": "HN0024.TCY",
  "LTT": "HN0025.LTT",
  "VHG": "HN0026.VHG",
  "OPK": "HN0027.OPK",
  "PVD": "HN0028.PVD",
  "VPH": "HN0029.VPH",
  "AKH": "HN0030.AKH",
  "AHG": "HN0031.AHG",
  "LLQ": "HN0032.LLQ",
  "DAH": "HN0033.DAH",
  "HTN": "HN0034.HTN",
  "ECP": "HY0001.ECP",
  "HLG": "QN0001.HLG",
  "CTG": "VIN001.CTG",
  "PCT": "VP0001.PCT",
  "TPU": "TH0001.TPU",
  "LNQ": "TN0001.LNQ",
  "HVG": "PT0001.HVG",
  "ASP": "HN0200.ASP",
  "THE GARDEN": "HN0010.MDH",
  "NGUYEN HUU THO": "HN0012.NHT",
  "MO LAO": "HN0022.NVO",
  "LY THAI TO": "BN0001.LTT",
  "QUANG NINH": "QN0001.HLG",
};

const RAW_MAPPINGS = [
  { l07: "BN0001.LTT", keys: ["NSL", "Ngo Si Lien", "BN01", "Ly Thai To", "Lý Thái Tổ","BN1", "BN BN1.NSL", "Bắc Ninh"] },
  { l07: "BN0002.TSN", keys: ["TUS", "TSN", "Tu Son", "BN02","BN2", "Từ Sơn"] },
  { l07: "HN0001.PHY", keys: ["HN1.PH", "PHY", "PH", "Pho Hue", "Pho Hue Junior", "HN01","HN1", "Phố Huế"] },
  { l07: "HN0002.THA", keys: ["TH", "THA", "Thai Ha", "HN02","HN2", "Thái Hà"] },
  { l07: "HN0003.HQV", keys: ["HQV", "Hoang Quoc Viet", "HN03","HN3", "Hoàng Quốc Việt"] },
  { l07: "HN0004.LGI", keys: ["LGI", "LG", "Lieu Giai", "HN04","HN4", "Liễu Giai"] },
  { l07: "HN0005.NVL", keys: ["NVL", "Nguyen Van Linh", "HN05","HN5", "Nguyễn Văn Linh"] },
  { l07: "HN0007.VQN", keys: ["VQ", "VQN", "Van Quan", "HN07","HN7", "Văn Quán"] },
  { l07: "HN0010.MDH", keys: ["MD", "MDH", "My Dinh", "The Garden","HN10", "Mỹ Đình"] },
  { l07: "HN0012.NHT", keys: ["NHT", "HM", "Hoang Mai", "Nguyen Huu Tho", "Nguyễn Hữu Thọ", "HN12", "Hoàng Mai"] },
  { l07: "HN0014.TMI", keys: ["TMI", "TM", "Tan Mai", "HN14", "Tân Mai"] },
  { l07: "HN0015.VPU", keys: ["VPU", "VP", "Van Phu", "HN15", "Văn Phú"] },
  { l07: "HN0016.PDP", keys: ["PDP", "Phan Dinh Phung", "HN16", "Phan Đình Phùng"] },
  { l07: "HN0017.HNI", keys: ["HNI", "Ham Nghi", "HN17", "Hàm Nghi"] },
  { l07: "HN0018.VTP", keys: ["VTP", "Vu Tong Phan", "HN18", "Vũ Tông Phan"] },
  { l07: "HN0019.NTN", keys: ["NTN", "NT", "Nguyen Tuan", "HN19", "Nguyễn Tuân"] },
  { l07: "HN0021.NGD", keys: ["NGD", "Ngoai Giao Doan", "HN21", "Ngoại Giao Đoàn"] },
  { l07: "HN0022.NVO", keys: ["NVO", "Nguyen Van Loc", "Mo Lao", "Mỗ Lao","HN22", "Nguyễn Văn Lộc"] },
  { l07: "HN0023.LDM", keys: ["LDM", "LD", "Linh Dam", "HN23", "Linh Đàm"] },
  { l07: "HN0024.TCY", keys: ["TCY", "TC", "TIMES CITY", "HN24", "Times City"] },
  { l07: "HN0025.LTT", keys: ["LTT", "Le Trong Tan", "HN25", "Lê Trọng Tấn"] },
  { l07: "HN0026.VHG", keys: ["VHG", "VH", "Viet Hung", "HN26", "Việt Hưng"] },
  { l07: "HN0027.OPK", keys: ["OPK", "OCP","OP", "Ocepark", "Ocean Park", "HN27", "OceanPark"] },
  { l07: "HN0028.PVD", keys: ["PVD", "Pham Van Dong", "HN28", "Phạm Văn Đồng"] },
  { l07: "HN0029.VPH", keys: ["VPH", "Vu Pham Ham", "HN29", "Vũ Phạm Hàm"] },
  { l07: "HN0030.AKH", keys: ["AKH", "AK", "An Khanh", "HN30", "An Khánh"] },
  { l07: "HN0031.AHG", keys: ["AHG", "AH", "An Hung", "HN31", "An Hưng"] },
  { l07: "HN0032.LLQ", keys: ["LLQ", "Lac Long Quan", "Xuan Dieu", "Xuan Dieu (đổi thành Lạc Long Quân)", "HN32", "Lạc Long Quân"] },
  { l07: "HN0033.DAH", keys: ["DAH", "DA", "Dong Anh","HN33.DAH", "HN33", "Đông Anh"] },
  { l07: "HN0034.HTN", keys: ["HTN", "Hong Tien", "HN34.HTN", "HN34", "Hồng Tiến"] },
  { l07: "HY0001.ECP", keys: ["ECP", "Ecopark", "HY01", "Hưng Yên", "Hung Yen"] },
  { l07: "HP0001.LHP", keys: ["LHP", "HP1", "HP01", "Hai Phong 1", "Lê Hồng Phong"] },
  { l07: "HP0002.HBT", keys: ["HBT", "HP2", "HP02", "Hai Phong 2", "Hai Bà Trưng"] },
  { l07: "HP0003.VIN", keys: ["HP3", "HP03", "Hai Phong 3", "Vincom HP"] },
  { l07: "QN0001.HLG", keys: ["HLG", "QN", "HL", "Ha Long", "QN01", "Quang Ninh", "Quảng Ninh", "QN1", "Hạ Long"] },
  { l07: "VIN001.CTG", keys: ["CTG", "VIN", "Vinh", "VIN01","VIN1", "VIN01.CTG", "Nghệ An"] },
  { l07: "VP0001.PCT", keys: ["PCT", "VP01", "VP1", "Vinh Phuc", "VP0001", "VP01.PCT", "Vĩnh Phúc"] },
  { l07: "TH0001.TPU", keys: ["TPU", "TH01.TPU", "MKT TH01.TPU", "Thanh Hoa", "TH01", "Thanh Hóa"] },
  { l07: "TN0001.LNQ", keys: ["LNQ", "TN01.LNQ", "MKT TN01.LNQ", "Thai Nguyen", "TN01", "Thái Nguyên"] },
  { l07: "PT0001.HVG", keys: ["HVG", "PT01.HVG", "MKT PT01.HVG", "Phu Tho", "PT01", "Phú Thọ"] },
  { l07: "AA", keys: ["AA", "Apollo Advance -South"] },
];

// const normalizeForMatchLoose = (text: string): string => {
//   if (!text) return "";
//   return text
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .toLowerCase()
//     .replace(/[đĐ]/g, "d")
//     .trim();
// };

const normalizedAeCodeMap = new Map<string, typeof DEFAULT_CENTERS[0]>();
const normalizedL07Map = new Map<string, typeof DEFAULT_CENTERS[0]>();
const exactL07Set = new Set<string>();
const exactAeCodeMap = new Map<string, string>();

DEFAULT_CENTERS.forEach((c) => {
  exactL07Set.add(c.l07.toUpperCase());
  exactAeCodeMap.set(c.aeCode.toUpperCase(), c.l07);
  normalizedAeCodeMap.set(normalizeForMatch(c.aeCode), c);
  normalizedL07Map.set(normalizeForMatch(c.l07), c);
});

const precomputedMappings: { l07: string; key: string; normKey: string; regex: RegExp }[] = [];
RAW_MAPPINGS.forEach((m) => {
  m.keys.forEach((k) => {
    const escapedKey = k.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    precomputedMappings.push({
      l07: m.l07,
      key: k.toUpperCase(),
      normKey: normalizeForMatch(k),
      regex: new RegExp(`(?:^|[^A-Z0-9a-z\\xC0-\\u1EF9])(${escapedKey})(?:[^A-Z0-9a-z\\xC0-\\u1EF9]|$)`, "i")
    });
  });
});
precomputedMappings.sort((a, b) => b.normKey.length - a.normKey.length);

export const mapChargeToCenterToL07 = (rawL07: string): string => {
  if (!rawL07) return "";
  // If not MKT specific, fallback to standard mapping
  return mapAeCodeToL07(rawL07);
};

export const mapAeCodeToL07 = (rawL07: string): string => {
  if (!rawL07) return "";
  const l07Upper = String(rawL07).toUpperCase().trim();

  if (CENTER_MAPPING[l07Upper]) return CENTER_MAPPING[l07Upper];

  // If the input exactly matches a known L07, return it immediately
  if (exactL07Set.has(l07Upper)) return l07Upper;

  // If the input exactly matches a known aeCode, return its L07
  const exactL07 = exactAeCodeMap.get(l07Upper);
  if (exactL07) return exactL07;

  // Try keyword matching
  const normalized = normalizeForMatch(rawL07);
  
  // Exact match first
  for (const mapping of precomputedMappings) {
    if (mapping.normKey === normalized) return mapping.l07;
  }

  // Word boundary regex on original raw text
  for (const mapping of precomputedMappings) {
    if (mapping.regex.test(rawL07)) {
      return mapping.l07;
    }
  }

  // Final fallback for longer keys only (length >= 4) with loose include to avoid matching "PH" in "Hai Phong"
  for (const mapping of precomputedMappings) {
    if (mapping.normKey.length >= 4 && normalized.includes(mapping.normKey)) {
      return mapping.l07;
    }
  }
  
  return rawL07;
};

// Aliased for backwards compatibility in other files
export const mapL07 = mapAeCodeToL07;

export const getL07FromFileName = (fileName: string): string => {
  if (!fileName) return "";
  const normalized = normalizeForMatch(fileName);
  
  // 1. Try regex first (word boundaries) - most precise
  for (const mapping of precomputedMappings) {
    if (mapping.regex.test(fileName)) {
      return mapping.l07;
    }
  }

  // 2. Try segmenting by common separators
  const segments = fileName.split(/[-_.\s]/).filter(Boolean);
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed || trimmed.length < 2) continue;
    const mapped = mapL07(trimmed);
    // If it maps to a full L07 code (with dot), it's a good match
    if (mapped && mapped.includes(".") && mapped.length >= 7) {
      return mapped;
    }
  }

  // Fallback but only for longer keys to prevent bad substring matching
  for (const mapping of precomputedMappings) {
    if (mapping.normKey.length >= 4 && normalized.includes(mapping.normKey)) {
      return mapping.l07;
    }
  }

  return "";
};

export const getCenterInfoByL07 = (l07: string) => {
  if (!l07) return null;
  const normalized = normalizeForMatch(l07);
  return normalizedL07Map.get(normalized) || null;
};

export const getCenterInfoByAECode = (aeCode: string) => {
  if (!aeCode) return null;

  // Use robust mapAeCodeToL07 first
  const candidateL07 = mapAeCodeToL07(aeCode);
  const infoByL07 = getCenterInfoByL07(candidateL07);
  if (infoByL07) return infoByL07;

  // Fallback to normalized maps
  const normalizedAE = normalizeForMatch(aeCode);
  return normalizedAeCodeMap.get(normalizedAE) || normalizedL07Map.get(normalizedAE) || null;
};

/**
 * Dictionary for mapping raw MKT Local North Center names to chargeToCenterMkt
 */
export const MKT_RAW_CENTER_TO_CHARGE_MAP: Record<string, string> = {
  "BN0001.LTT": "BN0001.LTT",
  "BN0002.TSN": "BN0002.TSN",
  "HN0001.PHY": "HN0001.PHY",
  "HN0002.THA": "HN0002.THA",
  "HN0003.HQV": "HN0003.HQV",
  "HN0004.LGI": "HN0004.LGI",
  "HN0005.NVL": "HN0005.NVL",
  "HN0007.VQN": "HN0007.VQN",
  "HN0010.MDH": "HN0010.MDH",
  "HN0012.NHT": "HN0012.NHT",
  "HN0014.TMI": "HN0014.TMI",
  "HN0015.VPU": "HN0015.VPU",
  "HN0016.PDP": "HN0016.PDP",
  "HN0017.HNI": "HN0017.HNI",
  "HN0018.VTP": "HN0018.VTP",
  "HN0019.NTN": "HN0019.NTN",
  "HN0021.NGD": "HN0021.NGD",
  "HN0022.NVO": "HN0022.NVO",
  "HN0023.LDM": "HN0023.LDM",
  "HN0024.TCY": "HN0024.TCY",
  "HN0025.LTT": "HN0025.LTT",
  "HN0026.VHG": "HN0026.VHG",
  "HN0027.OPK": "HN0027.OPK",
  "HN0028.PVD": "HN0028.PVD",
  "HN0029.VPH": "HN0029.VPH",
  "HN0030.AKH": "HN0030.AKH",
  "HN0031.AHG": "HN0031.AHG",
  "HN0032.LLQ": "HN0032.LLQ",
  "HN0033.DAH": "HN0033.DAH",
  "HN0034.HTN": "HN0034.HTN",
  "HY0001.ECP": "HY0001.ECP",
  "MKT LOCAL NORTH_HP": "MKT LOCAL NORTH",
  "QN0001.HLG": "QN0001.HLG",
  "VIN001.CTG": "VIN001.CTG",
  "VP0001.PCT": "VP0001.PCT",
  "TH0001.TPU": "TH0001.TPU",
  "TN0001.LNQ": "TN0001.LNQ",
  "PT0001.HVG": "PT0001.HVG",
  "MKT LOCAL NORTH": "MKT LOCAL NORTH",

  // Raw chargetocenterCode -> chargeToCenterMkt
  "Ly Thai To": "BN0001.LTT",
  "Tu Son": "BN0002.TSN",
  "Pho Hue": "HN0001.PHY",
  "Thai Ha": "HN0002.THA",
  "Hoang Quoc Viet": "HN0003.HQV",
  "Lieu Giai": "HN0004.LGI",
  "Nguyen Van Linh": "HN0005.NVL",
  "Van Quan": "HN0007.VQN",
  "The Garden": "HN0010.MDH",
  "Nguyen Huu Tho": "HN0012.NHT",
  "Tan Mai": "HN0014.TMI",
  "Van Phu": "HN0015.VPU",
  "Phan Dinh Phung": "HN0016.PDP",
  "Ham Nghi": "HN0017.HNI",
  "Vu Tong Phan": "HN0018.VTP",
  "Nguyen Tuan": "HN0019.NTN",
  "Ngoai Giao Doan": "HN0021.NGD",
  "Mo Lao": "HN0022.NVO",
  "Linh Dam": "HN0023.LDM",
  "Times City": "HN0024.TCY",
  "Le Trong Tan": "HN0025.LTT",
  "Viet Hung": "HN0026.VHG",
  "Ocean Park": "HN0027.OPK",
  "Pham Van Dong": "HN0028.PVD",
  "Vu Pham Ham": "HN0029.VPH",
  "An Khanh": "HN0030.AKH",
  "An Hung": "HN0031.AHG",
  "Lac Long Quan": "HN0032.LLQ",
  "Dong Anh": "HN0033.DAH",
  "Hong Tien": "HN0034.HTN",
  "Ecopark": "HY0001.ECP",
  "Hai Phong": "MKT LOCAL NORTH_HP",
  "Quang Ninh": "QN0001.HLG",
  "Vinh": "VIN001.CTG",
  "Vinh Phuc": "VP0001.PCT",
  "Thanh Hoa": "TH0001.TPU",
  "Thai Nguyen": "TN0001.LNQ",
  "Phu Tho": "PT0001.HVG",
  "NTW": "NTW",
};

/**
 * Resolves any raw center / chargeToCenter value to its exact chargeToCenterMkt code
 */
export const resolveChargeToCenterMktCode = (chargeValue: string): string => {
  if (!chargeValue) return "";
  const chargeUpper = chargeValue.toUpperCase().trim();
  
  // Direct match in values
  const matchedVal = Object.values(MKT_RAW_CENTER_TO_CHARGE_MAP).find(
    (v) => v.toUpperCase() === chargeUpper
  );
  if (matchedVal) return matchedVal;

  // Key match (case insensitive)
  const exactMatch = Object.entries(MKT_RAW_CENTER_TO_CHARGE_MAP).find(
    ([k]) => k.toUpperCase() === chargeUpper
  );
  if (exactMatch) {
    return exactMatch[1];
  }

  // Normalized match
  const normVal = normalizeForMatch(chargeValue);
  for (const [k, v] of Object.entries(MKT_RAW_CENTER_TO_CHARGE_MAP)) {
    if (normalizeForMatch(k) === normVal || normalizeForMatch(v) === normVal) {
      return v;
    }
  }

  return chargeValue;
};

/**
 * Recognizes the L07 location based on Charge To Center MKT values or keywords
 */
export const getL07FromChargeToCenterMkt = (chargeValue: string): string | null => {
  if (!chargeValue) return null;
  const res = resolveChargeToCenterMktCode(chargeValue);
  return res || null;
};

/**
 * Gets the corresponding BUSINESS based on the L07 string
 */
export function getBusinessFromL07(l07: string): string {
  if (!l07) return "UNKNOWN";
  const upper = String(l07).toUpperCase().trim();
  
  
  if (upper === "MKT LOCAL NORTH" || upper === "MKT" || upper === "AHN") return "AHN";
  
  const info = getCenterInfoByL07(l07);
  if (info && info.bus) {
    return info.bus === "AHN_HP" ? "AHP" : info.bus;
  }
  
  return "UNKNOWN";
}

export interface MktCenterResolveResult {
  l07: string;
  business: string;
  chargeToCenterMkt: string;
  isMktLocal: boolean;
  aeCode: string;
  isUnmapped?: boolean;
  unmappedDetails?: {
    unmappedChargeToCenterMkt: string | null;
    unmappedL07: string | null;
  };
}

export function processTimesheetMktLogic(inputData: {
  chargetocenterCode: string;
  fileName?: string;
  masterBank?: string;
  l07Input?: string;
}): MktCenterResolveResult {
  const { chargetocenterCode, masterBank = "", l07Input = "" } = inputData;

  const rawCenterToMktMap: Record<string, string> = {
    "Ly Thai To": "BN0001.LTT",
    "Tu Son": "BN0002.TSN",
    "Pho Hue": "HN0001.PHY",
    "Thai Ha": "HN0002.THA",
    "Hoang Quoc Viet": "HN0003.HQV",
    "Lieu Giai": "HN0004.LGI",
    "Nguyen Van Linh": "HN0005.NVL",
    "Van Quan": "HN0007.VQN",
    "The Garden": "HN0010.MDH",
    "Nguyen Huu Tho": "HN0012.NHT",
    "Tan Mai": "HN0014.TMI",
    "Van Phu": "HN0015.VPU",
    "Phan Dinh Phung": "HN0016.PDP",
    "Ham Nghi": "HN0017.HNI",
    "Vu Tong Phan": "HN0018.VTP",
    "Nguyen Tuan": "HN0019.NTN",
    "Ngoai Giao Doan": "HN0021.NGD",
    "Mo Lao": "HN0022.NVO",
    "Linh Dam": "HN0023.LDM",
    "Times City": "HN0024.TCY",
    "Le Trong Tan": "HN0025.LTT",
    "Viet Hung": "HN0026.VHG",
    "Ocean Park": "HN0027.OPK",
    "Pham Van Dong": "HN0028.PVD",
    "Vu Pham Ham": "HN0029.VPH",
    "An Khanh": "HN0030.AKH",
    "An Hung": "HN0031.AHG",
    "Lac Long Quan": "HN0032.LLQ",
    "Dong Anh": "HN0033.DAH",
    "Hong Tien": "HN0034.HTN",
    "Ecopark": "HY0001.ECP",
    "Hai Phong": "Hai Phong",
    "Quang Ninh": "QN0001.HLG",
    "Vinh": "VIN001.CTG",
    "Vinh Phuc": "VP0001.PCT",
    "Thanh Hoa": "TH0001.TPU",
    "Thai Nguyen": "TN0001.LNQ",
    "Phu Tho": "PT0001.HVG",
    "NTW": "NTW"
  };

  const ahnCenters = new Set([
    "BN0001.LTT", "BN0002.TSN", "HN0001.PHY", "HN0002.THA", "HN0003.HQV",
    "HN0004.LGI", "HN0005.NVL", "HN0007.VQN", "HN0010.MDH", "HN0012.NHT",
    "HN0014.TMI", "HN0015.VPU", "HN0016.PDP", "HN0017.HNI", "HN0018.VTP",
    "HN0019.NTN", "HN0021.NGD", "HN0022.NVO", "HN0023.LDM", "HN0024.TCY",
    "HN0025.LTT", "HN0026.VHG", "HN0027.OPK", "HN0028.PVD", "HN0029.VPH",
    "HN0030.AKH", "HN0031.AHG", "HN0032.LLQ", "HN0033.DAH", "HN0034.HTN",
    "HY0001.ECP", "NTW", "QN0001.HLG", "VIN001.CTG", "VP0001.PCT",
    "MKT BN", "MKT HN", "MKT HP", "MKT HY", "MKT NA", 
    "MKT PT01.HVG", "MKT QN", "MKT TH01.TPU", "MKT TN01.LNQ", "MKT VP"
  ]);

  const validL07s = new Set([
    "MKT LOCAL NORTH",
    "MKT LOCAL NORTH_HP",
    "MKT LOCAL NORTH_TN",
    "MKT LOCAL NORTH_TH",
    "MKT LOCAL NORTH_PT"
  ]);

  let chargeToCenterMkt = "";
  let l07 = "";
  let bu = "";

  const MKT_NORTH_CHARGE_MAP: Record<string, { chargetocenterCode: string }> = {
    "BN0001.LTT": { chargetocenterCode: "Ly Thai To" },
    "BN0002.TSN": { chargetocenterCode: "Tu Son" },
    "HN0001.PHY": { chargetocenterCode: "Pho Hue" },
    "HN0002.THA": { chargetocenterCode: "Thai Ha" },
    "HN0003.HQV": { chargetocenterCode: "Hoang Quoc Viet" },
    "HN0004.LGI": { chargetocenterCode: "Lieu Giai" },
    "HN0005.NVL": { chargetocenterCode: "Nguyen Van Linh" },
    "HN0007.VQN": { chargetocenterCode: "Van Quan" },
    "HN0010.MDH": { chargetocenterCode: "The Garden" },
    "HN0012.NHT": { chargetocenterCode: "Nguyen Huu Tho" },
    "HN0014.TMI": { chargetocenterCode: "Tan Mai" },
    "HN0015.VPU": { chargetocenterCode: "Van Phu" },
    "HN0016.PDP": { chargetocenterCode: "Phan Dinh Phung" },
    "HN0017.HNI": { chargetocenterCode: "Ham Nghi" },
    "HN0018.VTP": { chargetocenterCode: "Vu Tong Phan" },
    "HN0019.NTN": { chargetocenterCode: "Nguyen Tuan" },
    "HN0021.NGD": { chargetocenterCode: "Ngoai Giao Doan" },
    "HN0022.NVO": { chargetocenterCode: "Mo Lao" },
    "HN0023.LDM": { chargetocenterCode: "Linh Dam" },
    "HN0024.TCY": { chargetocenterCode: "Times City" },
    "HN0025.LTT": { chargetocenterCode: "Le Trong Tan" },
    "HN0026.VHG": { chargetocenterCode: "Viet Hung" },
    "HN0027.OPK": { chargetocenterCode: "Ocean Park" },
    "HN0028.PVD": { chargetocenterCode: "Pham Van Dong" },
    "HN0029.VPH": { chargetocenterCode: "Vu Pham Ham" },
    "HN0030.AKH": { chargetocenterCode: "An Khanh" },
    "HN0031.AHG": { chargetocenterCode: "An Hung" },
    "HN0032.LLQ": { chargetocenterCode: "Lac Long Quan" },
    "HN0033.DAH": { chargetocenterCode: "Dong Anh" },
    "HN0034.HTN": { chargetocenterCode: "Hong Tien" },
    "HY0001.ECP": { chargetocenterCode: "Ecopark" },
    "Hai Phong": { chargetocenterCode: "Hai Phong" },
    "QN0001.HLG": { chargetocenterCode: "Quang Ninh" },
    "VIN001.CTG": { chargetocenterCode: "Vinh" },
    "VP0001.PCT": { chargetocenterCode: "Vinh Phuc" },
    "TH0001.TPU": { chargetocenterCode: "Thanh Hoa" },
    "TN0001.LNQ": { chargetocenterCode: "Thai Nguyen" },
    "PT0001.HVG": { chargetocenterCode: "Phu Tho" },
    "NTW": { chargetocenterCode: "NTW" },
  };

  const upperCode = String(chargetocenterCode || l07Input || "").toUpperCase().trim();

  if (upperCode === "MKT HP" || upperCode.includes("MKT HP")) {
    l07 = "MKT LOCAL NORTH_HP";
    bu = "AHP";
    chargeToCenterMkt = "Hai Phong";
  } else if (
    upperCode === "MKT HN" || upperCode === "MKT BN" || upperCode === "MKT HY" ||
    upperCode === "MKT VP" || upperCode === "MKT VIN" || upperCode === "MKT NA" ||
    upperCode === "MKT VINH" || upperCode === "MKT QN" || upperCode === "MKT HL" ||
    upperCode === "MKT LOCAL NORTH" ||
    upperCode.startsWith("MKT HN") || upperCode.startsWith("MKT BN") || upperCode.startsWith("MKT HY") ||
    upperCode.startsWith("MKT VP") || upperCode.startsWith("MKT VIN") || upperCode.startsWith("MKT NA") ||
    upperCode.startsWith("MKT QN") || upperCode.startsWith("MKT HL") ||
    upperCode.startsWith("MKT LOCAL NORTH")
  ) {
    l07 = "MKT LOCAL NORTH";
    bu = "AHN";
    chargeToCenterMkt = upperCode;
  } else if (
    upperCode === "MKT TH" || upperCode === "MKT TPU" || upperCode === "MKT TH01.TPU" ||
    upperCode.includes("MKT TH") || upperCode.includes("MKT TPU") || upperCode.includes("TH01.TPU")
  ) {
    l07 = "MKT LOCAL NORTH_TH";
    bu = "ATH";
    chargeToCenterMkt = "TH0001.TPU";
  } else if (
    upperCode === "MKT TN" || upperCode === "MKT TN01.TPU" || upperCode === "MKT TN01.LNQ" ||
    upperCode.includes("MKT TN") || upperCode.includes("TN01.LNQ")
  ) {
    l07 = "MKT LOCAL NORTH_TN";
    bu = "ATN";
    chargeToCenterMkt = "TN0001.LNQ";
  } else if (
    upperCode === "MKT PT" || upperCode === "MKT HVG" || upperCode === "MKT PT01.HVG" ||
    upperCode.includes("MKT PT") || upperCode.includes("MKT HVG") || upperCode.includes("PT01.HVG")
  ) {
    l07 = "MKT LOCAL NORTH_PT";
    bu = "APT";
    chargeToCenterMkt = "PT0001.HVG";
  } else {
    const isMktNorthBank = masterBank === "MKT LOCAL NORTH" || masterBank.startsWith("MKT LOCAL NORTH") || masterBank.includes("MKT NORTH");

    if (isMktNorthBank) {
        // Logic for Bank == MKT LOCAL NORTH
        const mapping = MKT_NORTH_CHARGE_MAP[chargetocenterCode] || MKT_NORTH_CHARGE_MAP[l07Input];
        chargeToCenterMkt = mapping ? mapping.chargetocenterCode : chargetocenterCode;
        
        const ahnCodes = new Set([
          "BN0001.LTT", "BN0002.TSN", "HN0001.PHY", "HN0002.THA", "HN0003.HQV",
          "HN0004.LGI", "HN0005.NVL", "HN0007.VQN", "HN0010.MDH", "HN0012.NHT",
          "HN0014.TMI", "HN0015.VPU", "HN0016.PDP", "HN0017.HNI", "HN0018.VTP",
          "HN0019.NTN", "HN0021.NGD", "HN0022.NVO", "HN0023.LDM", "HN0024.TCY",
          "HN0025.LTT", "HN0026.VHG", "HN0027.OPK", "HN0028.PVD", "HN0029.VPH",
          "HN0030.AKH", "HN0031.AHG", "HN0032.LLQ", "HN0033.DAH", "HN0034.HTN",
          "HY0001.ECP", "NTW", "QN0001.HLG", "VIN001.CTG", "VP0001.PCT",
          "ECOPARK", "Ecopark", "ecopark", "ECO PARK", "Eco Park", "eco park"
        ]);

        if (ahnCodes.has(chargeToCenterMkt) || ahnCodes.has(chargetocenterCode) || ahnCodes.has(l07Input)) {
            l07 = "MKT LOCAL NORTH";
            bu = "AHN";
        } else if (chargeToCenterMkt === "Hai Phong" || chargetocenterCode === "Hai Phong" || chargetocenterCode === "HP0001.LHP") {
            l07 = "MKT LOCAL NORTH_HP";
            bu = "AHP";
        } else if (chargeToCenterMkt === "TN0001.LNQ" || chargetocenterCode === "TN0001.LNQ") {
            l07 = "MKT LOCAL NORTH_TN";
            bu = "ATN";
        } else if (chargeToCenterMkt === "TH0001.TPU" || chargetocenterCode === "TH0001.TPU") {
            l07 = "MKT LOCAL NORTH_TH";
            bu = "ATH";
        }
    } else {
        // Existing logic or default for Bank != MKT LOCAL NORTH
        const mappedMktCode = rawCenterToMktMap[chargetocenterCode] || rawCenterToMktMap[l07Input] || "";
        chargeToCenterMkt = mappedMktCode || chargetocenterCode || l07Input || "";
        
        if (ahnCenters.has(chargeToCenterMkt)) {
            l07 = "MKT LOCAL NORTH";
            bu = "AHN";
        } else if (chargeToCenterMkt === "MKT LOCAL NORTH_HP" || chargeToCenterMkt === "Hai Phong") {
            l07 = "MKT LOCAL NORTH_HP";
            bu = "AHP";
        } else if (chargeToCenterMkt === "TN0001.LNQ") {
            l07 = "MKT LOCAL NORTH_TN";
            bu = "ATN";
        } else if (chargeToCenterMkt === "TH0001.TPU") {
            l07 = "MKT LOCAL NORTH_TH";
            bu = "ATH";
        } else if (chargeToCenterMkt === "PT0001.HVG") {
            l07 = "MKT LOCAL NORTH_PT";
            bu = "APT";
        }
    }
  }

  const isInvalidChargeToCenter = !ahnCenters.has(chargeToCenterMkt) &&
    !["MKT LOCAL NORTH_HP", "Hai Phong", "TN0001.LNQ", "TH0001.TPU", "PT0001.HVG"].includes(chargeToCenterMkt);

  const isInvalidL07 = !validL07s.has(l07);

  return {
    chargeToCenterMkt: chargeToCenterMkt,
    l07: l07,
    business: bu || "N/A",
    isMktLocal: true,
    aeCode: chargeToCenterMkt,
    isUnmapped: isInvalidChargeToCenter || isInvalidL07,
    unmappedDetails: {
      unmappedChargeToCenterMkt: isInvalidChargeToCenter ? chargeToCenterMkt : null,
      unmappedL07: isInvalidL07 ? (l07 || "EMPTY_L07") : null
    }
  };
}

export function resolveMktAndCenterL07(
  rawCenterInput: string,
  rawChargeInput?: string,
  fileNameInput?: string,
  existingL07Input?: string
): MktCenterResolveResult {
  const rCen = String(rawCenterInput || "").trim();
  const rawCharge = String(rawChargeInput || "").trim();
  const fileName = String(fileNameInput || "").trim();
  const currentL07 = String(existingL07Input || "").trim();

  const norm = (s: string) =>
    s
      ? s
          .replace(/\s+/g, " ")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .replace(/[Đđ]/g, "D")
          .trim()
      : "";

  const normCen = norm(rCen);
  const normCharge = norm(rawCharge);
  const normL07 = norm(currentL07);
  const fileUpper = fileName.toUpperCase();

  const isMktFile =
    fileUpper.includes("MKT") ||
    fileUpper.includes("MARKETING") ||
    fileUpper.includes("LOCAL NORTH");

  const isMktNorthBank =
    normCen === "MKT LOCAL NORTH" ||
    normCen.includes("MKT LOCAL NORTH") ||
    normCen.includes("MKT NORTH") ||
    normCharge === "MKT LOCAL NORTH" ||
    normCharge.includes("MKT LOCAL NORTH") ||
    normCharge.includes("MKT NORTH") ||
    normL07.includes("MKT LOCAL NORTH");

  const isMktContext = isMktFile || isMktNorthBank || normCen === "NTW" || normCen.includes("MKT");

  if (isMktContext) {
    const searchVal = rawCharge || rCen;
    return processTimesheetMktLogic({
      chargetocenterCode: searchVal,
      fileName: fileName,
      masterBank: isMktNorthBank ? "MKT LOCAL NORTH" : undefined,
      l07Input: currentL07
    });
  }

  // Explicit override: CENTER = MKT LOCAL NORTH, MKT HN, MKT Hy, MKT BN, MKT NA => L07 = MKT LOCAL NORTH, BU = AHN
  if (
    normCen === "MKT LOCAL NORTH" ||
    normCen === "MKT HN" ||
    normCen === "MKT HY" ||
    normCen === "MKT BN" ||
    normCen === "MKT NA"
  ) {
    return {
      l07: "MKT LOCAL NORTH",
      business: "AHN",
      chargeToCenterMkt: rawCharge || "MKT LOCAL NORTH",
      isMktLocal: true,
      aeCode: "MKT LOCAL NORTH",
    };
  }

  // Fallback to standard center mapping
  const mappedL07 = mapL07(rCen || currentL07 || rawCharge);
  let mappedInfo = getCenterInfoByL07(mappedL07) || getCenterInfoByAECode(rCen);
  if (!mappedInfo && mappedL07) {
    mappedInfo = getCenterInfoByAECode(mappedL07);
  }

  const finalL07 = mappedInfo ? mappedInfo.l07 : mappedL07 || "UNKNOWN";
  const finalBiz = mappedInfo ? (mappedInfo.bus === "AHN_HP" ? "AHP" : mappedInfo.bus) : getBusinessFromL07(finalL07);
  const finalAeCode = mappedInfo ? mappedInfo.aeCode : rCen || finalL07;

  return {
    l07: finalL07,
    business: finalBiz,
    chargeToCenterMkt: rawCharge || finalL07,
    isMktLocal: false,
    aeCode: finalAeCode,
  };
}

export const MKT_CENTER_MAP: Record<string, string> = {
  "Ly Thai To": "BN0001.LTT",
  "Lý Thái Tổ": "BN0001.LTT",
  "Tu Son": "BN0002.TSN",
  "Từ Sơn": "BN0002.TSN",
  "Pho Hue": "HN0001.PHY",
  "Phố Huế": "HN0001.PHY",
  "Thai Ha": "HN0002.THA",
  "Thái Hà": "HN0002.THA",
  "Hoang Quoc Viet": "HN0003.HQV",
  "Hoàng Quốc Việt": "HN0003.HQV",
  "Lieu Giai": "HN0004.LGI",
  "Liễu Giai": "HN0004.LGI",
  "Nguyen Van Linh": "HN0005.NVL",
  "Nguyễn Văn Linh": "HN0005.NVL",
  "Van Quan": "HN0007.VQN",
  "Văn Quán": "HN0007.VQN",
  "The Garden": "HN0010.MDH",
  "Mỹ Đình": "HN0010.MDH",
  "Nguyen Huu Tho": "HN0012.NHT",
  "Nguyễn Hữu Thọ": "HN0012.NHT",
  "Tan Mai": "HN0014.TMI",
  "Tân Mai": "HN0014.TMI",
  "Van Phu": "HN0015.VPU",
  "Văn Phú": "HN0015.VPU",
  "Phan Dinh Phung": "HN0016.PDP",
  "Phan Đình Phùng": "HN0016.PDP",
  "Ham Nghi": "HN0017.HNI",
  "Hàm Nghi": "HN0017.HNI",
  "Vu Tong Phan": "HN0018.VTP",
  "Vũ Tông Phan": "HN0018.VTP",
  "Nguyen Tuan": "HN0019.NTN",
  "Nguyễn Tuân": "HN0019.NTN",
  "Ngoai Giao Doan": "HN0021.NGD",
  "Ngoại Giao Đoàn": "HN0021.NGD",
  "Mo Lao": "HN0022.NVO",
  "Mỗ Lao": "HN0022.NVO",
  "Linh Dam": "HN0023.LDM",
  "Linh Đàm": "HN0023.LDM",
  "Times City": "HN0024.TCY",
  "Le Trong Tan": "HN0025.LTT",
  "Lê Trọng Tấn": "HN0025.LTT",
  "Viet Hung": "HN0026.VHG",
  "Việt Hưng": "HN0026.VHG",
  "Ocean Park": "HN0027.OPK",
  "Pham Van Dong": "HN0028.PVD",
  "Phạm Văn Đồng": "HN0028.PVD",
  "Vu Pham Ham": "HN0029.VPH",
  "Vũ Phạm Hàm": "HN0029.VPH",
  "An Khanh": "HN0030.AKH",
  "An Khánh": "HN0030.AKH",
  "An Hung": "HN0031.AHG",
  "An Hưng": "HN0031.AHG",
  "Lac Long Quan": "HN0032.LLQ",
  "Lạc Long Quân": "HN0032.LLQ",
  "Dong Anh": "HN0033.DAH",
  "Đông Anh": "HN0033.DAH",
  "Hong Tien": "HN0034.HTN",
  "Hồng Tiến": "HN0034.HTN",
  "Ecopark": "HY0001.ECP",
  "Hai Phong": "MKT LOCAL NORTH_HP",
  "Hải Phòng": "MKT LOCAL NORTH_HP",
  "MKT LOCAL NORTH_HP": "MKT LOCAL NORTH_HP",
  "Quang Ninh": "QN0001.HLG",
  "Quảng Ninh": "QN0001.HLG",
  "Vinh": "VIN001.CTG",
  "Vinh Phuc": "VP0001.PCT",
  "Vĩnh Phúc": "VP0001.PCT",
  "Thanh Hoa": "TH0001.TPU",
  "Thanh Hóa": "TH0001.TPU",
  "TH0001.TPU": "TH0001.TPU",
  "MKT LOCAL NORTH_TH": "MKT LOCAL NORTH_TH",
  "Thai Nguyen": "TN0001.LNQ",
  "Thái Nguyên": "TN0001.LNQ",
  "TN0001.LNQ": "TN0001.LNQ",
  "MKT LOCAL NORTH_TN": "MKT LOCAL NORTH_TN",
  "Phu Tho": "PT0001.HVG",
  "Phú Thọ": "PT0001.HVG",
  "PT0001.HVG": "PT0001.HVG",
  "NTW": "NTW",
  "MKT LOCAL NORTH": "MKT LOCAL NORTH"
};

// Danh sách các Center thuộc cụm AHN
export const AHN_CENTER_LIST = [
  "BN0001.LTT", "BN0002.TSN", "HN0001.PHY", "HN0002.THA", "HN0003.HQV",
  "HN0004.LGI", "HN0005.NVL", "HN0007.VQN", "HN0010.MDH", "HN0012.NHT",
  "HN0014.TMI", "HN0015.VPU", "HN0016.PDP", "HN0017.HNI", "HN0018.VTP",
  "HN0019.NTN", "HN0021.NGD", "HN0022.NVO", "HN0023.LDM", "HN0024.TCY",
  "HN0025.LTT", "HN0026.VHG", "HN0027.OPK", "HN0028.PVD", "HN0029.VPH",
  "HN0030.AKH", "HN0031.AHG", "HN0032.LLQ", "HN0033.DAH", "HN0034.HTN",
  "HY0001.ECP", "MKT LOCAL NORTH", "QN0001.HLG", "VIN001.CTG", "VP0001.PCT", "PT0001.HVG", "NTW",
  // Các mã mới thêm vào từ bảng:
  "MKT BN", "MKT HN", "MKT HP", "MKT HY", "MKT NA", 
  "MKT PT01.HVG", "MKT QN", "MKT TH01.TPU", "MKT TN01.LNQ", "MKT VP"
];

/**
 * Hàm phân giải dữ liệu từ cột Center của file MKT LOCAL NORTH
 * @param rawCenterName - Giá trị lấy từ cột Center (chargetocenterCode)
 */
export function processMktLocalNorthCenter(rawCenterName: string) {
  const result = processTimesheetMktLogic({
    chargetocenterCode: String(rawCenterName || "").trim()
  });

  return {
    chargeToCenterMkt: result.chargeToCenterMkt,
    l07: result.l07 || result.chargeToCenterMkt,
    bu: result.business || "N/A"
  };
}

/**
 * Processes raw rows for Pivot calculation adhering to MKT File, Bank = MKT LOCAL NORTH, L07 assignment, and Duration calculation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processPivotData(data: Record<string, any>[], fileName = "") {
  // 1. Kiểm tra: NẾU FILE NÀY TRONG TÊN CHỨA TỪ MKT
  const isMKTFile = String(fileName || "").toUpperCase().includes("MKT");

  const transformed = data.map((row) => {
    // Đọc các cột từ Excel (xóa khoảng trắng thừa để tránh lỗi)
    const originalChargeCenter = String(
      row["Charge to Center MKT"] ||
      row["Charge to Center"] ||
      row["CHARGE TO CENTER"] ||
      row["Charge Code Centre"] ||
      row["chargeToCenter"] ||
      ""
    ).trim();

    const bankVal = String(
      row["Bank"] ||
      row["BANK"] ||
      row["Center"] ||
      row["CENTER"] ||
      row["Center Code"] ||
      ""
    ).trim().toUpperCase();

    const l07Val = String(
      row["L07"] ||
      row["l07"] ||
      row["cột L07"] ||
      row["L07 = Charge to Center MKT"] ||
      ""
    ).trim();

    const isMktNorthBank =
      bankVal === "MKT LOCAL NORTH" ||
      bankVal.startsWith("MKT LOCAL NORTH") ||
      bankVal.includes("MKT NORTH");

    // 2. Khởi tạo: QUY RA CỘT CHARGE TO CENTER MKT (Mặc định lấy từ Charge to Center gốc)
    let chargeToCenterMKT = MKT_CENTER_MAP[originalChargeCenter] || originalChargeCenter;

    // Check if raw Center column has a mapping name (Only if NOT MKT LOCAL NORTH)
    const rawCenterName = String(row["Center"] || row["CENTER"] || row["center"] || "").trim();
    if (!chargeToCenterMKT && rawCenterName && !isMktNorthBank) {
      chargeToCenterMKT = MKT_CENTER_MAP[rawCenterName] || rawCenterName;
    }

    // 3. ĐIỀU KIỆN CHỐT:
    // NẾU file có chữ MKT VÀ cột BANK = MKT LOCAL NORTH (hoặc MKT LOCAL NORTH_*) -> CHARGE TO CENTER MKT = CỘT L07
    if (isMKTFile && isMktNorthBank) {
      const l07Mapped = MKT_CENTER_MAP[l07Val] || l07Val;
      chargeToCenterMKT = l07Mapped || chargeToCenterMKT;
    }

    if (!chargeToCenterMKT) {
      chargeToCenterMKT = originalChargeCenter || l07Val || bankVal || "N/A";
    }

    // 4. Phân giải L07 chính xác cho nhóm Pivot
    const resultMkt = processTimesheetMktLogic({
      chargetocenterCode: isMktNorthBank 
        ? (chargeToCenterMKT || originalChargeCenter)
        : (chargeToCenterMKT || rawCenterName || originalChargeCenter),
      fileName,
      masterBank: bankVal,
      l07Input: l07Val
    });
    
    // Check condition again for fallback if needed
    const finalCenter = (isMKTFile && isMktNorthBank) ? resultMkt.chargeToCenterMkt : (originalChargeCenter || resultMkt.chargeToCenterMkt);
    const pivotCenterGroup = finalCenter || "N/A";

    // 5. Tính toán DURATION * 24 * 20000 (Xử lý định dạng HH:MM và Phân số của Excel)
    const rawDuration = row["Duration"] ?? row["DURATION"] ?? row["duration"] ?? 0;
    let durationInHours = 0;

    if (typeof rawDuration === "string" && rawDuration.includes(":")) {
      const [hours, minutes] = rawDuration.split(":");
      durationInHours = (parseInt(hours, 10) || 0) + ((parseInt(minutes, 10) || 0) / 60);
    } else {
      const numDuration = parseFloat(String(rawDuration).replace(",", ".")) || 0;
      durationInHours = numDuration > 0 && numDuration < 1 ? numDuration * 24 : numDuration;
    }

    const calculatedValue = Math.round(durationInHours * 20000);

    // Trả về dòng dữ liệu đã qua xử lý (center = result.l07)
    return {
      center: pivotCenterGroup || "N/A", // Gán kết quả result.l07 (Ví dụ: MKT LOCAL NORTH_TH, MKT LOCAL NORTH_TN...)
      type: String(row["Type"] || row["TYPE"] || row["type"] || row["Task Type"] || "Khác").trim(),
      value: calculatedValue,
      durationInHours,
    };
  });

  // 5. PIVOT dữ liệu theo Cột Type
  const pivotResult = transformed.reduce((acc, curr) => {
    if (!acc[curr.center]) acc[curr.center] = { Total: 0 };
    acc[curr.center][curr.type] = (acc[curr.center][curr.type] || 0) + curr.value;
    acc[curr.center]["Total"] += curr.value; // Cộng dồn dòng tổng
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return pivotResult;
}

/**
 * Gets the corresponding Mã AE based on L07
 */
export const getAeCodeFromL07 = (l07: string): string => {
  if (!l07) return "UNKNOWN";
  const info = getCenterInfoByL07(l07);
  return info ? info.aeCode : l07;
};

/**
 * Resolve L07 and BU from Charge to Center MKT
 */
export const resolveL07BuFromChargeToCenter = (rawChargeToCenter: string): { l07: string, bu: string } | null => {
  if (!rawChargeToCenter) return null;
  const l07 = mapChargeToCenterToL07(rawChargeToCenter) || rawChargeToCenter;
  return { l07, bu: getBusinessFromL07(l07) };
};

/**
 * Resolve L07 and BU from AE code (rCen)
 */
export const resolveL07BuFromAeCode = (rCen: string): { l07: string, bu: string } | null => {
  if (!rCen) return null;
  const l07 = mapAeCodeToL07(rCen) || rCen;
  return { l07, bu: getBusinessFromL07(l07) };
};

/**
 * Resolve L07 and BU from File Name
 */
export const resolveL07BuFromFile = (fileName: string): { l07: string, bu: string } | null => {
  if (!fileName) return null;
  
  const l07 = getL07FromFileName(fileName);
  if (!l07) return null;
  
  return { l07, bu: getBusinessFromL07(l07) };
};



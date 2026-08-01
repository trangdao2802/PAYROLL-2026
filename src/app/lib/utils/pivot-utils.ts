/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatPivotTypeHeader(typeRaw: string): string {
  if (!typeRaw) return "UNSPECIFIED";
  let t = String(typeRaw).trim();
  if (!t || t.toUpperCase() === "N/A" || t.toUpperCase() === "NAN") return "UNSPECIFIED";

  // Strip prefix "CHARGE TO " or "CHARGE " (case insensitive)
  if (/^CHARGE\s+TO\s+/i.test(t)) {
    t = t.replace(/^CHARGE\s+TO\s+/i, "").trim();
  } else if (/^CHARGE\s+/i.test(t)) {
    t = t.replace(/^CHARGE\s+/i, "").trim();
  }

  const cleanUpper = t.toUpperCase();
  if (cleanUpper === "ADD" || cleanUpper === "CANCEL") return "EXCLUDE";
  if (cleanUpper === "CENTER MKT" || cleanUpper === "MKT LOCAL NORTH" || cleanUpper === "MKT LOCAL") return "MKT LOCAL";
  if (!t) return "UNSPECIFIED";
  
  return t.toUpperCase();
}

export function sanitizePivotData(
  groupedData: Record<string, Record<string, Record<string, number>>>,
  typeColumns: string[] = []
) {
  const newGroupedData: Record<string, Record<string, Record<string, number>>> = {};
  const uniqueTypes = new Set<string>();

  if (groupedData) {
    Object.keys(groupedData).forEach(bu => {
      const buObj = groupedData[bu];
      if (!buObj) return;
      if (!newGroupedData[bu]) newGroupedData[bu] = {};

      Object.keys(buObj).forEach(l07 => {
        const l07Obj = buObj[l07];
        if (!l07Obj) return;
        if (!newGroupedData[bu][l07]) newGroupedData[bu][l07] = {};

        Object.keys(l07Obj).forEach(rawType => {
          const amount = l07Obj[rawType];
          if (!amount || isNaN(amount)) return;
          const cleanType = formatPivotTypeHeader(rawType);
          if (cleanType === "EXCLUDE" || cleanType === "ADD" || cleanType === "CANCEL") return;

          uniqueTypes.add(cleanType);

          if (!newGroupedData[bu][l07][cleanType]) {
            newGroupedData[bu][l07][cleanType] = 0;
          }
          newGroupedData[bu][l07][cleanType] += amount;
        });
      });
    });
  }

  if (typeColumns && typeColumns.length > 0) {
    typeColumns.forEach(t => {
      const clean = formatPivotTypeHeader(t);
      if (clean !== "EXCLUDE" && clean !== "ADD" && clean !== "CANCEL") {
        uniqueTypes.add(clean);
      }
    });
  }

  const sortedTypes = Array.from(uniqueTypes).sort((a, b) => {
    if (a === "MKT LOCAL") return -1;
    if (b === "MKT LOCAL") return 1;
    if (a === "UNSPECIFIED") return 1;
    if (b === "UNSPECIFIED") return -1;
    return a.localeCompare(b);
  });

  return {
    groupedData: newGroupedData,
    typeColumns: sortedTypes
  };
}

const KNOWN_NON_CHARGE_KEYS = new Set([
  "NO", "ID NUMBER", "FULL NAME", "BANK ACCOUNT NUMBER", "BANK NAME",
  "CITAD CODE", "TAX CODE", "CONTRACT NO", "TOTAL PAYMENT", "CENTER",
  "BUSINESS", "BU", "L07", "_RAWAE", "THÁNG", "SALARY SCALE", "FROM", "TO", "TYPE"
]);

export function buildPivotFromAppData(sheet1Rows: any[] = [], holdRows: any[] = [], rosterRows: any[] = []) {
  const newGroupedData: Record<string, Record<string, Record<string, number>>> = {};
  const uniqueTypes = new Set<string>();

  const parseMoney = (val: any): number => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const str = String(val).replace(/,/g, "").trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const addAmount = (buRaw: string, l07Raw: string, typeRaw: string, amount: number) => {
    if (!amount || isNaN(amount)) return;
    const bu = (buRaw || "UNKNOWN").trim().toUpperCase();
    const l07 = (l07Raw || "UNKNOWN").trim();
    if (l07.toUpperCase() === "MKT LOCAL NORTH") return;
    const type = formatPivotTypeHeader(typeRaw);

    if (type === "EXCLUDE" || type === "ADD" || type === "CANCEL") return;

    uniqueTypes.add(type);

    if (!newGroupedData[bu]) newGroupedData[bu] = {};
    if (!newGroupedData[bu][l07]) newGroupedData[bu][l07] = {};
    if (!newGroupedData[bu][l07][type]) newGroupedData[bu][l07][type] = 0;
    newGroupedData[bu][l07][type] += amount;
  };

  sheet1Rows.forEach((row) => {
    if (!row) return;
    const bu = row["Business"] || row["BU"] || "";
    const l07 = row["L07"] || row["Center"] || row["CHARGE TO CENTER"] || "";
    if (!l07) return;

    const centerHasMkt = String(l07).toUpperCase().includes("MKT");

    // Check if row contains individual charge columns
    let processedChargeCols = false;
    Object.keys(row).forEach((key) => {
      const uKey = key.toUpperCase().trim();
      if (KNOWN_NON_CHARGE_KEYS.has(uKey)) return;
      if (uKey.includes("CENTER") || uKey.includes("TRUNG TÂM")) return;

      if (uKey.includes("CHARGE") || uKey.startsWith("LDEC") || uKey.startsWith("LDEM") || uKey.startsWith("LPAR") || uKey.startsWith("LRET") || uKey.startsWith("MOTH")) {
        const amt = parseMoney(row[key]);
        const cleanType = formatPivotTypeHeader(key);
        if (amt !== 0 && cleanType !== "EXCLUDE" && cleanType !== "ADD" && cleanType !== "CANCEL") {
          if ((cleanType === "MKT LOCAL" || cleanType === "MKT LOCAL NORTH") && !centerHasMkt) {
            return;
          }
          processedChargeCols = true;
          addAmount(bu, l07, key, amt);
        }
      }
    });

    if (!processedChargeCols) {
      const totalPay = parseMoney(row["TOTAL PAYMENT"] || row["TOTAL"] || 0);
      const type = row["Type"] || row["LOẠI"] || row["Phân loại"] || row["Nghiệp vụ"] || "UNSPECIFIED";
      const cleanType = formatPivotTypeHeader(type);
      if (totalPay !== 0 && cleanType !== "EXCLUDE" && cleanType !== "ADD" && cleanType !== "CANCEL") {
        if ((cleanType === "MKT LOCAL" || cleanType === "MKT LOCAL NORTH") && !centerHasMkt) {
          return;
        }
        addAmount(bu, l07, type, totalPay);
      }
    }
  });

  holdRows.forEach((row) => {
    if (!row) return;
    const bu = row["Business"] || row["BU"] || "";
    const l07 = row["L07"] || row["Center"] || row["CHARGE TO CENTER"] || "";
    const totalPay = parseMoney(row["TOTAL PAYMENT"] || row["TOTAL"] || 0);
    const type = row["Type"] || row["LOẠI"] || row["Phân loại"] || row["Nghiệp vụ"] || "HOLD";
    const cleanType = formatPivotTypeHeader(type);
    if (totalPay !== 0 && l07 && cleanType !== "EXCLUDE" && cleanType !== "ADD" && cleanType !== "CANCEL") {
      addAmount(bu, l07, type, totalPay);
    }
  });

  rosterRows.forEach((row) => {
    if (!row) return;
    const center = row["chargeToCenterCode"] || row["CHARGE TO CENTER"] || row["Center"] || "";
    const duration = parseMoney(row["duration"] || row["DURATION"] || row["HOURS"] || 0);
    let salary = duration > 0 ? duration * 24 * 20000 : parseMoney(row["calculatedSalary"] || 0);
    const bu = row["bu"] || row["Business"] || "AHN";
    const l07 = row["l07"] || center;
    const rowType = row["type"] || row["Type"] || row["LOẠI"] || row["Phân loại"] || row["Nghiệp vụ"] || "MKT LOCAL";

    if (!l07 || String(l07).toUpperCase() === "MKT LOCAL NORTH" || String(center).toUpperCase() === "MKT LOCAL NORTH") {
      salary = 0;
    }

    if (salary > 0 && l07) {
      addAmount(bu, l07, rowType, salary);
    }
  });

  const sortedTypes = Array.from(uniqueTypes).sort((a, b) => {
    if (a === "MKT LOCAL") return -1;
    if (b === "MKT LOCAL") return 1;
    if (a === "UNSPECIFIED") return 1;
    if (b === "UNSPECIFIED") return -1;
    return a.localeCompare(b);
  });

  return { groupedData: newGroupedData, typeColumns: sortedTypes };
}

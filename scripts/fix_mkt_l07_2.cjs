const fs = require('fs');
let code = fs.readFileSync('src/app/lib/utils/center-utils.ts', 'utf8');

const regex = /export const resolveMktAndCenterL07 = \([\s\S]+?\}\s*;\s*\n\s*\n\/\*\*/;

const replacement = `export const resolveMktAndCenterL07 = (
  rCen: string,
  rawCharge: string,
  fileName: string,
  currentL07: string
): MktCenterResolveResult => {
  const norm = (s: string) =>
    s
      ? s
          .replace(/\\s+/g, " ")
          .normalize("NFD")
          .replace(/[\\u0300-\\u036f]/g, "")
          .toUpperCase()
          .replace(/[Đđ]/g, "D")
          .trim()
      : "";

  const normCen = norm(rCen);
  const fileUpper = fileName.toUpperCase();
  const normL07 = norm(currentL07);

  const isMktFile =
    fileUpper.includes("MKT") ||
    fileUpper.includes("MARKETING") ||
    fileUpper.includes("LOCAL NORTH");

  const isMktContext = isMktFile || normL07.includes("MKT LOCAL NORTH") || normCen === "NTW" || normCen.includes("MKT");

  if (isMktContext) {
    const searchVal = rawCharge || rCen;
    const mappedChargeMkt = resolveChargeToCenterMktCode(searchVal) || resolveChargeToCenterMktCode(rCen) || "MKT LOCAL NORTH";

    return {
      l07: "MKT LOCAL NORTH",
      business: "AHN",
      chargeToCenterMkt: mappedChargeMkt,
      isMktLocal: true,
      aeCode: mappedChargeMkt,
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
};

/**`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/lib/utils/center-utils.ts', code);

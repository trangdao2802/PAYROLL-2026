const fs = require('fs');

let centerUtils = fs.readFileSync('src/app/lib/utils/center-utils.ts', 'utf8');

// Fix NORMALIZED_AE_TO_L07
centerUtils = centerUtils.replace(/"MKT HP": "MKT LOCAL NORTH_HP",\s*"MKT TH": "MKT LOCAL NORTH_TH",\s*"MKT TN": "MKT LOCAL NORTH_TN",\s*"MKT PT": "MKT LOCAL NORTH_PT",/g, 
  '"MKT HP": "MKT LOCAL NORTH",\n  "MKT TH": "MKT LOCAL NORTH",\n  "MKT TN": "MKT LOCAL NORTH",\n  "MKT PT": "MKT LOCAL NORTH",');
centerUtils = centerUtils.replace(/"HAI PHONG": "MKT LOCAL NORTH_HP",\s*"THANH HOA": "MKT LOCAL NORTH_TH",\s*"THAI NGUYEN": "MKT LOCAL NORTH_TN",\s*"PHU THO": "MKT LOCAL NORTH_PT",/g, 
  '"HAI PHONG": "MKT LOCAL NORTH",\n  "THANH HOA": "MKT LOCAL NORTH",\n  "THAI NGUYEN": "MKT LOCAL NORTH",\n  "PHU THO": "MKT LOCAL NORTH",');

// Fix MKT_RAW_CENTER_TO_CHARGE_MAP
centerUtils = centerUtils.replace(/"MKT LOCAL NORTH_HP": "MKT LOCAL NORTH_HP",/g, '"MKT LOCAL NORTH_HP": "MKT LOCAL NORTH",');
centerUtils = centerUtils.replace(/"Hai Phong": "MKT LOCAL NORTH_HP",/g, '"Hai Phong": "Hai Phong",');

// Fix getBusinessFromL07
centerUtils = centerUtils.replace(/if \(upper === "MKT LOCAL NORTH_HP".+?return "AHP";\s*if \(upper === "MKT LOCAL NORTH_TH".+?return "ATH";\s*if \(upper === "MKT LOCAL NORTH_TN".+?return "ATN";\s*if \(upper === "MKT LOCAL NORTH_PT".+?return "APT";/s, '');

// Fix resolveMktAndCenterL07
const resolveMktAndCenterL07Regex = /if \(mappedChargeMkt === "MKT LOCAL NORTH_HP"[\s\S]+?\}\s*return \{/g;
centerUtils = centerUtils.replace(resolveMktAndCenterL07Regex, 'return {');

// Fix explicit override logic at end of resolveMktAndCenterL07
centerUtils = centerUtils.replace(/normL07 === "MKT LOCAL NORTH_HP" \|\|[\s\S]+?normL07 === "MKT LOCAL NORTH_PT" \|\|/g, '');
centerUtils = centerUtils.replace(/if \(normCen === "MKT HP"\) \{[\s\S]+?l07: "MKT LOCAL NORTH_PT",\s*business: "APT",\s*chargeToCenterMkt: "MKT LOCAL NORTH",\s*isMktLocal: true,\s*aeCode: "MKT LOCAL NORTH"\s*\};\s*\}/g, '');

fs.writeFileSync('src/app/lib/utils/center-utils.ts', centerUtils);

let timesheetSummary = fs.readFileSync('src/app/pages/01-timesheet/TimesheetSummary.tsx', 'utf8');
timesheetSummary = timesheetSummary.replace(/if \(isMktLocalNorthFile \|\| normCen === "HAI PHONG".+?\}\s*\}/s, `
  if (isMktLocalNorthFile || normCen === "HAI PHONG" || normCen === "THANH HOA" || normCen === "THAI NGUYEN" || normL07.startsWith("MKT LOCAL NORTH")) {
    if (normCen === "HAI PHONG" || rawCenter.toUpperCase().includes("HAI PHONG") || chargeToCenterMkt.toUpperCase().includes("HAI PHONG")) {
      l07 = "MKT LOCAL NORTH";
      business = "AHP";
      chargeToCenterMkt = "Hai Phong";
    } else if (normCen === "THANH HOA" || rawCenter.toUpperCase().includes("THANH HOA") || chargeToCenterMkt.toUpperCase().includes("THANH HOA") || chargeToCenterMkt === "TH0001.TPU") {
      l07 = "MKT LOCAL NORTH";
      business = "ATH";
      chargeToCenterMkt = "TH0001.TPU";
    } else if (normCen === "THAI NGUYEN" || rawCenter.toUpperCase().includes("THAI NGUYEN") || chargeToCenterMkt.toUpperCase().includes("THAI NGUYEN") || chargeToCenterMkt === "TN0001.LNQ") {
      l07 = "MKT LOCAL NORTH";
      business = "ATN";
      chargeToCenterMkt = "TN0001.LNQ";
    } else if (normCen === "PHU THO" || rawCenter.toUpperCase().includes("PHU THO") || chargeToCenterMkt.toUpperCase().includes("PHU THO") || chargeToCenterMkt === "PT0001.HVG") {
      l07 = "MKT LOCAL NORTH";
      business = "APT";
      chargeToCenterMkt = "PT0001.HVG";
    } else {
      l07 = "MKT LOCAL NORTH";
      business = "AHN";
    }
  }
`);
fs.writeFileSync('src/app/pages/01-timesheet/TimesheetSummary.tsx', timesheetSummary);

let aeDataConfig = fs.readFileSync('src/app/pages/03-master/AEDataConfig.tsx', 'utf8');
aeDataConfig = aeDataConfig.replace(/l07Upper === "MKT LOCAL NORTH_TH" \|\|[\s\S]+?l07Upper === "MKT LOCAL NORTH_HP" \|\|/g, '');
fs.writeFileSync('src/app/pages/03-master/AEDataConfig.tsx', aeDataConfig);

let pivotSheet = fs.readFileSync('src/app/pages/04-balance/PivotSheet.tsx', 'utf8');
pivotSheet = pivotSheet.replace(/center === "MKT LOCAL NORTH_HP" \|\| /g, '');
fs.writeFileSync('src/app/pages/04-balance/PivotSheet.tsx', pivotSheet);

let constants = fs.readFileSync('src/app/constants.ts', 'utf8');
constants = constants.replace(/.*MKT LOCAL NORTH_TH.*/g, '');
constants = constants.replace(/.*MKT LOCAL NORTH_TN.*/g, '');
constants = constants.replace(/.*MKT LOCAL NORTH_HP.*/g, '');
constants = constants.replace(/.*MKT LOCAL NORTH_PT.*/g, '');
fs.writeFileSync('src/app/constants.ts', constants);

console.log("Done fixing MKT LOCAL NORTH suffixes");

import { mapAE } from "../src/app/lib/ae-mapper";

const sampleAeMap = {
  "HANOI CENTER": { name: "HN-01", bus: "Retail" },
  "CN-TPHCM": { name: "HCMC-01", bus: "Enterprise" },
  "CN HCMC": { name: "HCMC-01", bus: "Enterprise" },
};

const cases: Array<{ input: any; expectedL07?: string }> = [
  { input: "HANOI CENTER", expectedL07: "HN-01" },
  { input: "hanoi center", expectedL07: "HN-01" },
  { input: "Hà Nội Center", expectedL07: "HN-01" },
  { input: "CN TPHCM", expectedL07: "HCMC-01" },
  { input: "C N - TPHCM", expectedL07: "HCMC-01" },
  { input: "UNKNOWN", expectedL07: "" },
];

let failed = 0;
for (const c of cases) {
  const out = mapAE(c.input, sampleAeMap);
  const ok = out.l07 === (c.expectedL07 || "");
  console.log("IN:", c.input, "=>", out, ok ? "OK" : "FAIL");
  if (!ok) failed++;
}

if (failed > 0) {
  console.error(`${failed} tests failed`);
  process.exit(2);
} else {
  console.log("All reMap tests passed");
  process.exit(0);
}

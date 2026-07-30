import { getCenterInfoByAECode, resolveMktAndCenterL07 } from "./../lib/utils/center-utils";
import { removeVietnameseTones } from "./../lib/utils/data-utils";

export function mapAE(rawCenterVal: string | unknown, aeMap: Record<string, any> | undefined) {
  const raw = String(rawCenterVal || "").trim();
  const rawKey = raw.toUpperCase();

  let l07: string | undefined = undefined;
  let business: string | undefined = undefined;

  try {
    if (aeMap && aeMap[rawKey]) {
      l07 = aeMap[rawKey].name;
      business = aeMap[rawKey].bus;
    } else if (aeMap) {
      // Fuzzy normalized lookup: strip diacritics and spaces
      const normalizedRaw = removeVietnameseTones(raw).replace(/\s+/g, "").toUpperCase();
      let foundKey: string | undefined = undefined;
      for (const k of Object.keys(aeMap || {})) {
        const nk = removeVietnameseTones(k).replace(/\s+/g, "").toUpperCase();
        if (nk === normalizedRaw || nk.includes(normalizedRaw) || normalizedRaw.includes(nk)) {
          foundKey = k;
          break;
        }
      }
      if (foundKey) {
        l07 = aeMap[foundKey].name;
        business = aeMap[foundKey].bus;
      }
    }

    if (!l07 || !business) {
      const info = getCenterInfoByAECode(raw);
      if (info) {
        l07 = info.l07;
        business = info.bus;
      }
    }

    // Final MKT override resolution
    if (l07) {
      try {
        const mktRes = resolveMktAndCenterL07(raw, "", "", l07);
        if (mktRes && mktRes.isMktLocal) {
          l07 = mktRes.l07;
          business = mktRes.business;
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // defensive fallback
  }

  return { l07: l07 || "", business: business || "" };
}

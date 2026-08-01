/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { Download, RefreshCw, FileSpreadsheet, Eye, ArrowUpDown, Upload, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { useAppData } from "../../lib/contexts/AppDataContext";
import { toast } from "sonner";

// ==========================================
// MAPPING DEFINITIONS & LOGIC FROM USER SPEC
// ==========================================

const rawCenterToMktMap: Record<string, string> = {
  "Ly Thai To": "BN0001.LTT", "Tu Son": "BN0002.TSN", "Pho Hue": "HN0001.PHY",
  "Thai Ha": "HN0002.THA", "Hoang Quoc Viet": "HN0003.HQV", "Lieu Giai": "HN0004.LGI",
  "Nguyen Van Linh": "HN0005.NVL", "Van Quan": "HN0007.VQN", "The Garden": "HN0010.MDH",
  "Nguyen Huu Tho": "HN0012.NHT", "Tan Mai": "HN0014.TMI", "Van Phu": "HN0015.VPU",
  "Phan Dinh Phung": "HN0016.PDP", "Ham Nghi": "HN0017.HNI", "Vu Tong Phan": "HN0018.VTP",
  "Nguyen Tuan": "HN0019.NTN", "Ngoai Giao Doan": "HN0021.NGD", "Mo Lao": "HN0022.NVO",
  "Linh Dam": "HN0023.LDM", "Times City": "HN0024.TCY", "Le Trong Tan": "HN0025.LTT",
  "Viet Hung": "HN0026.VHG", "Ocean Park": "HN0027.OPK", "Pham Van Dong": "HN0028.PVD",
  "Vu Pham Ham": "HN0029.VPH", "An Khanh": "HN0030.AKH", "An Hung": "HN0031.AHG",
  "Lac Long Quan": "HN0032.LLQ", "Dong Anh": "HN0033.DAH", "Hong Tien": "HN0034.HTN",
  "Ecopark": "HY0001.ECP", "Hai Phong": "Hai Phong", "Quang Ninh": "QN0001.HLG",
  "Vinh": "VIN001.CTG", "Vinh Phuc": "VP0001.PCT", "Thanh Hoa": "TH0001.TPU",
  "Thai Nguyen": "TN0001.LNQ", "Phu Tho": "PT0001.HVG", "NTW": "NTW"
};

const aeCodeToL07Map: Record<string, string> = {
  "Ngo Si Lien": "BN0001.LTT",
  "Tu Son": "BN0002.TSN",
  "Pho Hue Junior": "HN0001.PHY",
  "Pho Hue": "HN0001.PHY",
  "Thai Ha": "HN0002.THA",
  "Thai Ha (center Láng Hạ)": "HN0002.THA",
  "Thai Ha (center Lang Ha)": "HN0002.THA",
  "Hoang Quoc Viet": "HN0003.HQV",
  "Lieu Giai": "HN0004.LGI",
  "Nguyen Van Linh": "HN0005.NVL",
  "Van Quan": "HN0007.VQN",
  "My Dinh": "HN0010.MDH",
  "The Garden": "HN0010.MDH",
  "Hoang Mai": "HN0012.NHT",
  "Nguyen Huu Tho": "HN0012.NHT",
  "Tan Mai": "HN0014.TMI",
  "Van Phu": "HN0015.VPU",
  "Phan Dinh Phung": "HN0016.PDP",
  "Ham Nghi": "HN0017.HNI",
  "Vu Tong Phan": "HN0018.VTP",
  "Nguyen Tuan": "HN0019.NTN",
  "Ngoai Giao Doan": "HN0021.NGD",
  "Nguyen Van Loc": "HN0022.NVO",
  "Mo Lao": "HN0022.NVO",
  "Linh Dam": "HN0023.LDM",
  "TIMES CITY": "HN0024.TCY",
  "Le Trong Tan": "HN0025.LTT",
  "Viet Hung": "HN0026.VHG",
  "Ocepark": "HN0027.OPK",
  "Ocean Park": "HN0027.OPK",
  "Pham Van Dong": "HN0028.PVD",
  "Vu Pham Ham": "HN0029.VPH",
  "An Khanh": "HN0030.AKH",
  "An Hung": "HN0031.AHG",
  "Xuan Dieu (đổi thành Lạc Long Quân)": "HN0032.LLQ",
  "Xuan Dieu": "HN0032.LLQ",
  "Lac Long Quan": "HN0032.LLQ",
  "HN33.DAH": "HN0033.DAH",
  "Dong Anh": "HN0033.DAH",
  "HN34.HTN": "HN0034.HTN",
  "Hong Tien": "HN0034.HTN",
  "Ecopark": "HY0001.ECP",
  "Hai Phong": "Hai Phong",
  "Hai Phong 1": "HP0001.LHP",
  "Hai Phong 2": "HP0002.HBT",
  "Hai Phong 3": "HP0003.VIN",
  "Ha Long": "QN0001.HLG",
  "Quang Ninh": "QN0001.HLG",
  "Vinh": "VIN001.CTG",
  "Vinh Phuc": "VP0001.PCT",
  "TH01.TPU": "TH0001.TPU",
  "Thanh Hoa": "TH0001.TPU",
  "TN01.LNQ": "TN0001.LNQ",
  "Thai Nguyen": "TN0001.LNQ",
  "PT01.HVG": "PT0001.HVG",
  "Phu Tho": "PT0001.HVG",
  "Apollo Advance -South": "AA",
  "ASP - HN": "HN0200.ASP",
  "MKT LOCAL NORTH": "MKT LOCAL NORTH",
  "Cambridge": "ZHN0000.GY",
  "MKT HP": "MKT LOCAL NORTH_HP",
  "MKT TN01.LNQ": "MKT LOCAL NORTH_TN",
  "MKT PT01.HVG": "MKT LOCAL NORTH_PT",
  "MKT TH01.TPU": "MKT LOCAL NORTH_TH",
  "Contest": "ZHN0000.GY"
};

function extractBankName(fileName: string, bankLabel?: string) {
  if (bankLabel) {
    const upperBank = bankLabel.toUpperCase();
    if (upperBank.includes("MKT")) return "MKT LOCAL";
  }
  const name = fileName.toUpperCase().replace(/\.[^/.]+$/, "");
  const tokens = name.replace(/[^A-Z0-9]/g, ' ').split(/\s+/);
  
  if (tokens.includes('MKT')) return 'MKT LOCAL';
  if (tokens.includes('TH')) return 'TH';
  if (tokens.includes('HP')) return 'HP';
  if (tokens.includes('TN')) return 'TN';
  if (tokens.includes('PT')) return 'PT';
  if (tokens.includes('NORTH')) return 'NORTH';
  
  return 'NORTH';
}

function processNorthLogic(rawCenter: string) {
  const cleaned = rawCenter ? String(rawCenter).trim() : "";
  let l07 = cleaned;

  for (const [key, value] of Object.entries(aeCodeToL07Map)) {
    if (key.toUpperCase() === cleaned.toUpperCase()) {
      l07 = value;
      break;
    }
  }

  if (l07 === cleaned) {
    const upperClean = cleaned.toUpperCase();
    if (upperClean.includes("THAI HA") || upperClean.includes("THÁI HÀ")) l07 = "HN0002.THA";
    else if (upperClean.includes("XUAN DIEU") || upperClean.includes("XUÂN DIỆU") || upperClean.includes("LAC LONG QUAN") || upperClean.includes("LẠC LONG QUÂN")) l07 = "HN0032.LLQ";
    else if (upperClean.includes("OCEAN PARK") || upperClean.includes("OCEPARK")) l07 = "HN0027.OPK";
  }

  let bu = "OTHER";
  if (l07 === "AA" || l07 === "ZHN0000.GY" || l07 === "HN0200.ASP" || l07.startsWith("HN") || l07.startsWith("BN") || l07.startsWith("HY") || l07.startsWith("QN") || l07.startsWith("VIN") || l07.startsWith("VP") || l07 === "MKT LOCAL NORTH") {
    bu = "AHN";
  } else if (l07.startsWith("HP") || l07.toUpperCase() === "HAI PHONG" || l07 === "MKT LOCAL NORTH_HP") {
    bu = "AHP";
  } else if (l07.startsWith("TN") || l07 === "MKT LOCAL NORTH_TN") {
    bu = "ATN";
  } else if (l07.startsWith("TH") || l07 === "MKT LOCAL NORTH_TH") {
    bu = "ATH";
  } else if (l07.startsWith("PT") || l07 === "MKT LOCAL NORTH_PT") {
    bu = "APT";
  }

  return { chargeToCenterMkt: "", l07, bu };
}

function processTimesheetMktLogic(inputData: { chargetocenterCode: string }) {
  const { chargetocenterCode } = inputData;
  const cleaned = chargetocenterCode ? String(chargetocenterCode).trim() : "";
  let chargeToCenterMkt = cleaned;

  for (const [key, value] of Object.entries(rawCenterToMktMap)) {
    if (key.toUpperCase() === cleaned.toUpperCase()) {
      chargeToCenterMkt = value;
      break;
    }
  }

  if (chargeToCenterMkt === cleaned) {
    const upperClean = cleaned.toUpperCase();
    if (upperClean.includes("THAI HA") || upperClean.includes("THÁI HÀ")) chargeToCenterMkt = "HN0002.THA";
    else if (upperClean.includes("XUAN DIEU") || upperClean.includes("XUÂN DIỆU") || upperClean.includes("LAC LONG QUAN") || upperClean.includes("LẠC LONG QUÂN")) chargeToCenterMkt = "HN0032.LLQ";
    else if (upperClean.includes("OCEAN PARK") || upperClean.includes("OCEPARK")) chargeToCenterMkt = "HN0027.OPK";
  }

  const l07 = chargeToCenterMkt;
  let bu = "OTHER";

  if (l07 === "AA" || l07 === "ZHN0000.GY" || l07 === "HN0200.ASP" || l07.startsWith("HN") || l07.startsWith("BN") || l07.startsWith("HY") || l07.startsWith("QN") || l07.startsWith("VIN") || l07.startsWith("VP")) {
    bu = "AHN";
  } else if (l07.startsWith("HP") || l07.toUpperCase() === "HAI PHONG") {
    bu = "AHP";
  } else if (l07.startsWith("TN") || l07 === "Thai Nguyen") {
    bu = "ATN";
  } else if (l07.startsWith("TH") || l07 === "Thanh Hoa") {
    bu = "ATH";
  } else if (l07.startsWith("PT") || l07 === "Phu Tho") {
    bu = "APT";
  }

  return { chargeToCenterMkt, l07, bu };
}

// ==========================================
// PIVOT SHEET COMPONENT
// ==========================================

export function PivotSheet() {
  const { appData } = useAppData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [groupedData, setGroupedData] = useState<Record<string, Record<string, Record<string, number>>>>(() => {
    try {
      const cached = localStorage.getItem("pivot_master_processed_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.groupedData || {};
      }
    } catch (e) {
      console.warn("Error reading pivot cache", e);
    }
    return {};
  });
  const [typeColumns, setTypeColumns] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem("pivot_master_processed_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.typeColumns || [];
      }
    } catch {
      // ignore cache error
    }
    return [];
  });
  const [diagnosticLogs, setDiagnosticLogs] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem("pivot_master_processed_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.diagnosticLogs || [];
      }
    } catch {
      // ignore cache error
    }
    return [];
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_sourceInfo, _setSourceInfo] = useState<string>(() => {
    try {
      const cached = localStorage.getItem("pivot_master_processed_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.sourceInfo || "";
      }
    } catch {
      // ignore cache error
    }
    return "";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPivotSheetVisible, setIsPivotSheetVisible] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset to page 1 when rowsPerPage or groupedData changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, groupedData, typeColumns]);

  const processFileBuffers = useCallback(async (fileList: { name: string; bank?: string; buffer: ArrayBuffer }[]) => {
    const newGroupedData: Record<string, Record<string, Record<string, number>>> = {};
    const uniqueTypes = new Set<string>();
    const newLogs: any[] = [];

    for (const item of fileList) {
      try {
        const displayBankName = extractBankName(item.name, item.bank);
        const processType = (displayBankName === 'MKT LOCAL') ? "MKT LOCAL NORTH" : "NORTH";
        
        const workbook = XLSX.read(item.buffer, { type: "array" });
        let targetSheetName = "";

        if (processType === "MKT LOCAL NORTH") {
          targetSheetName = workbook.SheetNames.find(n => 
            n.toUpperCase().includes('ROSTER') || n.toUpperCase().includes('Q_ROSTER')
          ) || "";
          if (!targetSheetName) continue;
        } else {
          targetSheetName = workbook.SheetNames.find(n => 
            n.toUpperCase() === 'SHEET 1' || n.toUpperCase() === 'SHEET1'
          ) || workbook.SheetNames[0];
        }

        const worksheet = workbook.Sheets[targetSheetName];
        if (!worksheet) continue;

        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (jsonData.length <= 1) continue;

        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(15, jsonData.length); r++) {
          const row = jsonData[r];
          if (!row || row.length === 0) continue;
          const rowStr = row.join(' ').toUpperCase();
          if (rowStr.includes('CENTER') || rowStr.includes('CHARGE') || rowStr.includes('TYPE') || rowStr.includes('MÃ TT')) {
            headerRowIdx = r;
            break;
          }
        }

        const headers = jsonData[headerRowIdx];
        if (!headers) continue;

        if (processType === "NORTH") {
          const centerColIdx = headers.findIndex((h: any) => {
            if (!h) return false;
            const val = String(h).trim().toUpperCase();
            return val === 'CENTER' || val === 'CENTERS' || val === 'CENTER CODE' || val === 'MÃ TT' || val.includes('TRUNG TÂM');
          });

          const bankAccColIdx = headers.findIndex((h: any) => {
            if (!h) return false;
            const val = String(h).trim().toUpperCase();
            return val === 'BANK ACCOUNT NUMBER' || val.includes('BANK ACCOUNT');
          });

          if (centerColIdx === -1 || bankAccColIdx === -1) continue;

          const chargeCols: { index: number; label: string }[] = [];
          headers.forEach((h: any, idx: number) => {
            if (h && String(h).toUpperCase().includes('CHARGE')) {
              let label = String(h).toUpperCase().replace('CHARGE TO ', '').replace('CHARGE ', '').trim();
              if (label === '') label = 'OTHER';
              chargeCols.push({ index: idx, label });
              uniqueTypes.add(label);
            }
          });

          for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const bankAccVal = row[bankAccColIdx];
            if (bankAccVal === undefined || bankAccVal === null || String(bankAccVal).trim() === "") {
              continue;
            }

            const rawCenter = row[centerColIdx];
            if (!rawCenter) continue;

            if (String(rawCenter).toUpperCase().includes("MKT")) {
              continue;
            }

            const mapped = processNorthLogic(String(rawCenter));
            const { bu, l07 } = mapped;

            if (!newGroupedData[bu]) newGroupedData[bu] = {};
            if (!newGroupedData[bu][l07]) newGroupedData[bu][l07] = {};

            chargeCols.forEach(col => {
              const rawVal = row[col.index];
              let val = parseFloat(rawVal);
              if (isNaN(val)) val = 0;

              if (val === 0 && rawVal) {
                newLogs.push({ Source: "NORTH", File: item.name, RawCenter: rawCenter, Column: col.label, RawValue: rawVal });
              }

              if (!newGroupedData[bu][l07][col.label]) {
                newGroupedData[bu][l07][col.label] = 0;
              }
              newGroupedData[bu][l07][col.label] += val;
            });
          }
        } else if (processType === "MKT LOCAL NORTH") {
          const centerColIdx = headers.findIndex((h: any) => {
            if (!h) return false;
            const val = String(h).trim().toUpperCase();
            return val === 'CHARGE TO CENTER' || val === 'CHARGETOCENTERCODE' || val.includes('CHARGE TO CENTER');
          });
          const typeColIdx = headers.findIndex((h: any) => h && String(h).trim().toUpperCase() === 'TYPE');
          const durationColIdx = headers.findIndex((h: any) => h && String(h).trim().toUpperCase() === 'DURATION');

          if (centerColIdx === -1) continue;

          for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const rawCenter = row[centerColIdx];
            if (!rawCenter) continue;

            let durationVal = (durationColIdx !== -1) ? parseFloat(row[durationColIdx]) : 0;
            if (isNaN(durationVal)) durationVal = 0;
            const calculatedSalary = durationVal * 24 * 20000;

            let typeVal = (typeColIdx !== -1 && row[typeColIdx]) ? String(row[typeColIdx]).trim().toUpperCase() : "UNSPECIFIED";
            if (typeVal === "") typeVal = "BLANK";
            uniqueTypes.add(typeVal);

            const mapped = processTimesheetMktLogic({ chargetocenterCode: String(rawCenter) });
            const { bu, l07 } = mapped;

            if (!newGroupedData[bu]) newGroupedData[bu] = {};
            if (!newGroupedData[bu][l07]) newGroupedData[bu][l07] = {};

            if (!newGroupedData[bu][l07][typeVal]) {
              newGroupedData[bu][l07][typeVal] = 0;
            }
            newGroupedData[bu][l07][typeVal] += calculatedSalary;
          }
        }
      } catch (err) {
        console.error("Error processing file buffer:", item.name, err);
      }
    }

    // Cleanup UNSPECIFIED if 0
    let unspecifiedTotal = 0;
    for (const bu in newGroupedData) {
      for (const l07 in newGroupedData[bu]) {
        unspecifiedTotal += newGroupedData[bu][l07]["UNSPECIFIED"] || 0;
      }
    }
    if (unspecifiedTotal === 0) {
      uniqueTypes.delete("UNSPECIFIED");
    }

    return {
      groupedData: newGroupedData,
      typeColumns: Array.from(uniqueTypes).sort(),
      logs: newLogs,
    };
  }, []);

  const loadMasterData = useCallback(async (showToastMsg = false) => {
    const cachedStr = localStorage.getItem("pivot_master_processed_data");
    let hasCache = false;
    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (parsed.groupedData && Object.keys(parsed.groupedData).length > 0) {
          hasCache = true;
        }
      } catch {
        // ignore cache parse error
      }
    }

    if (!hasCache) {
      setIsProcessing(true);
    }

    try {
      const masterRows = appData.Ae_Global_Inputs || [];
      const fileBuffers: { name: string; bank?: string; buffer: ArrayBuffer }[] = [];

      for (const row of masterRows) {
        if (row.fileObj && row.fileObj instanceof File) {
          const buffer = await row.fileObj.arrayBuffer();
          fileBuffers.push({ name: row.fileName || row.fileObj.name, bank: row.bank, buffer });
        }
      }

      if (fileBuffers.length > 0) {
        const res = await processFileBuffers(fileBuffers);
        setGroupedData(res.groupedData);
        setTypeColumns(res.typeColumns);
        setDiagnosticLogs(res.logs);
        const infoStr = `Đồng bộ từ ${fileBuffers.length} file Master`;
        _setSourceInfo(infoStr);

        try {
          localStorage.setItem("pivot_master_processed_data", JSON.stringify({
            groupedData: res.groupedData,
            typeColumns: res.typeColumns,
            diagnosticLogs: res.logs,
            sourceInfo: infoStr,
            updatedAt: Date.now()
          }));
        } catch {
          // ignore cache write error
        }

        if (showToastMsg) {
          toast.success(`Đã đồng bộ ${fileBuffers.length} file từ bảng Cài đặt & tải file (Master)`);
        }
      } else {
        if (masterRows.length === 0) {
          setGroupedData({});
          setTypeColumns([]);
          setDiagnosticLogs([]);
          _setSourceInfo("");
          localStorage.removeItem("pivot_master_processed_data");
        }
        if (showToastMsg) {
          toast.info("Chưa có file nào trong bảng Cài đặt & tải file (Master)");
        }
      }
    } catch (err) {
      console.error("Error loading master data:", err);
      if (showToastMsg) {
        toast.error("Lỗi khi xử lý dữ liệu từ bảng Master");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [appData.Ae_Global_Inputs, processFileBuffers]);

  useEffect(() => {
    loadMasterData(false);
  }, [loadMasterData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const fileBuffers: { name: string; buffer: ArrayBuffer }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = await file.arrayBuffer();
        fileBuffers.push({ name: file.name, buffer });
      }

      const res = await processFileBuffers(fileBuffers);
      setGroupedData(res.groupedData);
      setTypeColumns(res.typeColumns);
      setDiagnosticLogs(res.logs);
      const infoStr = `Tải trực tiếp từ ${fileBuffers.length} file vừa chọn`;
      _setSourceInfo(infoStr);
      try {
        localStorage.setItem("pivot_master_processed_data", JSON.stringify({
          groupedData: res.groupedData,
          typeColumns: res.typeColumns,
          diagnosticLogs: res.logs,
          sourceInfo: infoStr,
          updatedAt: Date.now()
        }));
      } catch {
        // ignore cache write error
      }
      toast.success(`Đã xử lý xong ${fileBuffers.length} file tải lên trực tiếp`);
    } catch (err) {
      console.error("Error processing manual upload:", err);
      toast.error("Lỗi khi xử lý các file vừa chọn");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadDiagnosticCSV = () => {
    setIsSettingsOpen(false);
    if (diagnosticLogs.length === 0) {
      toast.info("Không có dòng log lỗi nào cần kiểm tra.");
      return;
    }

    const headers = ["Source", "File", "RawCenter", "Column", "RawValue"];
    const csvRows = [headers.join(",")];

    diagnosticLogs.forEach(log => {
      const row = [
        `"${log.Source || ""}"`,
        `"${log.File || ""}"`,
        `"${String(log.RawCenter || "").replace(/"/g, '""')}"`,
        `"${log.Column || ""}"`,
        `"${String(log.RawValue || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pivot-diagnostic-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    setIsSettingsOpen(false);
    if (Object.keys(groupedData).length === 0) {
      toast.error("Không có dữ liệu để xuất Excel!");
      return;
    }

    const wsData: any[][] = [];
    const headers = ["No.", "BU", "L07", ...typeColumns, "TỔNG CỘNG"];
    wsData.push(headers);

    let rowId = 1;
    const grandTotals = new Array(typeColumns.length).fill(0);
    let superGrandTotal = 0;
    const sortedBUs = Object.keys(groupedData).sort();

    sortedBUs.forEach(bu => {
      const buTotals = new Array(typeColumns.length).fill(0);
      let buGrandTotal = 0;
      const l07s = Object.keys(groupedData[bu]).sort();

      l07s.forEach(l07 => {
        let rowTotal = 0;
        const rowVals = typeColumns.map((type, idx) => {
          const val = groupedData[bu][l07][type] || 0;
          buTotals[idx] += val;
          grandTotals[idx] += val;
          rowTotal += val;
          return val;
        });
        buGrandTotal += rowTotal;
        superGrandTotal += rowTotal;

        wsData.push([rowId++, bu, l07, ...rowVals, rowTotal]);
      });

      wsData.push(["", bu, `${bu} Total`, ...buTotals, buGrandTotal]);
    });

    wsData.push(["", "", "TỔNG CỘNG", ...grandTotals, superGrandTotal]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pivot_Data");
    XLSX.writeFile(wb, "Pivot_Salary_Report.xlsx");
    toast.success("Đã xuất báo cáo Excel thành công!");
  };

  let totalCenters = 0;
  let totalSalarySum = 0;
  const grandTotals = new Array(typeColumns.length).fill(0);
  let superGrandTotal = 0;

  const allFlatRows: Array<{
    globalRowId: number;
    bu: string;
    l07: string;
    values: number[];
    rowTotal: number;
  }> = [];

  let rIdx = 1;
  const sortedBUs = Object.keys(groupedData).sort();
  sortedBUs.forEach(bu => {
    const l07s = Object.keys(groupedData[bu]).sort();
    l07s.forEach(l07 => {
      let rowTotal = 0;
      const values = typeColumns.map((type, idx) => {
        const val = groupedData[bu][l07][type] || 0;
        grandTotals[idx] += val;
        rowTotal += val;
        return val;
      });

      if (rowTotal === 0 && bu === "OTHER" && (l07 === "UNKNOWN" || !l07)) {
        return;
      }

      totalCenters++;
      superGrandTotal += rowTotal;
      totalSalarySum += rowTotal;

      allFlatRows.push({
        globalRowId: rIdx++,
        bu,
        l07,
        values,
        rowTotal
      });
    });
  });

  // Sorting
  const sortedFlatRows = useMemo(() => {
    if (!sortField) return allFlatRows;
    return [...allFlatRows].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      if (sortField === "no") {
        valA = a.globalRowId;
        valB = b.globalRowId;
      } else if (sortField === "bu") {
        valA = a.bu;
        valB = b.bu;
      } else if (sortField === "l07") {
        valA = a.l07;
        valB = b.l07;
      } else if (sortField === "rowTotal") {
        valA = a.rowTotal;
        valB = b.rowTotal;
      } else if (sortField.startsWith("type_")) {
        const typeName = sortField.replace("type_", "");
        const typeIdx = typeColumns.indexOf(typeName);
        if (typeIdx !== -1) {
          valA = a.values[typeIdx] || 0;
          valB = b.values[typeIdx] || 0;
        }
      }
      if (typeof valA === "string") {
        const cmp = valA.localeCompare(valB, 'vi');
        return sortDirection === "asc" ? cmp : -cmp;
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedData, typeColumns, sortField, sortDirection]);

  const totalRowsCount = sortedFlatRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRowsCount / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalRowsCount === 0 ? 0 : (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRowsCount);
  const paginatedRows = sortedFlatRows.slice(startIndex, endIndex);

  const renderRows = () => {
    if (paginatedRows.length === 0) {
      return (
        <tr>
          <td colSpan={4 + typeColumns.length} className="py-12 text-center text-slate-400 text-sm bg-white">
            <span>Chưa có dữ liệu. Vui lòng tải file ở bảng <span className="font-semibold text-slate-600">Cài đặt & Tải file (Master)</span> và nhấn <span className="font-semibold text-slate-600">Xử lý dữ liệu</span>.</span>
          </td>
        </tr>
      );
    }

    return paginatedRows.map((item, idx) => (
      <tr 
        key={`${item.bu}-${item.l07}`} 
        className={`transition-colors border-b border-[#e7dbdc] ${idx % 2 === 0 ? "bg-white" : "bg-[#FAF9F6]/40"} hover:bg-amber-50/40`}
      >
        {!hiddenColumns.no && (
          <td className="py-2 px-2.5 sm:px-3 text-center border-r border-b border-[#e7dbdc] font-mono text-slate-600 text-xs">{item.globalRowId}</td>
        )}
        {!hiddenColumns.business && (
          <td className="py-2 px-3 sm:px-3.5 text-center border-r border-b border-[#e7dbdc] font-bold text-slate-800 text-xs bg-slate-50/50">{item.bu}</td>
        )}
        {!hiddenColumns.charge && (
          <td className="py-2 px-3 sm:px-3.5 text-left border-r border-b border-[#e7dbdc] text-slate-800 font-medium truncate max-w-[240px] text-xs" title={item.l07}>{item.l07}</td>
        )}
        {typeColumns.map((type, tIdx) => {
          if (hiddenColumns[`type_${type}`]) return null;
          const val = item.values[tIdx];
          return (
            <td key={type} className="py-2 px-3 sm:px-3.5 text-right border-r border-b border-[#e7dbdc] font-mono text-slate-700 text-xs">
              {val === 0 ? <span className="text-slate-300">0</span> : val.toLocaleString('vi-VN')}
            </td>
          );
        })}
        {!hiddenColumns.grandTotal && (
          <td className="py-2 px-3 sm:px-3.5 text-right border-r border-b border-[#e7dbdc] font-bold text-[#781D1D] bg-amber-50/40 font-mono text-xs">
            {item.rowTotal === 0 ? <span className="text-slate-300">0</span> : Math.round(item.rowTotal).toLocaleString('vi-VN')}
          </td>
        )}
      </tr>
    ));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-white rounded-none border border-[#e7dbdc] shadow-2xs relative z-10">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        id="pivot-upload"
        onChange={handleFileUpload}
      />
      {/* TOP HEADER TOOLBAR & STATS BADGES */}
      <div 
        className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#e7dbdc]"
        style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#781D1D] shrink-0 inline-block"></span>
          <span className="text-[#781D1D] font-extrabold uppercase tracking-wider" style={{ fontSize: "13px" }}>
            PHÂN BỔ CHI LƯƠNG (PIVOT MASTER)
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right px-3 py-1 bg-white rounded border border-[#e7dbdc]/80 shadow-2xs">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SỐ TRUNG TÂM</p>
            <p className="text-sm font-bold text-slate-800 font-mono leading-tight">{totalCenters}</p>
          </div>
          <div className="text-right px-3 py-1 bg-white rounded border border-[#e7dbdc]/80 shadow-2xs">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">TỔNG CHI PHÍ (VNĐ)</p>
            <p className="text-sm font-bold text-[#781D1D] font-mono leading-tight">{Math.round(totalSalarySum).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* PIVOT TABLE DISPLAY WITH HIGH-CONTRAST HEADERS & GRIDLINES */}
      <div className="overflow-auto relative flex-1 custom-scrollbar bg-white">
        {isPivotSheetVisible && (
          <table className="w-full text-right text-xs whitespace-nowrap border-separate border-spacing-0">
            <thead 
              className="text-[#781D1D] font-bold uppercase text-[11px] border-b border-[#e7dbdc] sticky top-0 z-30 shadow-2xs"
              style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
            >
              <tr>
                {!hiddenColumns.no && (
                  <th 
                    onClick={() => handleSort("no")}
                    className="py-2.5 px-2.5 sm:px-3 text-center border-r border-b border-[#e7dbdc] min-w-[44px] sticky top-0 cursor-pointer hover:bg-slate-200/60 transition-colors select-none text-[#781D1D]"
                    style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>No.</span>
                      <ArrowUpDown className="w-3 h-3 text-[#781D1D]/60 shrink-0" />
                    </div>
                  </th>
                )}
                {!hiddenColumns.business && (
                  <th 
                    onClick={() => handleSort("bu")}
                    className="py-2.5 px-3 sm:px-3.5 text-center border-r border-b border-[#e7dbdc] min-w-[80px] sticky top-0 cursor-pointer hover:bg-slate-200/60 transition-colors select-none text-[#781D1D]"
                    style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Business</span>
                      <ArrowUpDown className="w-3 h-3 text-[#781D1D]/60 shrink-0" />
                    </div>
                  </th>
                )}
                {!hiddenColumns.charge && (
                  <th 
                    onClick={() => handleSort("l07")}
                    className="py-2.5 px-3 sm:px-3.5 text-center border-r border-b border-[#e7dbdc] min-w-[180px] sticky top-0 cursor-pointer hover:bg-slate-200/60 transition-colors select-none text-[#781D1D]"
                    style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>L07</span>
                      <ArrowUpDown className="w-3 h-3 text-[#781D1D]/60 shrink-0" />
                    </div>
                  </th>
                )}
                {typeColumns.map(type => {
                  if (hiddenColumns[`type_${type}`]) return null;
                  return (
                    <th 
                      key={type} 
                      onClick={() => handleSort(`type_${type}`)}
                      className="py-2.5 px-3 sm:px-3.5 text-center border-r border-b border-[#e7dbdc] min-w-[90px] sticky top-0 cursor-pointer hover:bg-slate-200/60 transition-colors select-none text-[#781D1D]"
                      style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{type}</span>
                        <ArrowUpDown className="w-3 h-3 text-[#781D1D]/60 shrink-0" />
                      </div>
                    </th>
                  );
                })}
                {!hiddenColumns.grandTotal && (
                  <th 
                    onClick={() => handleSort("rowTotal")}
                    className="py-2.5 px-3 sm:px-3.5 text-center border-r border-b border-[#e7dbdc] min-w-[110px] bg-amber-100/70 text-[#781D1D] font-bold sticky top-0 cursor-pointer hover:bg-amber-200/70 transition-colors select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>TỔNG CỘNG</span>
                      <ArrowUpDown className="w-3 h-3 text-[#781D1D] shrink-0" />
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7dbdc] border-b border-[#e7dbdc] text-slate-700 font-medium">
              {renderRows()}
            </tbody>
            <tfoot 
              className="font-bold text-[#781D1D] sticky bottom-[-1px] z-20 shadow-[0_-2px_6px_rgba(0,0,0,0.06)]"
              style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
            >
              <tr style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}>
                {!hiddenColumns.no && (
                  <td 
                    className="py-2.5 px-2.5 sm:px-3 text-center border-r border-t border-b border-[#e7dbdc]"
                    style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                  ></td>
                )}
                {!hiddenColumns.business && (
                  <td 
                    className="py-2.5 px-3 sm:px-3.5 text-center border-r border-t border-b border-[#e7dbdc]"
                    style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                  ></td>
                )}
                {!hiddenColumns.charge && (
                  <td 
                    className="py-2.5 px-3 sm:px-3.5 text-left border-r border-t border-b border-[#e7dbdc] uppercase tracking-wide font-bold text-[#781D1D]"
                    style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                  >TỔNG CỘNG ({totalRowsCount})</td>
                )}
                {grandTotals.map((v, idx) => {
                  const type = typeColumns[idx];
                  if (hiddenColumns[`type_${type}`]) return null;
                  return (
                    <td 
                      key={`grand-${idx}`} 
                      className="py-2.5 px-3 sm:px-3.5 text-right border-r border-t border-b border-[#e7dbdc] text-[#781D1D] font-mono font-bold"
                      style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
                    >
                      {v === 0 ? "0" : Math.round(v).toLocaleString('vi-VN')}
                    </td>
                  );
                })}
                {!hiddenColumns.grandTotal && (
                  <td className="py-2.5 px-3 sm:px-3.5 text-right border-r border-t border-b border-[#e7dbdc] text-[#781D1D] font-black bg-amber-100/90 font-mono">
                    {superGrandTotal === 0 ? "0" : Math.round(superGrandTotal).toLocaleString('vi-VN')}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* FOOTER BAR WITH PAGE SIZE, SETTINGS ICON MENU, AND PAGINATION */}
      <div 
        className="px-4 py-[12px] border-t border-[#e7dbdc] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700"
        style={{ backgroundColor: "var(--table-header-bg, #FAF9F6)" }}
      >
        {/* LEFT SIDE: PAGE SIZE DROPDOWN & SETTINGS ICON BUTTON */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#e7dbdc] rounded-lg pl-2.5 pr-6 text-[9.5px] font-extrabold uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#781D1D]/20 shadow-3xs cursor-pointer h-6.5"
            >
              <option value={50} className="text-[10px] text-slate-700 font-semibold bg-white">50 dòng</option>
              <option value={100} className="text-[10px] text-slate-700 font-semibold bg-white">100 dòng</option>
              <option value={10000} className="text-[10px] text-slate-700 font-semibold bg-white">Tất cả</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* SETTINGS / ACTION MENU BUTTON IN FOOTER */}
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-7 h-7 bg-white border border-[#e7dbdc] rounded-lg hover:bg-slate-100 transition-colors text-slate-700 shadow-2xs cursor-pointer flex items-center justify-center"
              title="Cài đặt & Tác vụ Pivot"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 text-slate-700 ${isProcessing ? "animate-spin" : ""}`} />
            </button>

            {isSettingsOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 text-slate-700 text-xs font-medium divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {/* Section 1: Quick Actions */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tác vụ Bảng</div>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      loadMasterData(true);
                    }}
                    disabled={isProcessing}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-600 ${isProcessing ? "animate-spin" : ""}`} />
                    <div>
                      <div className="font-semibold text-slate-800">Đồng bộ từ Cài đặt Master</div>
                      <div className="text-[10px] text-slate-400 font-normal">Cập nhật dữ liệu từ danh sách file Master đã tải</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Tải file Excel mới</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tải trực tiếp file Excel dữ liệu Pivot</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      handleExportExcel();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Xuất Báo Cáo Excel</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tải về file Excel Pivot hiện tại</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      handleDownloadDiagnosticCSV();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-800">Tải Logs CSV</div>
                      <div className="text-[10px] text-slate-400 font-normal">Xuất dữ liệu log kiểm tra các dòng lỗi</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsPivotSheetVisible(!isPivotSheetVisible);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="font-semibold text-slate-800">{isPivotSheetVisible ? "Ẩn Bảng Pivot" : "Hiện Bảng Pivot"}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Bật/tắt hiển thị dữ liệu bảng</div>
                    </div>
                  </button>
                </div>

                {/* Section 2: Column Visibility */}
                <div className="p-3 space-y-2">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Ẩn / Hiện Cột</span>
                    <button
                      onClick={() => setHiddenColumns({})}
                      className="text-[10px] text-primary hover:underline font-normal cursor-pointer"
                    >
                      Hiện tất cả
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.no}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, no: !e.target.checked }))}
                        className="rounded border-[#e7dbdc] text-primary focus:ring-primary"
                      />
                      <span>NO.</span>
                    </label>
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.business}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, business: !e.target.checked }))}
                        className="rounded border-[#e7dbdc] text-primary focus:ring-primary"
                      />
                      <span>Business</span>
                    </label>
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.charge}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, charge: !e.target.checked }))}
                        className="rounded border-[#e7dbdc] text-primary focus:ring-primary"
                      />
                      <span>CHARGE TO CENTER MKT / L07</span>
                    </label>
                    {typeColumns.map(type => (
                      <label key={type} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns[`type_${type}`]}
                          onChange={(e) => setHiddenColumns(prev => ({ ...prev, [`type_${type}`]: !e.target.checked }))}
                          className="rounded border-[#e7dbdc] text-primary focus:ring-primary"
                        />
                        <span className="truncate" title={type}>{type}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.grandTotal}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, grandTotal: !e.target.checked }))}
                        className="rounded border-[#e7dbdc] text-primary focus:ring-primary"
                      />
                      <span>TỔNG CỘNG</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: PAGINATION CONTROLS */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#e7dbdc] bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Trang đầu"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#e7dbdc] bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <span className="px-3 text-[11px] leading-[14px] font-bold text-slate-800 uppercase tracking-wide">
            TRANG {validCurrentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={validCurrentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#e7dbdc] bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={validCurrentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(totalPages)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#e7dbdc] bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Trang cuối"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

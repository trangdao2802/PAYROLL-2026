import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Download,
  Settings,
  RefreshCw,
  Trash2,
  Copy,
  Plus,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useAppData } from "../../lib/contexts/AppDataContext";
import { isSupabaseConfigured } from "../../lib/supabase";
import { syncRosterToSupabase, SQL_SETUP_SCRIPT } from "../../lib/supabase-sync-utils";
import { useTimesheetCalculations } from "../../hooks/useTimesheetCalculations";
import { getDynamicEmployeeColumns, CENTER_COLUMNS } from "../../constants/timesheet-columns";
import { TimesheetInputTable } from "./components/TimesheetInputTable";
import type { TimesheetInputRow } from "./components/TimesheetInputTable";
import { AppData } from "../../types";
import {
  getL07FromFileName,
  getCenterInfoByL07,
  getCenterInfoByAECode,
  mapL07,
  getBusinessFromL07,
} from "../../lib/utils/center-utils";
import { 
  generateUUID, 
  prepareDataForExport,
  getVal,
  getExcelFileBuffer,
  fetchGoogleSheetAsFile,
} from "../../lib/utils/data-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

import ExcelWorker from "../../workers/excelParser.worker?worker&inline";
import { parseExcelData } from "../../workers/excelParser.worker";

const parseExcelInWorker = async (file: File): Promise<Record<string, unknown>[]> => {
  const { buffer, name } = await getExcelFileBuffer(file);

  const runMainThreadFallback = (): Record<string, unknown>[] => {
    console.warn("ExcelWorker failed or is unavailable. Executing parsing on main thread as a fallback.");
    return parseExcelData(buffer, name);
  };

  return new Promise((resolve, reject) => {
    try {
      const worker = new ExcelWorker();
      worker.onmessage = (e: MessageEvent) => {
        worker.terminate();
        if (e.data && e.data.success) {
          resolve(e.data.allRows as Record<string, unknown>[]);
        } else {
          try {
            const fallbackData = runMainThreadFallback();
            resolve(fallbackData);
          } catch {
            reject(new Error(e.data?.error || "Unknown error parsing Excel file"));
          }
        }
      };
      worker.onerror = (err) => {
        worker.terminate();
        try {
          const fallbackData = runMainThreadFallback();
          resolve(fallbackData);
        } catch {
          reject(err);
        }
      };
      worker.postMessage({ fileBuffer: buffer, fileName: name });
    } catch (err) {
      try {
        const fallbackData = runMainThreadFallback();
        resolve(fallbackData);
      } catch {
        reject(err);
      }
    }
  });
};

const mapExcelRosterRow = (row: Record<string, unknown>, fileName?: string, fileId?: string) => {
  const rawCenter = String(getVal(row, ["cơ sở", "trung tâm", "chi nhánh", "center code", "office code", "center", "mã ae", "ae", "ae code"]) || "").trim();
  const info = getCenterInfoByAECode(rawCenter);
  let l07 = info?.l07 || rawCenter || "UNKNOWN";
  let business = info?.bus || "";
  const ma_nv = String(getVal(row, ["id number", "id", "teacher id", "emp id", "mã nv", "manv", "code"]) || "").trim();
  const full_name = String(getVal(row, ["full name", "name", "teacher name", "tên", "họ và tên", "họ tên"]) || "").trim();
  const ngayRaw = getVal(row, ["date", "ngay", "ngày", "tk_date", "session date", "sessiondate", "ngày học", "scheduledate", "ngày làm việc", "ngày tháng"]);
  const ngay = ngayRaw !== undefined && ngayRaw !== null ? String(ngayRaw).trim() : "";
  const type = String(getVal(row, ["type", "type code", "type_code", "typecode", "task type", "task", "loại", "loại hoạt động", "event type", "activity", "category", "task type name", "taskType"]) || "").trim();
  const className = String(getVal(row, ["class", "class code", "class_code", "classcode", "lớp", "class name", "mã lớp", "tên lớp", "code", "mã lớp học", "classCode"]) || "").trim();
  const gio_vao = String(getVal(row, ["from", "start", "start time", "từ", "giờ bắt đầu"]) || "").trim();
  const gio_ra = String(getVal(row, ["to", "end", "end time", "đến", "giờ kết thúc"]) || "").trim();
  
  const rawDuration = getVal(row, ["duration", "quy ra số giờ làm", "total", "actual hours", "working hours", "giờ làm", "số giờ", "hours", "tk_duration", "total hours", "tổng giờ", "time", "thời lượng"]);
  let duration = 0;
  if (typeof rawDuration === "number") {
    duration = rawDuration;
  } else if (rawDuration) {
    const sv = String(rawDuration).trim().replace(",", ".");
    if (sv.includes(":")) {
      const p = sv.split(":");
      duration = (parseInt(p[0]) || 0) + (parseInt(p[1]) || 0) / 60;
    } else {
      duration = parseFloat(sv) || 0;
    }
  }
  
  const notes = String(getVal(row, ["notes", "note", "ghi chú", "ghi chu", "remarks"]) || "").trim().replace(/^["']|["']$/g, "");
  let chargeToCenterMkt = String(getVal(row, ["charge to center mkt", "charge to center", "chargetocenter"]) || "").trim();

  // OVERRIDE FOR MKT LOCAL NORTH CENTERS
  const fnUpper = fileName ? fileName.toUpperCase() : "";
  const isMktLocalNorthFile = fnUpper.includes("MKT") || fnUpper.includes("MARKETING");
  const normCen = rawCenter ? rawCenter.replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[Đđ]/g, "D").trim() : "";
  const normL07 = l07 ? l07.replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[Đđ]/g, "D").trim() : "";

  
  
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



  const finalType = type;
  const finalClass = className;

  return {
    center: rawCenter,
    l07,
    business,
    ma_nv,
    full_name,
    ngay,
    type: finalType,
    class: finalClass,
    gio_vao,
    gio_ra,
    chargeToCenterMkt,
    duration,
    notes,
    
    employeeId: ma_nv,
    fullName: full_name,
    maAE: rawCenter,
    date: ngay,
    taskType: finalType,
    classCode: finalClass,
    from: gio_vao,
    to: gio_ra,
    _sourceFile: fileName || row._sourceFile || "",
    _rowId: fileId || row._rowId || "",
    _uuid: row._uuid || generateUUID()
  };
};

const DEFAULT_FOLDER_URL = "https://drive.google.com/drive/folders/1gU6Hcrv94Bx_yv1qNTqH0vQNy7ElKzXJ";

interface TimesheetSummaryPageProps {
  onBack?: () => void;
}

export default function TimesheetSummaryPage({ onBack }: TimesheetSummaryPageProps = {}) {
  const { appData, updateAppData } = useAppData();

  const [activeTab] = useState<"files">("files");
  const [fromDate] = useState("");
  const [toDate] = useState("");
  const [debouncedFromDate, setDebouncedFromDate] = useState("");
  const [debouncedToDate, setDebouncedToDate] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [totalSyncRows, setTotalSyncRows] = useState(0);
  const [syncedRowsCount, setSyncedRowsCount] = useState(0);
  const [showSqlDialog, setShowSqlDialog] = useState(false);

  const [isFetchingGgSheet, setIsFetchingGgSheet] = useState(false);
  const [, setRefreshKey] = useState(0);

  const handleUrlInput = async (id: string, url: string) => {
    if (!url.trim()) return;
    const isFolder = url.includes("folders/") || url.includes("drive/folders/") || url.includes("?id=");

    setIsFetchingGgSheet(true);
    try {
      if (isFolder) {
        let folderId = url.trim();
        const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
        if (match) {
          folderId = match[1];
        } else {
          try {
            const urlObj = new URL(url);
            if (urlObj.searchParams.has("id")) {
              folderId = urlObj.searchParams.get("id") || folderId;
            }
          } catch { /* ignore */ }
        }

        const response = await fetch(`/api/drive-folder-files?folderId=${encodeURIComponent(folderId)}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Không thể lấy danh sách file từ thư mục. Vui lòng kiểm tra lại link hoặc quyền chia sẻ.");
        }

        const data = await response.json();
        if (!data.success || !data.files || data.files.length === 0) {
          throw new Error("Không tìm thấy file nào trong thư mục này.");
        }

        const driveFiles = (data.files || []).filter((f: Record<string, unknown>) => {
          const name = String(f.name || "").toLowerCase();
          return !name.includes("copy");
        });

        if (driveFiles.length === 0 && data.files.length > 0) {
          throw new Error("Tất cả các file trong thư mục đều là file 'copy' nên hệ thống tự động bỏ qua.");
        }

        toast.info(`Tìm thấy ${driveFiles.length} file hợp lệ. Đang tự động đối chiếu và nạp dữ liệu...`);

        const currentInputs = [...(appData.Timesheet_InputList || [])];
        const toProcess: { id: string; file: File }[] = [];
        let successCount = 0;
        let skipCount = 0;

        for (const f of driveFiles) {
          const fileName = String(f.name || "");
          const l07 = getL07FromFileName(fileName) || "";
          if (!l07) {
            skipCount++;
            continue;
          }
          const centerInfo = getCenterInfoByL07(l07);
          const aeCode = centerInfo?.aeCode || "";
          const bu = getBusinessFromL07(l07);

          // Matching logic similar to bulk Excel upload
          let matchIndex = currentInputs.findIndex((r) => {
            const rowL07 = r.l07 ? mapL07(r.l07).toLowerCase() : "";
            const rowAE = r.aeCode ? r.aeCode.toLowerCase() : "";
            const matchL07 = l07 && rowL07 === l07.toLowerCase();
            const matchAE = aeCode && rowAE === aeCode.toLowerCase();
            return matchL07 || matchAE;
          });

          if (matchIndex === -1) {
            matchIndex = currentInputs.findIndex(r => !r.l07 && !r.fileName && (r.status === "pending" || r.status === "ready"));
          }

          let rowId: string;
          if (matchIndex !== -1) {
            rowId = currentInputs[matchIndex].id;
            currentInputs[matchIndex] = {
              ...currentInputs[matchIndex],
              l07: l07,
              aeCode: aeCode,
              bus: bu,
              status: "processing",
            };
          } else {
            rowId = crypto.randomUUID();
            currentInputs.push({
              id: rowId,
              l07: l07,
              aeCode: aeCode,
              bus: bu,
              status: "processing",
              url: ""
            });
          }

          const sheetUrl = `https://docs.google.com/spreadsheets/d/${f.id}`;
          const fileContent = JSON.stringify({ url: sheetUrl });
          const blob = new Blob([fileContent], { type: 'application/json' });
          let name = fileName;
          if (!name.toLowerCase().endsWith(".gsheet")) {
            name = name.replace(/\.(xlsx|xls|csv)$/i, "") + ".gsheet";
          }
          const fileObj = new File([blob], name, { type: 'application/json' });
          toProcess.push({ id: rowId, file: fileObj });
          successCount++;
        }

        if (successCount > 0) {
          // Set matched rows to a "ready" status first, but don't start processing yet
          const readyInputs = currentInputs.map(r => {
            const match = toProcess.find(tp => tp.id === r.id);
            if (match && r.status !== "success") {
              return { ...r, status: "ready" as const };
            }
            return r;
          });
          
          updateAppData(prev => ({ ...prev, Timesheet_InputList: readyInputs }), false);
          
          // Sequential processing with delay
          for (let i = 0; i < toProcess.length; i++) {
            const item = toProcess[i];
            
            // 1. Set individual row to processing for UI feedback
            handleUpdateRow(item.id, "status", "processing");
            
            // 2. Process the file (this includes the fetch)
            try {
              await handleUploadFile(item.id, item.file);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error(`Failed to process ${item.file.name}:`, err);
              handleUpdateRow(item.id, "status", "error");
              toast.error(`Lỗi xử lý ${item.file.name}: ${msg}`);
            }
            
            // 3. Wait 1500ms before next file to avoid rate limits (except for the last one)
            if (i < toProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
          
          toast.success(`Đã nạp xong từ thư mục! Thành công: ${successCount} trung tâm${skipCount > 0 ? `, Bỏ qua: ${skipCount}` : ""}.`);
        } else {
          toast.warning(`Không tìm thấy trung tâm nào khớp với các file trong thư mục.`);
        }
      } else {
        const selectedRow = inputRows.find(r => r.id === id);
        const l07 = selectedRow?.l07 || "GoogleSheet";
        
        const file = await fetchGoogleSheetAsFile(url, `${l07}_GoogleSheet.gsheet`);
        await handleUploadFile(id, file);
        toast.success(`Đã nạp dữ liệu từ link cho trung tâm ${l07}!`);
      }
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Lỗi xử lý link";
      toast.error(msg);
    } finally {
      setIsFetchingGgSheet(false);
    }
  };

  const lastSummaryRef = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFromDate(fromDate);
      setDebouncedToDate(toDate);
    }, 500);
    return () => clearTimeout(timer);
  }, [fromDate, toDate]);

  useEffect(() => {
    if (!debouncedFromDate || !debouncedToDate) return;

    updateAppData((prev) => {
      if (
        prev.Timesheet_Dates?.from === debouncedFromDate &&
        prev.Timesheet_Dates?.to === debouncedToDate
      ) {
        return prev;
      }

      return {
        ...prev,
        Timesheet_Dates: { from: debouncedFromDate, to: debouncedToDate },
      };
    }, false);
  }, [debouncedFromDate, debouncedToDate, updateAppData]);



  const rosterData = useMemo(() => appData.Q_Roster || [], [appData.Q_Roster]);
  const salaryScaleData = useMemo(() => appData.Q_Salary_Scale || [], [appData.Q_Salary_Scale]);
  const staffData = useMemo(() => appData.Q_Staff || [], [appData.Q_Staff]);
  const cacheData = useMemo(() => appData.Q_Cache || [], [appData.Q_Cache]);
  const inputRows = useMemo(() => appData.Timesheet_InputList || [
    { id: "1", l07: "", aeCode: "", bus: "", url: "", status: "pending" },
  ], [appData.Timesheet_InputList]);

  const handleAddRow = () => {
    updateAppData((prev) => ({
      ...prev,
      Timesheet_InputList: [
        ...inputRows,
        {
          id: generateUUID(),
          l07: "",
          aeCode: "",
          bus: "",
          url: "",
          status: "pending",
        },
      ],
    }));
  };
  const handleUpdateRow = (
    id: string,
    field: keyof TimesheetInputRow,
    val: string | number | boolean | Record<string, unknown> | undefined,
  ) => {
    updateAppData(
      (prev) => ({
        ...prev,
        Timesheet_InputList: (prev.Timesheet_InputList || []).map((r) => {
          if (r.id === id) {
            const updated = { ...r, [field]: val };
            if (
              (field === "l07" && val === "MKT LOCAL NORTH") ||
              (field === "aeCode" && (val === "MKT LOCAL NORTH" || val === "NTW"))
            ) {
              updated.url = "https://docs.google.com/spreadsheets/d/1z7DJYJAyWqBw8IXNYbEIHhGXBMumsRA4rUHT1prBsFo/edit?gid=1119129159#gid=1119129159";
            }
            return updated;
          }
          return r;
        }),
      }),
      false,
    );
  };
  const handleClearRow = (id: string) => {
    updateAppData((prev) => ({
      ...prev,
      Timesheet_InputList: (prev.Timesheet_InputList || []).map((r) =>
        r.id === id
          ? {
              ...r,
              url: "",
              fileName: undefined,
              sheetName: undefined,
              status: "pending",
              count: undefined,
              date: undefined,
              columnMapping: undefined,
            }
          : r,
      ),
      Q_Roster: (prev.Q_Roster || []).filter((r) => r._rowId !== id),
      Q_Salary_Scale: (prev.Q_Salary_Scale || []).filter((r) => r._rowId !== id),
      Q_Staff: (prev.Q_Staff || []).filter((r) => r._rowId !== id),
      Q_Cache: (prev.Q_Cache || []).filter((r) => r._rowId !== id),
    }));
  };
  const handleClearAll = () => {
    updateAppData((prev) => ({
      ...prev,
      Timesheet_InputList: (prev.Timesheet_InputList || []).map((r) => ({
        ...r,
        url: "",
        fileName: undefined,
        sheetName: undefined,
        status: "pending",
        count: undefined,
        date: undefined,
        columnMapping: undefined,
      })),
      Q_Roster: [],
      Q_Salary_Scale: [],
      Q_Staff: [],
      Q_Cache: [],
    }));
    toast?.success("Đã xóa toàn bộ dữ liệu (đã giữ lại thông tin center).");
  };

  const handleClearEmptyL07 = () => {
    updateAppData((prev) => ({
      ...prev,
      Timesheet_InputList: (prev.Timesheet_InputList || []).filter(
        (r) => r.l07 && r.l07.trim() !== "",
      ),
    }));
    toast?.success("Đã xóa các dòng chưa có mã L07.");
  };

  useEffect(() => {
    if (rosterData.length === 0) return;

    const centerSet = new Map<
      string,
      { l07: string; aeCode: string; bus: string }
    >();
    rosterData.forEach((t) => {
      const rawCenterCol = String(
        getVal(t, ["center", "location", "cơ sở"]) || "",
      ).trim();
      const rawAECol = String(getVal(t, ["mã ae", "ae"]) || "").trim();
      const info =
        getCenterInfoByAECode(rawAECol) ||
        getCenterInfoByL07(rawCenterCol) ||
        getCenterInfoByL07(mapL07(rawCenterCol));

      const l07 = info?.l07 || rawCenterCol || rawAECol || "UNKNOWN";
      const aeCode = info?.aeCode || rawAECol || "";
      const bus = info?.bus || "";
      const key = `${l07}|${aeCode}|${bus}`;

      if (!centerSet.has(key)) {
        centerSet.set(key, { l07, aeCode, bus });
      }
    });

    updateAppData((prev) => {
      const currentInputs = prev.Timesheet_InputList || [];
      const existingKeys = new Set(
        currentInputs.map((r) => `${r.l07}|${r.aeCode}|${r.bus}`),
      );
      
      let hasChanges = false;
      let newInputs = [...currentInputs];

      if (
        centerSet.size > 0 &&
        newInputs.length === 1 &&
        !newInputs[0].l07 &&
        !newInputs[0].url
      ) {
        newInputs = [];
        hasChanges = true;
      }

      centerSet.forEach((val, key) => {
        if (!existingKeys.has(key)) {
          const defaultUrl = val.l07 === "MKT LOCAL NORTH"
            ? "https://docs.google.com/spreadsheets/d/1z7DJYJAyWqBw8IXNYbEIHhGXBMumsRA4rUHT1prBsFo/edit?gid=1119129159#gid=1119129159"
            : "";
          newInputs.push({
            id: generateUUID(),
            l07: val.l07,
            aeCode: val.aeCode,
            bus: val.bus,
            url: defaultUrl,
            status: "pending",
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        return {
          ...prev,
          Timesheet_InputList: newInputs,
        };
      }
      return prev;
    }, false);
  }, [rosterData, updateAppData]);

  const handleRecalculate = () => {
    setRefreshKey((prev) => prev + 1);
    toast?.success("Đã tổng hợp lại dữ liệu.");
  };

  const handleSaveData = async () => {
    updateAppData(prev => ({
      ...prev,
      updatedAt: new Date().toISOString()
    }), true);
    
    if (isSupabaseConfigured()) {
      toast.info("Đang tự động đồng bộ dữ liệu hiện tại lên Supabase...");
      await handleSyncToSupabase();
    } else {
      toast.success("Đã lưu dữ liệu hiện tại offline thành công!");
    }
  };

  const handleSyncToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase chưa được cấu hình! Vui lòng cài đặt URL và Anon Key trong phần cấu hình.");
      return;
    }

    if (!rosterData || rosterData.length === 0) {
      toast.warning("Không có dữ liệu Roster để đồng bộ.");
      return;
    }

    setIsSyncing(true);
    setTotalSyncRows(rosterData.length);
    setSyncedRowsCount(0);
    setSyncProgress(0);

    try {
      const dataToSync = (computedData.processedRosterData && computedData.processedRosterData.length > 0) 
        ? computedData.processedRosterData 
        : rosterData;

      const { successCount, totalRows } = await syncRosterToSupabase(
        dataToSync as Record<string, unknown>[],
        (current, total) => {
          setSyncedRowsCount(current);
          setTotalSyncRows(total);
          setSyncProgress(Math.round((current / total) * 100));
        }
      );

      toast.success(`Đồng bộ thành công ${successCount.toLocaleString()}/${totalRows.toLocaleString()} dòng lên Supabase.`);
      
      updateAppData((prev: AppData) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        lastSupabaseSyncAt: new Date().toISOString()
      }), true);
      toast.success("Đã tự động lưu cứng dữ liệu trên web.");
    } catch (err: unknown) {
      console.error("Supabase Sync Error:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      
      if (errMsg.includes("Failed to fetch") || errMsg.includes("fetch")) {
        errMsg = "Không thể kết nối tới Supabase (Failed to fetch). Vui lòng kiểm tra lại URL Supabase trong phần Settings và đảm bảo Project của bạn đang hoạt động (không bị tạm dừng).";
      }

      // Detailed alert as requested for debugging RLS and column issues
      alert('Lỗi Supabase: ' + errMsg);
      toast.error(`Đồng bộ thất bại: ${errMsg}`);
      if (errMsg.includes("Bảng 'roster_cham_cong' chưa tồn tại") || errMsg.includes("Thiếu cột 'charge_to_center_mkt'")) {
        setShowSqlDialog(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReloadFromFolder = async (id: string, l07: string) => {
    if (!l07) {
      toast.error("Không có mã L07 để tìm kiếm.");
      return;
    }

    setIsFetchingGgSheet(true);
    try {
      let folderId = "";
      const match = DEFAULT_FOLDER_URL.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (match) {
        folderId = match[1];
      }

      if (!folderId) throw new Error("Thư mục mặc định không hợp lệ.");

      const response = await fetch(`/api/drive-folder-files?folderId=${encodeURIComponent(folderId)}`);
      if (!response.ok) {
        throw new Error("Không thể lấy danh sách file từ thư mục. Vui lòng kiểm tra lại quyền truy cập.");
      }

      const data = await response.json();
      if (!data.success || !data.files || data.files.length === 0) {
        throw new Error("Không tìm thấy file nào trong thư mục.");
      }

      const driveFiles = (data.files || []).filter((f: { name: string; id: string }) => !String(f.name).toLowerCase().includes("copy"));
      
      const file = driveFiles.find((f: { name: string; id: string }) => {
        const fileL07 = getL07FromFileName(f.name);
        return fileL07 && fileL07.toLowerCase() === l07.toLowerCase();
      });

      if (!file) {
        toast.error(`Không tìm thấy file nào cho trung tâm ${l07} trong thư mục GDrive.`);
        return;
      }

      const url = `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
      handleUpdateRow(id, "url", url);
      handleUpdateRow(id, "fileName", file.name);

      toast.success(`Đã tìm thấy link cho ${l07}. Đang tự động đồng bộ...`);
      setTimeout(() => {
        handleSyncRow(id);
      }, 500);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi tìm link.";
      toast.error(errorMsg);
    } finally {
      setIsFetchingGgSheet(false);
    }
  };

  const handleSyncRow = async (id: string, urlOverride?: string) => {
    const row = (appData.Timesheet_InputList || []).find(r => r.id === id);
    if (!row) {
      toast.error("Không tìm thấy dòng tương ứng.");
      return;
    }
    const finalUrl = urlOverride || row.url;
    if (!finalUrl) {
      toast.error("Vui lòng nhập URL/ID Google Sheet trước.");
      return;
    }

    handleUpdateRow(id, "status", "processing");
    if (urlOverride) {
      handleUpdateRow(id, "url", urlOverride);
    }
    try {
      const file = await fetchGoogleSheetAsFile(finalUrl, row.sheetName || "Sheet1");
      if (file) {
         const allRows = await parseExcelInWorker(file);
         
         updateAppData((prev) => {
            const next = { ...prev };
            next.Q_Roster = (next.Q_Roster || []).filter(r => r._rowId !== id);
            const mapped = allRows.map(r => mapExcelRosterRow(r, file.name, id));
            next.Q_Roster = next.Q_Roster.concat(mapped);
            
            const newList = (prev.Timesheet_InputList || []).map(r => 
              r.id === id ? { 
                ...r, 
                status: "success", 
                count: mapped.length, 
                date: new Date().toLocaleString(), 
                fileName: file.name,
                url: finalUrl
              } : r
            );
            next.Timesheet_InputList = newList;
            return next;
         }, true);
         
         toast.success(`Đã đồng bộ ${row.l07}: ${allRows.length} dòng.`);
      } else {
        throw new Error("Không lấy được nội dung file.");
      }
    } catch (err: unknown) {
      console.error(err);
      handleUpdateRow(id, "status", "error");
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Lỗi: ${msg}`);
      if (msg.includes("BẠN CHƯA CẤP QUYỀN")) {
        alert(msg);
      }
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    const currentInputs = appData.Timesheet_InputList || [];
    const updatedInputs = [...currentInputs];
    const toProcess: { id: string; file: File }[] = [];
    let hasChanges = false;

    const filteredFiles = files.filter(f => !f.name.toLowerCase().includes("copy"));
    if (filteredFiles.length === 0 && files.length > 0) {
      toast.info("Tất cả các file đã chọn đều là file copy nên hệ thống tự động bỏ qua.");
      return;
    }

    for (const file of filteredFiles) {
      const l07 = getL07FromFileName(file.name) || "";
      const centerInfo = l07 ? getCenterInfoByL07(l07) : null;
      const aeCode = centerInfo?.aeCode || "";

      const matchIndex = updatedInputs.findIndex((r) => {
        const matchL07 =
          l07 && r.l07 && r.l07.toLowerCase() === l07.toLowerCase();
        const matchAE =
          aeCode && r.aeCode && r.aeCode.toLowerCase() === aeCode.toLowerCase();
        return matchL07 || matchAE;
      });

      if (matchIndex !== -1) {
        updatedInputs[matchIndex] = {
          ...updatedInputs[matchIndex],
          status: "processing",
        };
        toProcess.push({ id: updatedInputs[matchIndex].id, file });
        hasChanges = true;
      } else {
        const defaultUrl = l07 === "MKT LOCAL NORTH"
          ? "https://docs.google.com/spreadsheets/d/1z7DJYJAyWqBw8IXNYbEIHhGXBMumsRA4rUHT1prBsFo/edit?gid=1119129159#gid=1119129159"
          : "";
        const newId = crypto.randomUUID();
        updatedInputs.push({
          id: newId,
          l07: l07,
          aeCode: aeCode,
          bus: centerInfo?.bus || "",
          status: "processing",
          url: defaultUrl
        });
        toProcess.push({ id: newId, file });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updateAppData(
        (prev) => ({
          ...prev,
          Timesheet_InputList: updatedInputs,
        }),
        false
      );
    }

    if (toProcess.length > 0) {
      for (const p of toProcess) {
        try {
          await handleUploadFile(p.id, p.file);
        } catch (err: unknown) {
          console.error(`Error parsing ${p.file.name}:`, err);
          handleUpdateRow(p.id, "status", "error");
        }
      }
    }
  };

  const handleUploadFile = async (rowId: string, file: File) => {
    if (file.name.toLowerCase().includes("copy")) {
      toast?.info(`Hệ thống tự động bỏ qua file có tên 'copy': ${file.name}`);
      return;
    }

    handleUpdateRow(rowId, "status", "processing");
    try {
      let isSalary = false,
        isStaff = false,
        isCache = false;
      const fn = file.name.toLowerCase();
      if (fn.includes("salary")) isSalary = true;
      else if (fn.includes("staff")) isStaff = true;
      else if (fn.includes("cache")) isCache = true;

      const allRows = await parseExcelInWorker(file);

      allRows.forEach((r: Record<string, unknown>) => {
        r._sourceFile = file.name;
        r._rowId = rowId;
      });

      if (allRows.length > 0) {
        const headers = Object.keys(allRows[0] as Record<string, unknown>).map((k) =>
          k.toLowerCase().trim(),
        );

        updateAppData((prev) => {
          const next = { ...prev };
          
          next.Q_Roster = (next.Q_Roster || []).filter((r: Record<string, unknown>) => r._rowId !== rowId);
          next.Q_Salary_Scale = (next.Q_Salary_Scale || []).filter((r: Record<string, unknown>) => r._rowId !== rowId);
          next.Q_Staff = (next.Q_Staff || []).filter((r: Record<string, unknown>) => r._rowId !== rowId);
          next.Q_Cache = (next.Q_Cache || []).filter((r: Record<string, unknown>) => r._rowId !== rowId);

          if (
            headers.includes("academic price") ||
            isSalary ||
            headers.includes("s code")
          )
            next.Q_Salary_Scale = next.Q_Salary_Scale.concat(allRows);
          else if (headers.includes("bank account number") || isStaff)
            next.Q_Staff = next.Q_Staff.concat(allRows);
          else if (headers.includes("today") || isCache)
            next.Q_Cache = next.Q_Cache.concat(allRows);
          else {
            const mappedRosters = allRows.map((r: Record<string, unknown>) => mapExcelRosterRow(r, file.name, rowId));
            next.Q_Roster = next.Q_Roster.concat(mappedRosters);
          }

          const d = new Date();
          const detectedL07 = getL07FromFileName(file.name);
          const centerInfo = detectedL07 ? getCenterInfoByL07(detectedL07) : null;
          const bu = detectedL07 ? getBusinessFromL07(detectedL07) : "";

          next.Timesheet_InputList = (next.Timesheet_InputList || []).map((input) =>
            input.id === rowId
              ? {
                  ...input,
                  l07: input.l07 || detectedL07 || "",
                  aeCode: input.aeCode || centerInfo?.aeCode || "",
                  bus: input.bus || bu || "",
                  status: "success",
                  fileName: file.name,
                  date: `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")} ${d.getDate()}/${d.getMonth() + 1}`,
                }
              : input
          );

          return next;
        }, false);

        toast?.success(`Đọc thành công ${file.name}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      const errName = file.name;
      console.error(`[TimesheetSummary] Error reading ${errName}:`, err);
      handleUpdateRow(rowId, "status", "error");
      toast?.error(
        `Lỗi đọc ${errName}: ${errMsg}`,
      );
    }
  };

  const computedData = useTimesheetCalculations(
    rosterData,
    salaryScaleData,
    staffData,
    cacheData,
    debouncedFromDate,
    debouncedToDate
  );

  useEffect(() => {
    const signature = JSON.stringify({
      emp: computedData.employeeSummary?.length || 0,
      center: computedData.centerSummary?.length || 0,
    });

    if (lastSummaryRef.current === signature) return;
    lastSummaryRef.current = signature;

    updateAppData(
      (prev: AppData) => ({
        ...prev,
        TA_Employee_Summary: {
          headers: getDynamicEmployeeColumns(rosterData).map((c) => c.label),
          data: computedData.employeeSummary,
        },
        TA_Center_Summary: {
          headers: CENTER_COLUMNS.map((c) => c.label),
          data: computedData.centerSummary,
        },
      }),
      false,
    );
  }, [computedData.employeeSummary, computedData.centerSummary, rosterData, updateAppData]);

  const activeData = inputRows;

  const handleUploadFileA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const allRows = await parseExcelInWorker(file);

      console.log("Parsed File A:", allRows.slice(0, 5));
      updateAppData((prev) => ({ ...prev, Q_TeacherHours: allRows }));
      toast?.success(`Tải lên File A thành công (${allRows.length} dòng)`);
      if (e.target) e.target.value = "";
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Lỗi khi đọc File A";
      toast?.error(msg);
      if (e.target) e.target.value = "";
    }
  };

  const handleExport = () => {
    if (activeData.length === 0) {
      toast?.error("Không có dữ liệu");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(prepareDataForExport(activeData));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `Timesheet_Export_${activeTab}.xlsx`);
  };

  return (
    <div 
      className="page-timesheet-summary flex-1 flex flex-col min-h-0 bg-transparent m-0 gap-4 w-full h-full overflow-hidden"
      style={{
        paddingLeft: "6px",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingRight: "6px"
      }}
    >
      <button data-action="save-data" className="hidden" onClick={handleSaveData} />
      
      <input
        type="file"
        id="fileA"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleUploadFileA}
      />

      <div 
        className="bg-card flex-1 flex flex-col min-h-0 w-full relative border-border rounded-none border-[0.5px]"
        style={{ paddingLeft: "0px", paddingTop: "0px", paddingBottom: "0px", paddingRight: "0px" }}
      >
        <div className="absolute inset-0 bg-accent/5 opacity-[0.05] pointer-events-none hidden" />

        <div 
          className="flex flex-col md:flex-row items-center justify-between gap-4 bg-accent/5 shrink-0 border-b border-border/60 relative z-10 overflow-hidden rounded-none w-full max-w-full"
          style={{ minHeight: "60px", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "12px", paddingRight: "12px", borderWidth: "0.5px" }}
        >
          <div className="absolute inset-0 bg-accent/5 opacity-[0.03] pointer-events-none rounded-none" />
          {computedData?.error && (
            <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-600 p-2 text-center text-xs font-bold z-50">
              WORKER ERROR: {computedData.error}
            </div>
          )}
          {isSyncing && (
            <div className="absolute top-0 left-0 right-0 bg-secondary text-primary-foreground border-b border-none px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 z-50 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                <div>
                  <p className="text-xs font-black text-primary uppercase tracking-wider">
                    Đang đồng bộ dữ liệu lên Supabase...
                  </p>
                  <p className="text-[10px] font-bold text-foreground uppercase mt-0.5">
                    Đã lưu thành công: {syncedRowsCount.toLocaleString()} / {totalSyncRows.toLocaleString()} dòng ({syncProgress}%)
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-64 bg-accent/20 rounded-full h-2.5 overflow-hidden relative">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-5 relative z-10">
            {onBack && (
              <button
                onClick={onBack}
                className="flex w-10 h-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-slate-100 active:scale-[0.98] active:translate-y-[1px] transition-all group shadow-sm cursor-pointer"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
            <div 
              className="bg-primary flex items-center justify-center rounded-xl shadow-md shadow-primary/20 shrink-0"
              style={{ width: "39.998px", height: "39.998px" }}
            >
              <FileSpreadsheet className="text-white" style={{ width: "23px", height: "23px" }} />
            </div>

            <div style={{ paddingTop: "0px", paddingBottom: "0px" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="font-normal font-serif tracking-tight flex items-baseline gap-1" style={{ lineHeight: "1.2", fontSize: "22px", color: "#4c504a" }}>
                  Data{" "}
                  <span className="not-italic font-script text-[#c09e9a] text-2xl lowercase inline-block" style={{ fontFamily: "Waterfall, cursive", lineHeight: "1" }}>
                    summary
                  </span>
                  <span 
                    className="text-xl tracking-tight" 
                    style={{ 
                      lineHeight: "1",
                      fontFamily: "Corinthia, cursive",
                      fontWeight: "bold",
                      color: "#c09e9a",
                      marginLeft: "4px"
                    }}
                  >
                    & Source
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase" style={{ paddingTop: "0px", paddingBottom: "0px" }}>
                <span className="flex items-center gap-1">
                  <span className="font-extrabold text-foreground text-[13px]">{inputRows.length || 0}</span>{" "}
                  <span className="text-[10px] lowercase" style={{ color: "#888888" }}>centers</span>
                </span>
                <span className="text-accent/30 font-normal">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-extrabold text-foreground text-[13px]">{computedData?.employeeSummary?.length || 0}</span>{" "}
                  <span className="text-[10px] lowercase" style={{ color: "#888888" }}>employees</span>
                </span>
                <span className="text-accent/30 font-normal">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-extrabold text-foreground text-[13px]">{(computedData?.processedRosterData?.length || 0).toLocaleString()}</span>{" "}
                  <span className="text-[10px] lowercase" style={{ color: "#888888" }}>records</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" style={{ height: "30.987px" }}>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    id="summary-settings-btn"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200/80 bg-[#edf4f9] hover:bg-[#e2edf5] active:scale-[0.98] active:translate-y-[1px] transition-all group shadow-sm z-10 relative cursor-pointer"
                    style={{ height: "32.9916px", paddingTop: "4px", paddingBottom: "4px" }}
                  >
                    <Settings className="w-4 h-4 text-[#7A1C1C] group-hover:rotate-45 transition-transform duration-500 shrink-0" />
                    <span 
                      className="font-sans font-black text-xs tracking-wider text-[#0f2a4a] select-none"
                      style={{ lineHeight: "13px", fontSize: "9px" }}
                    >
                      CÀI ĐẶT
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 border border-border/50 shadow-2xl p-2 bg-[var(--card)] opacity-100 rounded-2xl z-[999999]"
                >
                  <DropdownMenuLabel className="text-[0.625rem] font-bold uppercase tracking-widest text-[#0f2a4a]/60 px-3 py-2">
                    CÀI ĐẶT & TIỆN ÍCH
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />

                  <DropdownMenuItem
                    onSelect={() => window.dispatchEvent(new Event("open-ui-settings"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#7A1C1C]" />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#0f2a4a]">
                      Cấu hình Giao diện
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  
                  <DropdownMenuItem
                    onSelect={handleAddRow}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/10 transition-colors font-bold text-[0.6875rem] uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4 text-accent" />
                    <span>Thêm dòng trung tâm</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 mx-1" />

                  <DropdownMenuItem
                    onSelect={handleClearAll}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/10 transition-colors text-accent"
                  >
                    <Trash2 className="w-4 h-4 text-accent" />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-accent">
                      Xóa toàn bộ
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem
                    onSelect={() => handleUrlInput(inputRows[0].id, DEFAULT_FOLDER_URL)}
                    disabled={isFetchingGgSheet}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors text-amber-600 disabled:opacity-50"
                  >
                    <FileSpreadsheet className={`w-4 h-4 text-amber-600 ${isFetchingGgSheet ? "animate-spin" : ""}`} />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-amber-600">
                      Đồng bộ google sheet (Folder)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem
                    onSelect={handleSyncToSupabase}
                    disabled={isSyncing}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-secondary text-primary-foreground transition-colors text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? "animate-spin" : ""}`} />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-primary">
                      ĐỒNG BỘ LÊN SUPABASE
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />

                  <DropdownMenuItem
                    onSelect={handleExport}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider">
                      Xuất Excel
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Service Account Info Card removed as requested */}


        <div className="flex-1 flex flex-col min-h-0 relative rounded-none overflow-hidden p-0">
          <TimesheetInputTable
            rows={inputRows}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            onClearRow={handleClearRow}
            onClearAll={handleClearAll}
            onClearEmptyL07={handleClearEmptyL07}
            onUploadFile={handleUploadFile}
            onUploadFiles={handleUploadFiles}
            onUrlInput={handleUrlInput}
            onRefresh={handleRecalculate}
            onSyncRow={handleSyncRow}
            onReloadFromFolder={handleReloadFromFolder}
            isProcessing={isFetchingGgSheet}
          />
        </div>
      </div>

      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-2xl bg-card rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-wider">Thiết lập Bảng Supabase</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium">
                Bảng 'roster_cham_cong' chưa tồn tại hoặc thiếu cột dữ liệu. Vui lòng copy script bên dưới và chạy trong SQL Editor của Supabase để cập nhật cấu trúc bảng.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="relative group">
              <pre className="bg-foreground text-secondary p-6 rounded-2xl text-[10px] font-mono leading-relaxed overflow-x-auto max-h-[300px] border border-primary/20 shadow-inner custom-scrollbar">
                {SQL_SETUP_SCRIPT}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-card/10 hover:bg-card/20 border-white/20 text-primary-foreground gap-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                onClick={() => {
                  navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
                  toast.success("Đã copy script SQL!");
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                SAO CHÉP
              </Button>
            </div>
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground/50">Các bước thực hiện:</h4>
              <ol className="text-[11px] font-bold text-foreground/80 space-y-2 list-decimal pl-4">
                <li>Truy cập vào Dashboard Supabase của bạn.</li>
                <li>Chọn dự án và vào phần <span className="text-primary">SQL Editor</span>.</li>
                <li>Bấm <span className="text-primary">New Query</span> và dán nội dung script trên vào.</li>
                <li>Bấm <span className="text-primary">Run</span> để tạo bảng và cấu hình quyền truy cập (RLS).</li>
                <li>Quay lại đây và thử Đồng bộ lại.</li>
              </ol>
            </div>
          </div>
          <DialogFooter className="p-6 bg-background border-t border-border/50">
            <Button 
              onClick={() => setShowSqlDialog(false)}
              className="bg-primary hover:opacity-90 text-primary-foreground rounded-xl px-8 font-black uppercase tracking-widest text-[10px]"
            >
              Tôi đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

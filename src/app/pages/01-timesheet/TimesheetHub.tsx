/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useMemo, useRef, useState, useEffect, useTransition, useCallback } from "react";
import { useLocation } from "react-router";
import { useAppData } from "../../lib/contexts/AppDataContext";
import { useTimesheetCalculations } from "../../hooks/useTimesheetCalculations";
import { prepareDataForExport } from "../../lib/utils/data-utils";
import { useUiSettings } from "../../lib/ui-settings";
import { INITIAL_APP_DATA } from "../../constants/initial-data";
import {
  FileText,
  Users,
  Building2,
  Search,
  ChevronDown,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  Save,
  Plus,
  Check,
  Settings,
  Download,
  Cloud,
  Eye,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Copy, Clock } from "lucide-react";
import { RosterRawTable } from "./tables/RosterRawTable";
import { EmployeeTable } from "./tables/EmployeeTable";
import { CenterTable } from "./tables/CenterTable";
import { MktLocalNorthPivotTable } from "./tables/MktLocalNorthPivotTable";
import TimesheetSummaryPage from "./TimesheetSummary";
import { useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { 
  syncRosterToSupabase, 
  syncEmployeesToSupabase, 
  syncSalaryScalesToSupabase, 
  clearSupabaseData, 
  SQL_SETUP_SCRIPT 
} from "../../lib/supabase-sync-utils";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { ROSTER_RAW_COLUMNS } from "../../constants/columns/roster-raw";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

function DebouncedSearchInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value === "") {
      setLocalValue("");
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      className={className}
    />
  );
}

const timesheetSearchCache = new WeakMap<any, string>();

let hasFetchedSupabase = false;

export function TimesheetHub() {
  const { appData, updateAppData } = useAppData();
  const location = useLocation();
  const uiSettings = useUiSettings();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    "roster_raw" | "employee" | "center" | "mkt_local_north"
  >("employee");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [view, setView] = useState<"final" | "upload">("final");
  const [fromDate, setFromDate] = useState(appData.Timesheet_Dates?.from || "");
  const [toDate, setToDate] = useState(appData.Timesheet_Dates?.to || "");
  const [debouncedFromDate, setDebouncedFromDate] = useState(appData.Timesheet_Dates?.from || "");
  const [debouncedToDate, setDebouncedToDate] = useState(appData.Timesheet_Dates?.to || "");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRosterCard, setShowRosterCard] = useState(true);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [showControlBar, setShowControlBar] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [totalSyncRows, setTotalSyncRows] = useState(0);
  const [syncedRowsCount, setSyncedRowsCount] = useState(0);
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  

  useEffect(() => {
    const fetchRealtimeData = async () => {
      if (!isSupabaseConfigured()) {
        console.log("Supabase is not configured yet. Using local state.");
        return;
      }
      if (hasFetchedSupabase) {
        console.log("Supabase data already loaded in this session. Skipping auto-fetch on tab switch.");
        return;
      }
      if ((appData.Q_Roster && appData.Q_Roster.length > 0) || (appData.Q_Staff && appData.Q_Staff.length > 0)) {
        console.log("Local data already exists. Skipping auto-fetch from Supabase to prevent overwriting unsynced local data.");
        hasFetchedSupabase = true;
        return;
      }
      try {
        // Fetch roster_cham_cong
        const { data: dbRoster, error: rosterErr } = await supabase
          .from("roster_cham_cong")
          .select("*")
          .range(0, 50000);
          
        // Fetch nhan_vien
        const { data: dbStaff, error: staffErr } = await supabase
          .from("nhan_vien")
          .select("*")
          .range(0, 50000);

        // Fetch thang_luong
        const { data: dbSalary, error: salaryErr } = await supabase
          .from("thang_luong")
          .select("*")
          .range(0, 50000);

        if (rosterErr || staffErr || salaryErr) {
          console.warn("Supabase tables might not exist yet. Please run the SQL setup script.", { rosterErr, staffErr, salaryErr });
          return;
        }

        if ((dbRoster || []).length === 0 && (dbStaff || []).length === 0 && (dbSalary || []).length === 0) {
          console.log("Supabase tables are empty. Keeping initial local data so user can sync.");
          hasFetchedSupabase = true;
          return;
        }

        // Map Roster rows
        const mappedRoster = (dbRoster || []).map((row: any) => ({
          ...(row.raw_data || {}),
          _rowId: row.unique_id || `supa-r-${row.id}`,
          _uuid: row.unique_id || `supa-u-${row.id}`,
          _sourceFile: row.raw_data?._sourceFile || "Supabase_Live",
          center: row.center || row.l07 || "",
          l07: row.l07 || "",
          business: row.business || "",
          ma_nv: row.ma_nv || "",
          full_name: row.full_name || "",
          ngay: row.ngay || "",
          type: row.type || "",
          class: row.class || "",
          gio_vao: row.gio_vao || "",
          gio_ra: row.gio_ra || "",
          duration: Number(row.duration) || 0,
          notes: row.notes || "",
          employeeId: row.ma_nv || "",
          fullName: row.full_name || "",
          maAE: row.center || row.l07 || "",
          date: row.ngay || "",
          taskType: row.type || "",
          classCode: row.class || "",
          from: row.gio_vao || "",
          to: row.gio_ra || "",
          chargeToCenterMkt: row.charge_to_center_mkt || ""
        }));

        // Map Staff rows
        const mappedStaff = (dbStaff || []).map((row: any) => ({
          ...(row.raw_data || {}),
          _rowId: row.unique_id,
          employeeId: row.employee_id,
          fullName: row.full_name,
          bankAccountNumber: row.bank_account_number,
          salaryScale: row.salary_scale,
          business: row.business,
          center: row.center,
          from: row.from,
          to: row.to,
          className: row.class_name,
          noteDays: row.note_days
        }));

        // Map Salary scale rows
        const mappedSalary = (dbSalary || []).map((row: any) => ({
          ...(row.raw_data || {}),
          _rowId: row.unique_id,
          sCode: row.s_code,
          academicPrice: Number(row.academic_price) || 0,
          baseSalary: Number(row.base_salary) || 0,
          totalSalary: Number(row.total_salary) || 0,
          deductionHours: Number(row.deduction_hours) || 0
        }));

        hasFetchedSupabase = true;

        updateAppData((prev) => ({
          ...prev,
          Q_Roster: mappedRoster,
          Q_Staff: mappedStaff,
          Q_Salary_Scale: mappedSalary
        }), false);

        console.log("Successfully loaded real-time data from Supabase:", {
          roster: mappedRoster.length,
          staff: mappedStaff.length,
          salary: mappedSalary.length
        });
      } catch (err) {
        console.error("Error fetching realtime Supabase data:", err);
      }
    };

    fetchRealtimeData();
  }, [updateAppData]);



  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleRequestTabChange = (e: any) => {
      if (e.detail && e.detail.tab) {
        if (e.detail.tab === "upload") {
          setView("upload");
        } else {
          setView("final");
          setActiveTab(e.detail.tab as any);
        }
      }
    };
    window.addEventListener("timesheet-request-tab-change", handleRequestTabChange);
    return () => window.removeEventListener("timesheet-request-tab-change", handleRequestTabChange);
  }, []);

  const [targetDate, setTargetDate] = useState("");
  const [targetCenter, setTargetCenter] = useState("");

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setTargetDate("");
    setTargetCenter("");
    setFromDate("");
    setToDate("");
    setDebouncedFromDate("");
    setDebouncedToDate("");
    updateAppData((prev) => ({
      ...prev,
      Timesheet_Dates: { from: "", to: "" },
    }), false);
    navigate(location.pathname, {
      replace: true,
      state: { from: "cleared" },
    });
    if (tableRef.current) {
      tableRef.current.clearAllFilters();
    }
  }, [navigate, location.pathname, updateAppData]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Remove effect syncing globalMonth down to local selectedMonth
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFromDate(fromDate);
      setDebouncedToDate(toDate);
    }, 500);
    return () => clearTimeout(timer);
  }, [fromDate, toDate]);

  useEffect(() => {
    const handleResetAllFiltersEvent = () => {
      handleClearFilters();
    };
    window.addEventListener("reset-all-filters", handleResetAllFiltersEvent);
    return () => {
      window.removeEventListener("reset-all-filters", handleResetAllFiltersEvent);
    };
  }, [handleClearFilters]);

  useEffect(() => {
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

  const calculatedRosterData = useMemo(() => appData.Q_Roster || [], [appData.Q_Roster]);
  const calculatedSalaryScaleData = useMemo(() => appData.Q_Salary_Scale || [], [appData.Q_Salary_Scale]);
  const calculatedStaffData = useMemo(() => appData.Q_Staff || [], [appData.Q_Staff]);
  const calculatedCacheData = useMemo(() => appData.Q_Cache || [], [appData.Q_Cache]);

  const { processedRosterData, employeeSummary, centerSummary, isCalculating } =
    useTimesheetCalculations(
      calculatedRosterData,
      calculatedSalaryScaleData,
      calculatedStaffData,
      calculatedCacheData,
      appData.Timesheet_Dates?.from || debouncedFromDate,
      appData.Timesheet_Dates?.to || debouncedToDate,
    );

  const tabs = useMemo(
    () =>
      [
        { id: "employee", label: "Total Paid Hours", icon: Users },
        { id: "center", label: "Roster center", icon: Building2 },
        { id: "mkt_local_north", label: "Phí MKT local North", icon: FileText },
        { id: "roster_raw", label: "raw data", icon: FileText },
      ] as const,
    [],
  );

  useEffect(() => {
    const tabId = view === "upload" ? "upload" : activeTab;
    const label = tabId === "upload" ? "Cài đặt & Tải file (Timesheet)" : (tabs.find((t) => t.id === activeTab)?.label || "Timesheet Overview");
    const event = new CustomEvent("timesheet-tab-changed", { detail: { label, tab: tabId } });
    window.dispatchEvent(event);
  }, [activeTab, view, tabs]);

  const mktLocalNorthData = useMemo(() => {
    return processedRosterData.filter((r: any) => {
      const cUpper = String(r.center || "").toUpperCase();
      const l07Upper = String(r.l07 || "").toUpperCase();
      const isMktNorth = cUpper === "MKT LOCAL NORTH" || cUpper.startsWith("MKT LOCAL NORTH_") || l07Upper === "MKT LOCAL NORTH" || l07Upper.startsWith("MKT LOCAL NORTH_");
      // Phải loại bỏ các ca trùng lịch (overlap) khỏi bảng Pivot
      return isMktNorth && !String(r.overlap_check || "").startsWith("Trùng lịch");
    });
  }, [processedRosterData]);

  const currentData = useMemo(() => {
    if (activeTab === "roster_raw") return processedRosterData;
    if (activeTab === "employee") return employeeSummary;
    if (activeTab === "center") return centerSummary;
    if (activeTab === "mkt_local_north") return mktLocalNorthData;
    return [];
  }, [activeTab, processedRosterData, employeeSummary, centerSummary, mktLocalNorthData]);

  const searchData = useMemo(() => {
    let data = currentData;

    // 1. If we have a target date (from audit or manually set), filter by date first
    if (targetDate) {
      const parseNormalizedDateStr = (str: string) => {
        if (!str) return "";
        const clean = str.trim();
        if (clean.includes("/")) {
          const p = clean.split("/");
          if (p.length === 3) {
            return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
          }
        }
        if (clean.includes("-")) {
          const p = clean.split("-");
          if (p.length === 3) {
            return `${p[0]}-${p[1].padStart(2, "0")}-${p[2].padStart(2, "0")}`;
          }
        }
        return clean;
      };

      const normTargetDate = parseNormalizedDateStr(targetDate);

      data = data.filter((row: any) => {
        const rowDate = String(row.date || row.ngay || "").trim();
        if (!rowDate) return true; // Do not filter out rows with no date info
        
        const normRowDate = parseNormalizedDateStr(rowDate);
        return normRowDate === normTargetDate || normRowDate.includes(normTargetDate);
      });
    }

    // 2. If we have a target center (from audit), filter by center
    if (targetCenter) {
      data = data.filter((row: any) => {
        const rowCenter = String(row.center || row.l07 || "")
          .trim()
          .toUpperCase();
        if (!rowCenter) return true;
        const tCenter = String(targetCenter).trim().toUpperCase();
        return rowCenter === tCenter || rowCenter.includes(tCenter);
      });
    }

    // 3. If we have a search term (class name, employee ID, full name)
    if (debouncedSearchTerm) {
      const normalizeStr = (s: string) => {
        if (!s) return "";
        let normalized = s.toLowerCase();
        normalized = normalized.replace(/đ/g, "d");
        return normalized
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "");
      };

      const lowerSearch = normalizeStr(debouncedSearchTerm);
      const lowerSearchTrimmedZero = lowerSearch.replace(/^0+/, "");

      const searchCache = timesheetSearchCache;

      data = data.filter((row: any) => {
        // Use precomputed _searchStr if available
        let rowSearchStr = searchCache.get(row);
        
        if (rowSearchStr !== undefined) {
          if (rowSearchStr.includes(lowerSearch)) return true;
          if (lowerSearchTrimmedZero && rowSearchStr.includes(lowerSearchTrimmedZero)) return true;
          return false;
        }

        rowSearchStr = "";
        
        // Optimize search to only search in keys that might be displayed
        for (const [key, value] of Object.entries(row)) {
          if (value == null) continue;
          if (typeof value === "string" || typeof value === "number") {
            rowSearchStr += `|${normalizeStr(String(value))}`;
          }
        }
        
        // Cache it for future filtering
        searchCache.set(row, rowSearchStr);

        return rowSearchStr.includes(lowerSearch) || (lowerSearchTrimmedZero ? rowSearchStr.includes(lowerSearchTrimmedZero) : false);
      });
    }

    return data;
  }, [currentData, debouncedSearchTerm, targetDate, targetCenter]);

  // Handle deep linking and navigation resets
  useEffect(() => {
    const state = location.state as any;
    if (state && state.from === "audit") {
      // Apply filters
      if (state.activeTab) setActiveTab(state.activeTab);

      const cascade = state.cascadeFilters as Record<string, string> | undefined;

      if (cascade && Object.keys(cascade).length > 0) {
        // Set top bar control values
        if (cascade["l07"]) {
          setTargetCenter(cascade["l07"]);
        } else if (state.filterCenter) {
          setTargetCenter(state.filterCenter);
        } else {
          setTargetCenter("");
        }

        if (cascade["ngay"]) {
          setTargetDate(cascade["ngay"]);
        } else if (state.filterDate) {
          setTargetDate(state.filterDate);
        } else {
          setTargetDate("");
        }

        // Clear general search string to avoid collision with precise column filters
        setSearchTerm("");
        setDebouncedSearchTerm("");

        // Build multiFilters for tableRef
        const multiFilters: Record<string, Set<any>> = {};
        Object.entries(cascade).forEach(([colKey, val]) => {
          if (val != null && val !== "") {
            multiFilters[colKey] = new Set([String(val)]);
          }
        });

        setTimeout(() => {
          if (tableRef.current) {
            if (tableRef.current.clearAllFilters) {
              tableRef.current.clearAllFilters();
            }
            if (tableRef.current.setMultipleColumnFilters) {
              tableRef.current.setMultipleColumnFilters(multiFilters);
            }
          }
        }, 150);
      } else {
        const filterCol = state.filterColumn;
        const filterVal = state.filterValue;

        if (filterCol && filterVal) {
          if (filterCol === "ngay") {
            setTargetDate(filterVal);
            setTargetCenter("");
            setSearchTerm("");
            setDebouncedSearchTerm("");
          } else if (filterCol === "l07" || filterCol === "center") {
            setTargetCenter(filterVal);
            setTargetDate("");
            setSearchTerm("");
            setDebouncedSearchTerm("");
          } else {
            setTargetDate("");
            setTargetCenter("");
            setSearchTerm(filterVal);
            setDebouncedSearchTerm(filterVal);
          }
        } else {
          if (state.searchTerm) {
            setSearchTerm(state.searchTerm);
            setDebouncedSearchTerm(state.searchTerm);
          } else {
            setSearchTerm("");
            setDebouncedSearchTerm("");
          }
          if (state.filterDate) setTargetDate(state.filterDate);
          else setTargetDate("");
          if (state.filterCenter) setTargetCenter(state.filterCenter);
          else setTargetCenter("");
        }

        // Apply column filter directly on tableRef if available
        if (filterCol && filterVal) {
          setTimeout(() => {
            if (tableRef.current) {
              if (tableRef.current.clearAllFilters) {
                tableRef.current.clearAllFilters();
              }
              if (tableRef.current.setColumnFilter) {
                tableRef.current.setColumnFilter(filterCol, new Set([String(filterVal)]));
              }
            }
          }, 150);
        }
      }

      // Scroll to the table after a brief delay to ensure rendering
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Clear location state but DO NOT trigger cleanup
      navigate(location.pathname, {
        replace: true,
        state: { ...state, from: "audit_applied" },
      });
    }
  }, [location.state, navigate, location.pathname, searchData]);

  // Separate effect for clearing filters when navigating NOT from audit
  useEffect(() => {
    const state = location.state as any;
    // Only clear if the user manually changed the URL, not because we cleared the state internally
    if (
      !state ||
      (state.from !== "audit" &&
        state.from !== "audit_applied" &&
        state.from !== "cleared" &&
        !state.activeTab)
    ) {
      handleClearFilters();
      setActiveTab("roster_raw");
      setView("final");
    }
  }, [location.state, handleClearFilters]);

  // 1. Get unique non-empty type values for Pivot Table columns (excluding empty key values as requested)
  const mktPivotUniqueTypes = useMemo(() => {
    if (activeTab !== "mkt_local_north") return [];
    const typesSet = new Set<string>();
    searchData.forEach((r: any) => {
      const type = String(r.taskType || "").trim().toUpperCase();
      if (type) {
        typesSet.add(type);
      }
    });
    return Array.from(typesSet).sort();
  }, [activeTab, searchData]);

  // 2. Aggregate row data by business -> center -> chargeToCenterMkt
  const mktPivotRows = useMemo(() => {
    if (activeTab !== "mkt_local_north") return [];
    
    const map = new Map<string, {
      business: string;
      center: string;
      chargeToCenterMkt: string;
      values: Record<string, number>;
      total: number;
    }>();

    searchData.forEach((r: any) => {
      const type = String(r.taskType || "").trim().toUpperCase();
      if (!type) return; // skip empty data as requested

      const bus = String(r.business || "").trim();
      const chargeMkt = String(r.chargeToCenterMkt || r.charge_to_center_mkt || r.l07 || "").trim();
      const key = `${bus}||${chargeMkt}`;

      if (!map.has(key)) {
        map.set(key, {
          business: bus,
          center: "",
          chargeToCenterMkt: chargeMkt,
          values: {},
          total: 0,
        });
      }

      const item = map.get(key)!;
      const hours = Number(r.duration ?? r.workingHours) || 0;
      // Value: working hours * 20,000 as requested
      const value = hours * 20000;

      item.values[type] = (item.values[type] || 0) + value;
      item.total += value;
    });

    return Array.from(map.values()).sort((a, b) => {
      const comp1 = a.business.localeCompare(b.business);
      if (comp1 !== 0) return comp1;
      return a.chargeToCenterMkt.localeCompare(b.chargeToCenterMkt);
    });
  }, [activeTab, searchData]);

  // 3. Compute column and grand totals for the Pivot Grid
  const mktPivotGrandTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let grandTotal = 0;
    
    mktPivotRows.forEach((row) => {
      mktPivotUniqueTypes.forEach((type) => {
        totals[type] = (totals[type] || 0) + (row.values[type] || 0);
      });
      grandTotal += row.total;
    });

    return { totals, grandTotal };
  }, [mktPivotRows, mktPivotUniqueTypes]);

  const handleExportExcel = () => {
    if (currentData.length === 0) return;

    if (activeTab === "mkt_local_north") {
      const rows = mktPivotRows.map((row) => {
        const item: any = {
          "Business": row.business,
          "Charge To Center MKT": row.chargeToCenterMkt,
        };
        mktPivotUniqueTypes.forEach((type) => {
          item[type] = row.values[type] || 0;
        });
        item["Grand Total"] = row.total;
        return item;
      });

      // Add Grand Totals Row
      const totalsRow: any = {
        "Business": "TỔNG CỘNG",
        "L07 (Region)": "",
        "Charge To Center MKT": "",
      };
      mktPivotUniqueTypes.forEach((type) => {
        totalsRow[type] = mktPivotGrandTotals.totals[type] || 0;
      });
      totalsRow["Grand Total"] = mktPivotGrandTotals.grandTotal;
      rows.push(totalsRow);

      const ws = XLSX.utils.json_to_sheet(prepareDataForExport(rows));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Phí MKT Local North (Pivot)");
      XLSX.writeFile(wb, `Pivot_Phi_MKT_Local_North.xlsx`);
      return;
    }

    let exportRows = currentData;
    
    if (activeTab === "roster_raw") {
      exportRows = currentData.map((row: any) => {
        const mappedRow: any = {};
        ROSTER_RAW_COLUMNS.forEach(col => {
          if (!col.hidden) {
            mappedRow[col.label] = row[col.key];
          }
        });
        return mappedRow;
      });
    }

    const ws = XLSX.utils.json_to_sheet(prepareDataForExport(exportRows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `Timesheet_Hub_${activeTab}.xlsx`);
  };

  const handleSyncToSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase chưa được cấu hình! Vui lòng cài đặt URL và Anon Key trong phần cấu hình.");
      return;
    }

    const rosterData = appData.Q_Roster || [];
    const staffData = appData.Q_Staff || [];
    const salaryData = appData.Q_Salary_Scale || [];

    if (rosterData.length === 0 && staffData.length === 0 && salaryData.length === 0) {
      toast.warning("Không có dữ liệu để đồng bộ.");
      return;
    }

    setIsSyncing(true);
    setTotalSyncRows(rosterData.length + staffData.length + salaryData.length);
    setSyncedRowsCount(0);
    setSyncProgress(0);

    try {
      let overallSuccessCount = 0;
      const totalToSync = rosterData.length + staffData.length + salaryData.length;

      // 1. Sync Staff
      if (staffData.length > 0) {
        const { successCount } = await syncEmployeesToSupabase(
          staffData,
          (current) => {
            setSyncedRowsCount(current);
            setSyncProgress(Math.round((current / totalToSync) * 100));
          }
        );
        overallSuccessCount += successCount;
      }

      // 2. Sync Salary Scale
      if (salaryData.length > 0) {
        const { successCount } = await syncSalaryScalesToSupabase(
          salaryData,
          (current) => {
            const currentTotal = staffData.length + current;
            setSyncedRowsCount(currentTotal);
            setSyncProgress(Math.round((currentTotal / totalToSync) * 100));
          }
        );
        overallSuccessCount += successCount;
      }

      // 3. Sync Roster
      if (rosterData.length > 0) {
        const { successCount } = await syncRosterToSupabase(
          rosterData,
          (current) => {
            const currentTotal = staffData.length + salaryData.length + current;
            setSyncedRowsCount(currentTotal);
            setSyncProgress(Math.round((currentTotal / totalToSync) * 100));
          }
        );
        overallSuccessCount += successCount;
      }

      toast.success(`Đồng bộ thành công ${overallSuccessCount.toLocaleString()}/${totalToSync.toLocaleString()} dòng lên Supabase.`);
      
      updateAppData((prev: any) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        lastSupabaseSyncAt: new Date().toISOString()
      }), true);
      toast.success("Đã tự động lưu cứng dữ liệu trên web.");
    } catch (err: unknown) {
      console.error("Supabase Sync Error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(`Đồng bộ thất bại: ${errMsg}`);
      if (
        errMsg.includes("chưa tồn tại") || 
        errMsg.includes("relation") || 
        errMsg.includes("does not exist") ||
        errMsg.includes("Thiếu cột") ||
        errMsg.includes("unique_nv_ngay") ||
        errMsg.includes("ràng buộc") ||
        errMsg.includes("trùng lặp")
      ) {
        setShowSqlDialog(true);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [appData.Q_Roster, appData.Q_Staff, appData.Q_Salary_Scale, updateAppData]);

  const tableRef = useRef<any>(null);

  const handleFetchFromSupabase = useCallback(async (isSilent = false) => {
    if (!isSupabaseConfigured()) {
      if (!isSilent) {
        toast.error("Supabase chưa được cấu hình! Vui lòng cài đặt URL và Anon Key trong phần cấu hình.");
      }
      return;
    }

    const loadToastId = !isSilent ? toast.loading("Đang tải dữ liệu từ Supabase...") : null;

    try {
      // Fetch roster_cham_cong
      const { data: dbRoster, error: rosterErr } = await supabase
        .from("roster_cham_cong")
        .select("*")
        .range(0, 50000);
        
      // Fetch nhan_vien
      const { data: dbStaff, error: staffErr } = await supabase
        .from("nhan_vien")
        .select("*")
        .range(0, 50000);

      // Fetch thang_luong
      const { data: dbSalary, error: salaryErr } = await supabase
        .from("thang_luong")
        .select("*")
        .range(0, 50000);

      if (rosterErr || staffErr || salaryErr) {
        throw new Error("Không thể truy vấn các bảng dữ liệu trên Supabase. Vui lòng kiểm tra lại cấu hình hoặc mã SQL.");
      }

      if ((dbRoster || []).length === 0 && (dbStaff || []).length === 0 && (dbSalary || []).length === 0) {
        if (!isSilent) {
          toast.warning("Dữ liệu trên Supabase hiện đang trống. Hãy bấm 'Đồng bộ Supabase' trước để đẩy dữ liệu lên.");
        }
        if (loadToastId) toast.dismiss(loadToastId);
        return;
      }

      // Map Roster rows
      const mappedRoster = (dbRoster || []).map((row: any) => ({
        ...(row.raw_data || {}),
        _rowId: row.unique_id || `supa-r-${row.id}`,
        _uuid: row.unique_id || `supa-u-${row.id}`,
        _sourceFile: row.raw_data?._sourceFile || "Supabase_Live",
        center: row.center || row.l07 || "",
        l07: row.l07 || "",
        business: row.business || "",
        ma_nv: row.ma_nv || "",
        full_name: row.full_name || "",
        ngay: row.ngay || "",
        type: row.type || "",
        class: row.class || "",
        gio_vao: row.gio_vao || "",
        gio_ra: row.gio_ra || "",
        duration: Number(row.duration) || 0,
        notes: row.notes || "",
        employeeId: row.ma_nv || "",
        fullName: row.full_name || "",
        maAE: row.center || row.l07 || "",
        date: row.ngay || "",
        taskType: row.type || "",
        classCode: row.class || "",
        from: row.gio_vao || "",
        to: row.gio_ra || "",
        chargeToCenterMkt: row.charge_to_center_mkt || ""
      }));

      // Map Staff rows
      const mappedStaff = (dbStaff || []).map((row: any) => ({
        ...(row.raw_data || {}),
        _rowId: row.unique_id,
        employeeId: row.employee_id,
        fullName: row.full_name,
        bankAccountNumber: row.bank_account_number,
        salaryScale: row.salary_scale,
        business: row.business,
        center: row.center,
        from: row.from,
        to: row.to,
        className: row.class_name,
        noteDays: row.note_days
      }));

      // Map Salary scale rows
      const mappedSalary = (dbSalary || []).map((row: any) => ({
        ...(row.raw_data || {}),
        _rowId: row.unique_id,
        sCode: row.s_code,
        academicPrice: Number(row.academic_price) || 0,
        baseSalary: Number(row.base_salary) || 0,
        totalSalary: Number(row.total_salary) || 0,
        deductionHours: Number(row.deduction_hours) || 0
      }));

      hasFetchedSupabase = true;

      updateAppData((prev) => ({
        ...prev,
        Q_Roster: mappedRoster,
        Q_Staff: mappedStaff,
        Q_Salary_Scale: mappedSalary,
        updatedAt: new Date().toISOString()
      }), true);

      if (loadToastId) {
        toast.dismiss(loadToastId);
        toast.success(`Đã lấy dữ liệu từ Supabase về ứng dụng thành công (${mappedRoster.length} dòng Roster, ${mappedStaff.length} Nhân viên)!`);
      }
    } catch (err: any) {
      console.error("Error fetching Supabase data:", err);
      if (loadToastId) {
        toast.dismiss(loadToastId);
        toast.error(`Không thể lấy dữ liệu từ Supabase: ${err.message}`);
      }
    }
  }, [updateAppData]);

  const handleSaveData = useCallback(async () => {
    updateAppData((prev: any) => ({
      ...prev,
      updatedAt: new Date().toISOString()
    }), true);
    
    if (isSupabaseConfigured()) {
      toast.info("Đang tự động đồng bộ dữ liệu thay đổi lên Supabase...");
      await handleSyncToSupabase();
    } else {
      toast.success("Đã lưu dữ liệu thay đổi offline thành công!");
    }
  }, [updateAppData, handleSyncToSupabase]);

  const handleRestoreOriginal = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const choice = window.confirm(
        "BẠN CÓ MUỐN LẤY LẠI DỮ LIỆU ĐÃ ĐỒNG BỘ TRÊN SUPABASE KHÔNG?\n\n" +
        "- Bấm OK: Để khôi phục bằng cách tải dữ liệu đã lưu từ Supabase về ứng dụng (An toàn, khuyên dùng).\n" +
        "- Bấm Cancel (Hủy): Để khôi phục hoàn toàn về DỮ LIỆU MẪU BAN ĐẦU (Sẽ XÓA SẠCH toàn bộ dữ liệu hiện tại trên Supabase và tải lại dữ liệu mẫu)."
      );
      
      if (choice) {
        await handleFetchFromSupabase();
        return;
      }
      
      const confirmForceReset = window.confirm(
        "CẢNH BÁO NGUY HIỂM: Bạn đã chọn khôi phục về DỮ LIỆU MẪU BAN ĐẦU.\n\n" +
        "Thao tác này sẽ XÓA SẠCH TOÀN BỘ dữ liệu của bạn trên Supabase để ghi đè dữ liệu mẫu ban đầu. Bạn có thực sự muốn tiếp tục không?"
      );
      if (!confirmForceReset) return;
    } else {
      const confirmReset = window.confirm(
        "Bạn có chắc chắn muốn khôi phục dữ liệu mẫu ban đầu không? Toàn bộ thay đổi của bạn sẽ bị xóa.",
      );
      if (!confirmReset) return;
    }

    const loadToastId = toast.loading("Đang xóa dữ liệu Supabase và đồng bộ lại dữ liệu mẫu...");

    try {
      // 1. Clear old data on Supabase
      await clearSupabaseData();

      // 2. Sync Employees
      const staffData = INITIAL_APP_DATA.Q_Staff || [];
      if (staffData.length > 0) {
        await syncEmployeesToSupabase(staffData);
      }

      // 3. Sync Salary Scales
      const salaryData = INITIAL_APP_DATA.Q_Salary_Scale || [];
      if (salaryData.length > 0) {
        await syncSalaryScalesToSupabase(salaryData);
      }

      // 4. Sync Rosters
      const rosterData = INITIAL_APP_DATA.Q_Roster || [];
      if (rosterData.length > 0) {
        await syncRosterToSupabase(rosterData, () => {});
      }

      // 5. Update Local App Data to match
      updateAppData((prev) => ({
        ...prev,
        Q_Roster: [...rosterData],
        Q_Staff: [...staffData],
        Q_Salary_Scale: [...salaryData],
        Q_Cache: INITIAL_APP_DATA.Q_Cache ? [...INITIAL_APP_DATA.Q_Cache] : [],
        updatedAt: new Date().toISOString(),
        lastSupabaseSyncAt: new Date().toISOString()
      }), true);

      toast.dismiss(loadToastId);
      toast.success("Khôi phục và đồng bộ dữ liệu mẫu lên Supabase thành công!");
    } catch (error: any) {
      console.error("Lỗi khôi phục Supabase:", error);
      toast.dismiss(loadToastId);
      toast.error(`Khôi phục thất bại: ${error.message}`);
      if (
        error.message.includes("chưa tồn tại") || 
        error.message.includes("relation") || 
        error.message.includes("does not exist") ||
        error.message.includes("unique_nv_ngay") ||
        error.message.includes("ràng buộc") ||
        error.message.includes("trùng lặp")
      ) {
        setShowSqlDialog(true);
      }
    }
  }, [updateAppData, handleFetchFromSupabase]);

  const handleRosterCellChange = useCallback((row: any, colKey: string, value: any) => {
    updateAppData((prev) => {
      const qRoster = prev.Q_Roster || [];
      const updatedRoster = qRoster.map((r) => {
        const isMatch = (r._uuid && row._uuid && r._uuid === row._uuid) || 
                        (!r._uuid && r._rowId === row._rowId && r.ma_nv === row.ma_nv && r.ngay === row.ngay && r.gio_vao === row.gio_vao);
        if (isMatch) {
          return {
            ...r,
            [colKey]: value,
            ...(colKey === "ngay" ? { date: value } : {}),
            ...(colKey === "date" ? { ngay: value } : {}),
            ...(colKey === "class" ? { classCode: value } : {}),
            ...(colKey === "classCode" ? { class: value } : {}),
            ...(colKey === "gio_vao" ? { from: value } : {}),
            ...(colKey === "from" ? { gio_vao: value } : {}),
            ...(colKey === "gio_ra" ? { to: value } : {}),
            ...(colKey === "to" ? { gio_ra: value } : {}),
            ...(colKey === "notes" ? { notes: value } : {}),
          };
        }
        return r;
      });
      return {
        ...prev,
        Q_Roster: updatedRoster,
      };
    });
    toast.success("Đã cập nhật dữ liệu!");
  }, [updateAppData]);

  return (
    <>
      <AnimatePresence initial={false}>
        {view === "final" && (
          <motion.div
            key="final"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ y: "100%", opacity: 0 }}
            className="flex-1 flex flex-col min-h-0 gap-4 relative overflow-hidden bg-transparent w-full px-6 pt-2"
            style={{ paddingBottom: "12px" }}
          >
            {/* Inner Content Area holding Sidebar and Table */}
            <div 
              className={`flex-1 grid min-h-0 relative overflow-hidden ${
                showSidebar ? "grid-cols-[238px_1fr]" : "grid-cols-1"
              } grid-rows-1 w-full h-full`}
            >
              {/* Left Panel: Sidebar Controls */}
              {showSidebar && (
                <div 
                  className="w-full shrink-0 flex flex-col h-full select-none animate-in fade-in slide-in-from-left duration-500 bg-white border-r border-[var(--border)]"
                  style={{ paddingBottom: "12px", paddingTop: "12px", paddingLeft: "12px", paddingRight: "12px", width: "238px" }}
                >
                  <div 
                    className="flex flex-col h-full overflow-hidden w-full side-panel p-3"
                    style={{ paddingTop: "8px", paddingBottom: "8px", paddingLeft: "0px", paddingRight: "0px" }}
                  >

                    {/* Scrollable Container for all Sidebar content */}
                    <div 
                      className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 flex flex-col min-h-0 gap-6 w-full"
                      style={{ paddingRight: "0px", height: "94.186px", paddingLeft: "12px", paddingRight: "12px" }}
                    >
                      {/* Always show Summary */}
                      <div 
                        className="animate-in fade-in slide-in-from-top-2 duration-300 shrink-0"
                      >
                          <div id="summary-heading-container" className="mb-4" style={{ borderWidth: "0px" }}>
                            <span className="section-label" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--accent)", display: "block" }}>[ 01 ] Summary</span>
                          </div>
                          
                          <div className="flex flex-col gap-[0.5rem] mt-[1.25rem]">
                            <div 
                              className="bg-white border border-[var(--border)] px-[0.8rem] py-[0.5rem] flex flex-col gap-1 rounded-sm"
                              style={{ height: "51.807px", borderWidth: "0px", paddingTop: "0px", paddingBottom: "0px" }}
                            >
                              <span className="text-[0.55rem] uppercase tracking-[0.1em] text-muted-foreground font-bold">Total Entries</span>
                              <span className="text-[1.2rem] font-sans font-extrabold text-[foreground]">{currentData.length.toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="bg-[rose] px-[0.8rem] py-[0.5rem] flex flex-col gap-1 rounded-sm">
                              <span className="text-[0.55rem] uppercase tracking-[0.1em] text-[foreground]/60 font-bold font-sans">Khong Luong</span>
                              <span className="text-[1.2rem] font-sans font-extrabold text-[foreground]">{calculatedRosterData.filter(d => d.loai === "KL").length.toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>

                    <div 
                      className="stat-group stat-card pt-6 border-t border-[var(--border)]"
                      style={{ marginBottom: "0px", paddingTop: "0px" }}
                    >
                      <span className="section-label" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--accent)", display: "block", marginBottom: "1rem" }}>Report Period</span>
                      <div className="value" style={{ fontSize: "1.8rem", fontWeight: 300, color: "#0d0d25" }}>
                        {fromDate && toDate 
                          ? format(new Date(`${toDate}T00:00:00`), "MMMM yyyy")
                          : "All Time"}
                      </div>
                    </div>

                    <div className="stat-group" style={{ marginBottom: "0px" }}>
                      <span className="label" style={{ color: "#121d28" }}>Total Duration</span>
                      <div className="value" style={{ fontSize: "23px", lineHeight: "30px" }}>
                        {calculatedRosterData.reduce((sum, r) => sum + (r.duration || 0), 0).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="stat-group" style={{ marginBottom: "0px", height: "44.9786px" }}>
                      <span className="label" style={{ color: "#070e15" }}>Last Processing</span>
                      <div className="value" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {appData?.lastSupabaseSyncAt 
                          ? format(new Date(appData.lastSupabaseSyncAt), "yyyy.MM.dd // HH:mm")
                          : "Chưa đồng bộ"}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between shrink-0">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/40 uppercase">FILTERS [01]</span>
                    </div>
                    <div 
                      className="flex flex-col gap-4 w-full"
                      style={{ height: "381.562px" }}
                    >
                      {/* Month Quick Select */}
                      <div className="flex flex-col gap-1 relative mb-2">
                        <span 
                          className="font-mono text-[8px] tracking-[0.2em] uppercase text-foreground/50 leading-none"
                          style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '10px' }}
                        >
                          SELECT MONTH
                        </span>
                        <Popover open={isMonthOpen} onOpenChange={setIsMonthOpen}>
                          <PopoverTrigger asChild>
                            <button className="bg-card/80 hover:bg-card rounded-lg px-4 py-3 border border-accent/20 hover:border-accent/40 focus:outline-none transition-all w-full flex items-center justify-between cursor-pointer select-none text-[13px] font-black text-foreground shadow-sm">
                              <span style={{ fontSize: "11px" }}>
                                {fromDate && toDate 
                                  ? `Chu kỳ ${format(new Date(`${toDate}T00:00:00`), "MM/yyyy")}`
                                  : "Chọn chu kỳ tháng"}
                              </span>
                              <ChevronDown className="w-4 h-4 text-foreground/50" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[270px] bg-[var(--card)] opacity-100 border border-accent/20 shadow-xl rounded-xl p-2 z-[99999]" align="start">
                            <div className="grid grid-cols-3 gap-1 p-1">
                              {Array.from({ length: 12 }, (_, i) => {
                                const month = i + 1;
                                const currentYear = uiSettings.defaultAuditYear || new Date().getFullYear();
                                return (
                                  <button
                                    key={month}
                                    onClick={() => {
                                      const year = currentYear;
                                      const prevMonth = month === 1 ? 12 : month - 1;
                                      const prevYear = month === 1 ? year - 1 : year;
                                      
                                      const start = `${prevYear}-${String(prevMonth).padStart(2, '0')}-21`;
                                      const end = `${year}-${String(month).padStart(2, '0')}-20`;
                                      
                                      startTransition(() => {
                                        setFromDate(start);
                                        setToDate(end);
                                        setTargetDate("");
                                        setTargetCenter("");
                                      });
                                      setIsMonthOpen(false);
                                    }}
                                    className="py-3 text-[12px] font-bold rounded-lg hover:bg-accent/10 text-accent hover:text-accent/80 transition-colors cursor-pointer text-center"
                                  >
                                    Th{month}
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Last Pushed to Supabase Status */}
                      <div className="flex flex-col gap-1 relative bg-transparent p-3 rounded-md border border-dashed border-[#d27464]/70 shadow-none animate-in fade-in zoom-in-95">
                        <span 
                          className="font-mono tracking-[0.2em] uppercase text-[#d27464]/80 leading-none flex items-center gap-1"
                          style={{ fontWeight: 'bold', fontSize: '9px', lineHeight: '10px' }}
                        >
                          PUSH STATUS
                        </span>
                        <span className="text-[12px] font-bold text-[#d27464]">
                          {appData?.lastSupabaseSyncAt 
                            ? format(new Date(appData.lastSupabaseSyncAt), "dd/MM/yyyy hh:mm a").replace("AM", "SA").replace("PM", "CH")
                            : "Chưa đồng bộ"}
                        </span>
                      </div>

                      {/* Start Date Selection */}
                      <div className="flex flex-col gap-1 relative">
                        <span 
                          className="font-mono text-[8px] tracking-[0.2em] uppercase text-foreground/50 leading-none"
                          style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '10px' }}
                        >
                          START DATE
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="bg-card rounded-lg px-3 py-2 border border-[rgba(61,57,53,0.08)] hover:border-accent focus:outline-none transition-all w-full flex items-center justify-between cursor-pointer select-none text-[11px] font-bold text-foreground">
                              <span>
                                {fromDate
                                  ? format(new Date(`${fromDate}T00:00:00`), "dd/MM/yyyy")
                                  : "Chọn ngày"}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[99999] bg-[var(--card)] opacity-100 border border-border shadow-xl rounded-xl">
                            <Calendar
                              mode="single"
                              selected={fromDate ? new Date(`${fromDate}T00:00:00`) : undefined}
                              defaultMonth={fromDate ? new Date(`${fromDate}T00:00:00`) : undefined}
                              onSelect={(d) => {
                                startTransition(() => {
                                  const newDate = d ? format(d, "yyyy-MM-dd") : "";
                                  setFromDate(newDate);
                                  setTargetDate("");
                                  setTargetCenter("");
                                });
                              }}
                              className="p-3 pointer-events-auto bg-card"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* End Date Selection */}
                      <div className="flex flex-col gap-1 relative">
                        <span 
                          className="font-mono text-[8px] tracking-[0.2em] uppercase text-foreground/50 leading-none"
                          style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '10px' }}
                        >
                          END DATE
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="bg-card rounded-lg px-3 py-2 border border-[rgba(61,57,53,0.08)] hover:border-accent focus:outline-none transition-all w-full flex items-center justify-between cursor-pointer select-none text-[11px] font-bold text-foreground">
                              <span>
                                {toDate
                                  ? format(new Date(`${toDate}T00:00:00`), "dd/MM/yyyy")
                                  : "Chọn ngày"}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[99999] bg-[var(--card)] opacity-100 border border-border shadow-xl rounded-xl">
                            <Calendar
                              mode="single"
                              selected={toDate ? new Date(`${toDate}T00:00:00`) : undefined}
                              defaultMonth={toDate ? new Date(`${toDate}T00:00:00`) : undefined}
                              onSelect={(d) => {
                                startTransition(() => {
                                  const newDate = d ? format(d, "yyyy-MM-dd") : "";
                                  setToDate(newDate);
                                  setTargetDate("");
                                  setTargetCenter("");
                                });
                              }}
                              className="p-3 pointer-events-auto bg-card"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Search Term input */}
                      <div className="flex flex-col gap-1 relative">
                        <span 
                          className="font-mono text-[8px] tracking-[0.2em] uppercase text-foreground/50 leading-none"
                          style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '10px' }}
                        >
                          KEYWORD
                        </span>
                        <div className="relative">
                          <DebouncedSearchInput
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(val) => {
                              startTransition(() => {
                                setSearchTerm(val);
                                setDebouncedSearchTerm(val);
                              });
                            }}
                            className="bg-card rounded-full pl-8 pr-2.5 py-2 border border-[rgba(61,57,53,0.08)] hover:border-accent focus:border-accent focus:outline-none transition-all w-full text-[11px] font-bold text-foreground"
                          />
                          <Search className="w-3.5 h-3.5 text-foreground/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                
                    </div>
                    </div> {/* Closes scrollable container */}

                    <div 
                      className="actions mt-auto pt-4 border-t border-[var(--border)] w-full shrink-0 flex flex-col gap-2"
                      style={{ paddingLeft: "12px", paddingRight: "12px" }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="btn-secondary w-full flex items-center justify-center gap-1.5"
                            style={{ height: "37.0704px", paddingTop: "0px", paddingBottom: "0px" }}
                            title="Cài đặt & Tiện ích"
                          >
                            <Settings className="w-3.5 h-3.5 hover:rotate-45 transition-transform duration-500 shrink-0" />
                            <span>Settings</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white border border-border shadow-2xl rounded-2xl z-[99999]">
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5">
                            CÀI ĐẶT & THAO TÁC
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-100" />

                          <DropdownMenuItem
                            onClick={() => window.dispatchEvent(new Event("open-ui-settings"))}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Settings className="w-3.5 h-3.5 text-[#7A1C1C]" />
                            <span>Cài đặt Giao diện</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-slate-100" />

                          {/* Sync & Save */}
                          <DropdownMenuItem
                            disabled={isSyncing}
                            onClick={handleSyncToSupabase}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isSyncing ? "Đang đồng bộ..." : "Sync & Save"}</span>
                          </DropdownMenuItem>

                          {/* Reload */}
                          <DropdownMenuItem
                            onClick={() => handleFetchFromSupabase()}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-primary" />
                            <span>Reload dữ liệu</span>
                          </DropdownMenuItem>

                          {/* Export Excel */}
                          <DropdownMenuItem
                            disabled={currentData.length === 0}
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Xuất Excel</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button 
                        className="btn-primary w-full"
                        onClick={() => setView("upload")}
                        style={{ height: "37.7759px", paddingTop: "0px", paddingBottom: "0px" }}
                      >
                        Cấu hình
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Right Panel: Content Grid */}
            <div 
              className="flex-1 flex flex-col min-h-0 h-full overflow-hidden relative animate-in fade-in slide-in-from-right duration-500 content-area"
              style={{ 
                paddingTop: "0px", 
                paddingBottom: "0px", 
                borderWidth: "0px",
                marginRight: "0px",
                paddingRight: "0px",
                paddingLeft: "0px",
                marginLeft: "16px"
              }}
            >
              <div className="table-container flex-1 flex flex-col min-h-0 relative bg-card border border-border rounded-none shadow-sm overflow-hidden">
                {(location.state?.from === "audit" || location.state?.from === "audit_applied" || (location.state?.from && String(location.state.from).includes("audit"))) && (
                  <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between z-[150] shrink-0">
                    <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>Đang xem chi tiết dữ liệu nguồn từ Bảng đối soát Audit</span>
                    </div>
                    <button
                      onClick={() => navigate("/audit", { state: { activeTab: "detail" } })}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay về bảng chi tiết lệch Audit</span>
                    </button>
                  </div>
                )}

                {isSyncing && (
                  <div className="absolute top-0 right-0 p-4 z-[100]">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground rounded-full border border-none shadow-sm animate-pulse">
                      <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                      <span className="text-[9px] font-black text-foreground uppercase tracking-wider">{syncProgress}% Synced</span>
                    </div>
                  </div>
                )}
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-primary/10 p-12 select-none">
                    <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-primary/5">
                      <Cloud className="w-8 h-8 opacity-40 text-foreground/70" />
                    </div>
                    <p className="font-bold uppercase text-base tracking-tight text-foreground/40">
                      Chưa có dữ liệu
                    </p>
                    <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest mt-2 text-center max-w-xs font-sans leading-relaxed">
                      Dữ liệu trống hoặc không khớp với ngày đang chọn.<br/>Vui lòng vào phần Summary để tải lên dữ liệu.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                      {/* Search Result Feedback when empty */}
                      {searchTerm && searchData.length === 0 && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-card/85 backdrop-blur-sm animate-in fade-in duration-300 rounded-[32px] overflow-hidden">
                          <div className="bg-card p-8 rounded-2xl border border-border shadow-xl flex flex-col items-center text-center max-w-sm">
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 border border-accent/20 text-accent shadow-inner">
                              <XCircle className="w-8 h-8" />
                            </div>
                            <h3 
                              className="text-xl font-bold text-foreground tracking-tight mb-2"
                              style={{ fontSize: '14px' }}
                            >
                              Không tìm thấy kết quả
                            </h3>
                            <p className="text-[11px] font-medium text-foreground/70 leading-relaxed mb-6 font-sans">
                              Không tìm thấy bản ghi nào khớp với từ khóa "{searchTerm}" trong khoảng thời gian này.
                            </p>
                            <button
                              onClick={handleClearFilters}
                              className="py-2.5 px-6 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider rounded-full hover:bg-primary/90 transition-all cursor-pointer font-sans"
                            >
                              Xóa lọc
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sync/Load Indicator */}
                      {isCalculating || isPending ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-card/60 relative z-10 p-12">
                          <div className="relative">
                            <div className="w-12 h-12 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
                          </div>
                          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-accent/80 animate-pulse font-sans">
                            {isPending
                              ? "Đang chuyển bảng..."
                              : `Đang xử lý ${appData.Q_Roster?.length || 0} dòng dữ liệu...`}
                          </p>
                        </div>
                      ) : activeTab === "mkt_local_north" ? (
                        <MktLocalNorthPivotTable
                          rows={mktPivotRows}
                          types={mktPivotUniqueTypes}
                          grandTotals={mktPivotGrandTotals}
                          showSidebar={showSidebar}
                          onToggleSidebar={() => setShowSidebar(!showSidebar)}
                        />
                      ) : activeTab === "roster_raw" ? (
                        <RosterRawTable
                          tableRef={tableRef}
                          data={searchData}
                          onCellChange={handleRosterCellChange}
                          showSidebar={showSidebar}
                          onToggleSidebar={() => setShowSidebar(!showSidebar)}
                        />
                      ) : activeTab === "employee" ? (
                        <EmployeeTable
                          tableRef={tableRef}
                          data={searchData}
                          calculatedRosterData={calculatedRosterData}
                          showSidebar={showSidebar}
                          onToggleSidebar={() => setShowSidebar(!showSidebar)}
                        />
                      ) : activeTab === "center" ? (
                        <CenterTable
                          tableRef={tableRef}
                          data={searchData}
                          showSidebar={showSidebar}
                          onToggleSidebar={() => setShowSidebar(!showSidebar)}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {view === "upload" && (
          <motion.div
            key="upload"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 flex flex-col p-0 w-full"
            style={{
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingTop: "12px",
              paddingBottom: "12px",
            }}
          >
            <TimesheetSummaryPage onBack={() => setView("final")} />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-2xl bg-card rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-wider">Thiết lập & Cập nhật Supabase</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium text-[11px] leading-relaxed">
                Bảng 'roster_cham_cong' chưa tồn tại, thiếu cột (như charge_to_center_mkt) hoặc đang bị ràng buộc cũ (như unique_nv_ngay - giới hạn mỗi người 1 ca/ngày). Vui lòng copy toàn bộ script bên dưới và chạy trong SQL Editor của Supabase để cập nhật cấu trúc bảng chính xác nhất.
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
          <DialogFooter className="p-6 bg-secondary border-t border-border/50">
            <Button 
              onClick={() => setShowSqlDialog(false)}
              className="bg-primary hover:opacity-90 text-primary-foreground rounded-xl px-8 font-black uppercase tracking-widest text-[10px]"
            >
              Tôi đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

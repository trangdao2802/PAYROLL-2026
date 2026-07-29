/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useCallback, forwardRef } from "react";
import { useAppData } from "../../../lib/contexts/AppDataContext";
import { DataTable } from "../../../components/DataTable";
import { Trash2, Settings, Download, RefreshCw, Plus, Search, X, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { parseMoneyToNumber, removeVietnameseTones } from "../../../lib/utils/data-utils";
import { toast } from "sonner";

function cleanIDNumber(val: unknown): string {
  if (val === undefined || val === null) return "";
  let str = String(val).trim();
  if (typeof val === "number") {
    if (str.includes("E") || str.includes("e") || str.includes("+")) {
      str = val.toLocaleString("fullwide", { useGrouping: false });
    }
    if (str.includes(".")) {
      str = str.split(".")[0];
    }
  } else {
    if (str.includes("E") || str.includes("e")) {
      const num = Number(str);
      if (!isNaN(num)) {
        str = num.toLocaleString("fullwide", { useGrouping: false });
      }
    }
    if (str.includes(".")) {
      const parts = str.split(".");
      if (parts[1] === "0" || parts[1] === "00" || /^[0]+$/.test(parts[1])) {
        str = parts[0];
      }
    }
  }
  return str;
}

function cleanFullName(val: unknown): string {
  if (val === undefined || val === null) return "";
  const str = String(val).trim();
  return removeVietnameseTones(str).toUpperCase();
}

interface HoldAETableProps {
  searchTerm: string;
  onSearchTermChange?: (term: string) => void;
  onAddRow?: (idx?: number) => void;
  cameFromBulkPayment?: boolean;
  onBackToBulkPayment?: () => void;
}

export const HoldAETable = forwardRef<any, HoldAETableProps>(
  ({ searchTerm, onSearchTermChange, onAddRow, cameFromBulkPayment, onBackToBulkPayment }, ref) => {
    const { appData, updateAppData } = useAppData();

    // 1. Month range parser and validator
    const parseToMonthIndex = useCallback(
      (str: string): number => {
        if (!str) return 0;
        const clean = str.toUpperCase().trim();

        const currentPeriodVal = appData.globalMonth || "03.2026";
        const yearParts = currentPeriodVal.split(".");
        const currentYear = yearParts.length === 2 ? parseInt(yearParts[1], 10) : 2026;
        const currentMonthNum = yearParts.length === 2 ? parseInt(yearParts[0], 10) : 3;

        const dateMatch = clean.match(/(\d{1,2})(?:[./-]|\s+|năm\s+)(\d{4})/i);
        if (dateMatch) {
          const m = parseInt(dateMatch[1], 10);
          const y = parseInt(dateMatch[2], 10);
          return y * 12 + m;
        }
        const tMatch = clean.match(/T[HÁNG]*\s*(\d{1,2})/i);
        if (tMatch) {
          const m = parseInt(tMatch[1], 10);
          let y = currentYear;
          if (m > currentMonthNum) {
            y = currentYear - 1;
          }
          return y * 12 + m;
        }
        const numMatch = clean.match(/^(\d+)$/);
        if (numMatch) {
          const m = parseInt(numMatch[1], 10);
          let y = currentYear;
          if (m > currentMonthNum) {
            y = currentYear - 1;
          }
          return y * 12 + m;
        }
        return 0;
      },
      [appData.globalMonth],
    );

    // 2. Filter data up to the current active period
    const filteredData = useMemo(() => {
      const raw = appData.Hold_AE || { headers: [], data: [] };
      if (!raw.data || !Array.isArray(raw.data))
        return { headers: [], data: [] };

      const currentPeriodVal = appData.globalMonth || "03.2026";
      const currentLimit = parseToMonthIndex(currentPeriodVal);

      const filteredRows = raw.data.filter((r: any) => {
        const rowMonth = r["Tháng báo cáo"] || r["_fileMonth"] || "";
        const rowLimit = parseToMonthIndex(rowMonth);
        return rowLimit <= currentLimit;
      }).map((row: any) => {
        // Enforce default total payment sign when Reporting Month equals Arising Month
        const rowReportingMonth = String(row["Tháng báo cáo"] || "").trim();
        const rowArisingMonth = String(row["Tháng phát sinh"] || "").trim();
        if (rowReportingMonth && rowArisingMonth && rowReportingMonth === rowArisingMonth) {
          const nghiepVu = String(row["Nghiệp vụ"] || "").toUpperCase().trim();
          const currentTotalPayment = parseMoneyToNumber(row["TOTAL PAYMENT"] || 0);
          
          if (nghiepVu.includes("HOLD") || nghiepVu === "H") {
            row["TOTAL PAYMENT"] = -Math.abs(currentTotalPayment);
          } else if (nghiepVu.includes("CANCEL") || nghiepVu === "C") {
            row["TOTAL PAYMENT"] = -Math.abs(currentTotalPayment);
          } else if (nghiepVu.includes("ADD") || nghiepVu === "A" || nghiepVu === "") {
            row["TOTAL PAYMENT"] = Math.abs(currentTotalPayment);
          } else if (nghiepVu === "B" || nghiepVu.includes("BONUS") || nghiepVu === "⏩" || nghiepVu === "⏯") {
            row["TOTAL PAYMENT"] = Math.abs(currentTotalPayment);
          }
        }
        return row;
      });

      return { ...raw, data: filteredRows };
    }, [appData.Hold_AE, appData.globalMonth, parseToMonthIndex]);

    // 3. Special cell change handler for Hold_AE
    const handleCellChange = useCallback(
      (row: Record<string, any>, columnKey: string, value: any) => {
        if (["Tháng báo cáo"].includes(columnKey)) {
          return;
        }

        updateAppData((prev: any) => {
          const targetTab = prev.Hold_AE;
          if (!targetTab || !targetTab.data) return prev;

          const data = [...targetTab.data];
          const rowIndex = data.findIndex(
            (r, idx) =>
              r && row &&
              ((row._originalIndex !== undefined &&
                idx === row._originalIndex) ||
                (r.id && row.id && r.id === row.id) ||
                r === row ||
                (r["ID Number"] === row["ID Number"] &&
                  r["TOTAL PAYMENT"] === row["TOTAL PAYMENT"] &&
                  ((r["No."] !== undefined && r["No."] === row["No."]) ||
                    (r["No"] !== undefined && r["No"] === row["No"]) ||
                    (r["STT"] !== undefined && r["STT"] === row["STT"])))),
          );

          if (rowIndex === -1) return prev;

          let finalValue = value;
          const colKeyUpper = String(columnKey || "").toUpperCase();
          if (colKeyUpper.includes("ID NUMBER") || colKeyUpper === "ID" || colKeyUpper === "CCCD" || colKeyUpper === "MÃ AE") {
            finalValue = cleanIDNumber(value);
          } else if (
            colKeyUpper.includes("FULL NAME") ||
            colKeyUpper.includes("BENEFICIARY NAME") ||
            colKeyUpper.includes("HỌ VÀ TÊN")
          ) {
            finalValue = cleanFullName(value);
          }

          const updatedRow = { ...data[rowIndex], [columnKey]: finalValue };

          // Automatically offset the TOTAL PAYMENT sign based on Trạng thái or Nghiệp vụ
          if (columnKey === "Trạng thái" || columnKey === "Nghiệp vụ") {
            const valUpper = String(value || "").toUpperCase();
            const currentTotalPayment = parseMoneyToNumber(
              updatedRow["TOTAL PAYMENT"] || 0,
            );
            if (valUpper.includes("HOLD") || valUpper === "H") {
              updatedRow["TOTAL PAYMENT"] = -Math.abs(currentTotalPayment);
              updatedRow["Nghiệp vụ"] = "Hold";
            } else if (valUpper.includes("CANCEL") || valUpper === "C") {
              updatedRow["TOTAL PAYMENT"] = -Math.abs(currentTotalPayment);
              updatedRow["Nghiệp vụ"] = "Cancel";
            } else if (valUpper.includes("ADD") || valUpper === "A") {
              updatedRow["TOTAL PAYMENT"] = Math.abs(currentTotalPayment);
              updatedRow["Nghiệp vụ"] = "Add";
            } else if (valUpper === "BONUS" || valUpper === "B" || valUpper.includes("BONUS") || value === "⏩" || value === "⏯") {
              updatedRow["TOTAL PAYMENT"] = Math.abs(currentTotalPayment);
              updatedRow["Nghiệp vụ"] = "BONUS";
            }
          }

          data[rowIndex] = updatedRow;

          return {
            ...prev,
            Hold_AE: { ...targetTab, data },
          };
        });
      },
      [updateAppData],
    );

    // 4. Row deletion handler for Hold_AE
    const handleDeleteRow = useCallback(
      (rowToDelete: Record<string, any>) => {
        updateAppData((prev: any) => {
          const targetTab = prev.Hold_AE;
          if (!targetTab || !targetTab.data) return prev;

          const data = [...targetTab.data];
          const rowIndex = data.findIndex(
            (r, idx) =>
              r && rowToDelete &&
              ((rowToDelete._originalIndex !== undefined &&
                idx === rowToDelete._originalIndex) ||
                (r.id && rowToDelete.id && r.id === rowToDelete.id) ||
                r === rowToDelete ||
                (r["ID Number"] === rowToDelete["ID Number"] &&
                  r["TOTAL PAYMENT"] === rowToDelete["TOTAL PAYMENT"])),
          );

          if (rowIndex === -1) return prev;

          data.splice(rowIndex, 1);
          return {
            ...prev,
            Hold_AE: { ...targetTab, data },
          };
        });
        toast.success("Đã xóa dòng");
      },
      [updateAppData],
    );

    const handleDeleteSelection = useCallback(
      (range: { startR: number; endR: number; startC?: number; endC?: number }) => {
        const currentRef = ref as any;
        let rowsToDelete: any[] = [];
        
        if (currentRef?.current?.getFilteredAndSortedData) {
          const allRenderedData = currentRef.current.getFilteredAndSortedData();
          const minR = Math.min(range.startR, range.endR);
          const maxR = Math.max(range.startR, range.endR);
          rowsToDelete = allRenderedData.slice(minR, maxR + 1);
        } else {
          // Fallback if ref is not available
          const minR = Math.min(range.startR, range.endR);
          const maxR = Math.max(range.startR, range.endR);
          rowsToDelete = filteredData.data.slice(minR, maxR + 1);
        }

        if (rowsToDelete.length === 0) return;

        updateAppData((prev: any) => {
          const targetTab = prev.Hold_AE;
          if (!targetTab || !targetTab.data) return prev;

          const data = [...targetTab.data].filter((r) => {
            return r && !rowsToDelete.some(
              (rowToDelete) =>
                rowToDelete &&
                ((rowToDelete._originalIndex !== undefined &&
                  targetTab.data.indexOf(r) === rowToDelete._originalIndex) ||
                (r.id && rowToDelete.id && r.id === rowToDelete.id) ||
                r === rowToDelete ||
                (r["ID Number"] === rowToDelete["ID Number"] &&
                  r["TOTAL PAYMENT"] === rowToDelete["TOTAL PAYMENT"])),
            );
          });

          return {
            ...prev,
            Hold_AE: { ...targetTab, data },
          };
        });
        
        if (currentRef?.current?.clearSelection) {
          currentRef.current.clearSelection();
        }
        
        toast.success(`Đã xóa ${rowsToDelete.length} dòng`);
      },
      [filteredData.data, updateAppData, ref],
    );

    // 5. Dynamic Columns memoization
    const columns = useMemo(() => {
      let headers = filteredData.headers;
      if (!headers || headers.length === 0) {
        // Fallback headers to prevent empty rendering
        headers = [
          "Sheet Source", "STT", "Tháng báo cáo", "Phân quyền", "Mã AE", 
          "STK AE", "Beneficiary Name", "Business", "L07", "Sales/Rehiring AE GP Amount (Final)",
          "TOTAL PAYMENT", "Bank", "Note", "Tháng phát sinh", "Nghiệp vụ", "Tình trạng thanh toán", "Trạng thái"
        ];
      } else {
        headers = [...headers];
      }

      // Merge additional keys from data to ensure nothing is hidden
      if (filteredData.data && filteredData.data.length > 0) {
        const allKeys = Object.keys(filteredData.data[0]);
        allKeys.forEach(key => {
          const kUp = key.toUpperCase();
          if (
            !key.startsWith("_") &&
            kUp !== "ID" &&
            kUp !== "_ID" &&
            kUp !== "UUID" &&
            kUp !== "ROWID" &&
            kUp !== "RECORDID" &&
            !headers!.some(h => String(h).toUpperCase() === kUp)
          ) {
            headers!.push(key);
          }
        });
      }

      headers = headers!.filter(h => {
        const u = String(h).trim().toUpperCase();
        return u !== "ID" && u !== "_ID" && u !== "UUID" && u !== "ROWID" && u !== "RECORDID" && !u.startsWith("_");
      });

      // Ensure "Tháng báo cáo" exists and is visible
      const hUpArr = headers.map(h => String(h).toUpperCase());
      if (!hUpArr.includes("THÁNG BÁO CÁO")) {
        headers.push("Tháng báo cáo");
      }

      const desiredOrder = [
        "THÁNG BÁO CÁO",
        "BUSINESS",
        "L07",
        "ID NUMBER",
        "FULL NAME",
        "BANK ACCOUNT NUMBER",
        "TAX CODE",
        "CONTRACT NO",
        "TOTAL PAYMENT",
        "SHEET SOURCE",
        "NGHIỆP VỤ",
        "NOTE"
      ];

      headers.sort((a, b) => {
        const idxA = desiredOrder.indexOf(a.toUpperCase());
        const idxB = desiredOrder.indexOf(b.toUpperCase());
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      const isNoCol = (h: string) => {
        const u = String(h).trim().toUpperCase();
        return u === "NO." || u === "NO" || u === "STT";
      };

      const firstNoIdx = headers.findIndex(isNoCol);
      if (firstNoIdx !== -1) {
        const actualNo = headers[firstNoIdx];
        headers = headers.filter((h, idx) => idx === firstNoIdx || !isNoCol(h));
        headers = [actualNo, ...headers.filter(h => h !== actualNo)];
      }

      return headers
        .map((header: string) => {
          const h = header.toUpperCase();
          const isLabel = h === "LABEL";
          let type: "text" | "number" | "currency" | "label" = "text";

          let renderOption: ((value: any, row: any) => React.ReactNode) | undefined;
          if (h === "THÁNG BÁO CÁO") {
            renderOption = (val, row) => val || row["_fileMonth"] || row["Tháng"] || "";
          }

          if (
            h.includes("TOTAL") ||
            h.includes("CHARGE") ||
            h.includes("PAYMENT") ||
            h.includes("AE") ||
            h.includes("LỆCH") ||
            h.includes("TIỀN") ||
            h.includes("AMOUNT") ||
            h.includes("INCENTIVE") ||
            h.includes("PHẠT") ||
            h.includes("THƯỞNG") ||
            h.includes("CHI") ||
            h.includes("THU") ||
            h.includes("SALARY") ||
            h.includes("LƯƠNG") ||
            h.includes("CỘNG") ||
            h.includes("GP") ||
            h.includes("VALUE")
          ) {
            if (
              !(
                h.includes("ID") ||
                h.includes("ACCOUNT") ||
                h.includes("NUMBER") ||
                h.includes("CODE") ||
                h.includes("STK") ||
                h.includes("MÃ") ||
                h.includes("CENTER") ||
                h.includes("KHÁCH HÀNG")
              )
            ) {
              type = "currency";
            }
          }
          if (isLabel) type = "label";

          const isReadOnly = [
            "Tháng báo cáo",
            "Nghiệp vụ",
            "Trạng thái",
            "Tháng phát sinh",
            "Tình trạng thanh toán",
          ].includes(header);

          if (header === "Nghiệp vụ") {
            renderOption = (value: any, row: any) => {
              const nghiepVu = String(row["Nghiệp vụ"] || "").toUpperCase().trim();
              const isHold = nghiepVu.includes("HOLD") || nghiepVu === "H";
              const isCancel = nghiepVu.includes("CANCEL") || nghiepVu === "C";
              const isBonus = nghiepVu === "BONUS" || nghiepVu === "B" || nghiepVu.includes("BONUS") || nghiepVu === "⏩" || nghiepVu === "⏯";
              const isAdd = !isHold && !isCancel && !isBonus;

              const currentPeriodVal = appData.globalMonth || "03.2026";
              const currentPeriodParts = currentPeriodVal.split(".");
              const currentMonthNum = parseInt(currentPeriodParts[0], 10) || 3;
              const currentYearNum = parseInt(currentPeriodParts[1], 10) || 2026;
              const currentPeriod = `${String(currentMonthNum).padStart(2, "0")}.${currentYearNum}`;

              const rowReportingMonth = String(
                row["Tháng báo cáo"] || "",
              ).trim();
              const isPeriodMatch = rowReportingMonth === currentPeriod;

              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center w-full py-1"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPeriodMatch) {
                        let nextStatus = "Add";
                        if (isAdd) nextStatus = "Hold";
                        else if (isHold) nextStatus = "Cancel";
                        else if (isCancel) nextStatus = "Bonus";
                        else if (isBonus) nextStatus = "Add";
                        handleCellChange(row, "Nghiệp vụ", nextStatus);
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border shadow-sm transition-all select-none h-7 w-24 hover:brightness-95 active:scale-95 ${
                      !isPeriodMatch
                        ? "bg-secondary/30 border-border text-foreground/40 opacity-40 cursor-not-allowed pointer-events-none shadow-none"
                        : isHold
                          ? "bg-amber-500 border-amber-500 text-white"
                          : isCancel
                            ? "bg-rose-500 border-rose-500 text-white"
                            : isBonus
                              ? "bg-indigo-500 border-indigo-500 text-white"
                              : "bg-primary border-primary text-white"
                    }`}
                    title={!isPeriodMatch ? `Chỉ sửa đổi được tại card tháng chọn` : `Bấm 1 lần để chuyển nghiệp vụ nhanh (Add ➔ Hold ➔ Cancel ➔ Bonus)`}
                    disabled={!isPeriodMatch}
                  >
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/10 text-white text-[10px] font-extrabold">
                      {isHold ? "H" : isCancel ? "C" : isBonus ? "B" : "A"}
                    </span>
                    <span>{isHold ? "Hold" : isCancel ? "Cancel" : isBonus ? "Bonus" : "Add"}</span>
                  </button>
                </div>

              );
            };
          }

          return {
            key: header,
            label: h === "STT" ? "No." : header,
            type,
            hidden: !desiredOrder.includes(h) || h === "STT" || h === "NO.",
            sortable: header !== "Nghiệp vụ",
            filterable: true,
            readOnly: isReadOnly,
            render: renderOption,
            width: header === "Nghiệp vụ" ? 160 : undefined,
            showGrandTotal: type === "currency" || type === "number" || type === "money",
          };
        });
    }, [filteredData.headers, filteredData.data, handleCellChange, appData.globalMonth]);

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const handleRefresh = () => {
      setIsRefreshing(true);
      updateAppData((prev: any) => ({ ...prev }));
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Đã làm mới dữ liệu Hold AE");
      }, 500);
    };

    const handleExportExcel = () => {
      import("xlsx").then((XLSX) => {
        const ws = XLSX.utils.json_to_sheet(filteredData.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hold_AE");
        XLSX.writeFile(wb, "Hold_AE_Export.xlsx");
        toast.success("Đã xuất file Excel thành công");
      });
    };

    const handleClearAll = () => {
      if (window.confirm("Bạn có chắc chắn muốn xóa tất cả dữ liệu Hold AE?")) {
        updateAppData((prev: any) => ({
          ...prev,
          Hold_AE: { ...prev.Hold_AE, data: [] }
        }));
        toast.success("Đã xóa tất cả dữ liệu Hold AE");
      }
    };

    return (
      <div 
        className="flex-1 flex flex-col min-h-0 w-full h-full px-0 py-0 m-0 relative overflow-hidden gap-0 bg-white border border-slate-300 dark:border-slate-700 shadow-xs"
        style={{ borderRadius: "0px", borderWidth: "1px", borderColor: "#cbd5e1" }}
      >
        {/* Top Toolbar Header with Settings Button */}
        <div className="px-6 py-2.5 border border-slate-300 bg-[#FAF9F6] flex items-center justify-between gap-4 shrink-0 select-none" style={{ borderRadius: "0px" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-primary">
                Benefits & Deductions Summary
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cameFromBulkPayment && (
              <button
                onClick={() => onBackToBulkPayment?.()}
                className="h-8 px-3 mr-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
                style={{ borderRadius: "9999px" }}
                title="Quay lại Bảng Đối Soát"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về Bảng Đối Soát</span>
              </button>
            )}
            
            {/* Search Input */}
            <div 
              className="flex items-center gap-2 h-9 px-3.5 py-1 text-xs w-48 sm:w-64 bg-white border border-slate-200/80 shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all rounded-full"
              style={{ borderRadius: "24px" }}
            >
              <Search className="w-4 h-4 text-blue-500 shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange?.(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchTermChange?.("")}
                  className="text-slate-400 hover:text-slate-700 text-xs p-0.5 transition-colors cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Nút Cài đặt (Settings Button) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
                  style={{ borderRadius: "9999px" }}
                  title="Cài đặt & Thao tác"
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100 z-[99999]">
                <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">
                  Action Center
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50" />
                {onAddRow && (
                  <DropdownMenuItem
                    onClick={() => onAddRow()}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-slate-700">Thêm dòng mới</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleRefresh}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="text-xs font-bold text-slate-700">Làm mới dữ liệu</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new Event("open-ui-settings"))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Cài đặt Giao diện</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportExcel}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Xuất file Excel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem
                  onClick={handleClearAll}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-rose-50 text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Xóa tất cả dữ liệu</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

          <DataTable
            className="flex-1 !overflow-visible" scrollContainerStyle={{ borderRadius: "0", border: "1px solid var(--border, #E7DBDC)", borderTop: "none" }}
            stickyFirstColumn={false}
            showPagination={true}
            ref={ref}
            columns={columns}
            data={filteredData.data}
            onCellChange={handleCellChange}
            onDeleteRow={handleDeleteRow}
            onDeleteSelection={handleDeleteSelection}
            onAddRow={onAddRow}
            isEditable={true}
            showRowNumber={true}
            selectable={false}
            bulkActions={[
              {
                label: "Xóa các dòng đã chọn",
                icon: <Trash2 className="w-3 h-3" />,
                variant: "destructive",
                onClick: (selectedRows) => {
                  updateAppData((prev: any) => {
                    const targetTab = prev.Hold_AE;
                    if (!targetTab || !targetTab.data) return prev;

                    const data = [...targetTab.data].filter((r) => {
                      return r && !selectedRows.some(
                        (rowToDelete) =>
                          rowToDelete &&
                          ((rowToDelete._originalIndex !== undefined &&
                            targetTab.data.indexOf(r) === rowToDelete._originalIndex) ||
                          (r.id && rowToDelete.id && r.id === rowToDelete.id) ||
                          r === rowToDelete ||
                          (r["ID Number"] === rowToDelete["ID Number"] &&
                            r["TOTAL PAYMENT"] === rowToDelete["TOTAL PAYMENT"])),
                      );
                    });

                    return {
                      ...prev,
                      Hold_AE: { ...targetTab, data },
                    };
                  });
                  const currentRef = ref as any;
                  if (currentRef?.current?.clearSelection) {
                    currentRef.current.clearSelection();
                  }
                  toast.success(`Đã xóa ${selectedRows.length} dòng`);
                },
              },
            ]}
          externalSearchTerm={searchTerm}
          onExternalSearchChange={onSearchTermChange}
          storageKey="master_ae_Hold_AE"
          ignoreSavedHiddenColumns={false}
          hideSearch={true}
          showFooter={true}
          footerClassName="bg-[#FAF9F6] text-slate-800 border-t border-slate-300 font-bold"
          totalCalculationOverride={(row: any, colKey: string) => {
            if (colKey === "TOTAL PAYMENT" && row._isPastMonthHoldOrCancel) return 0;
            return null;
          }}
          headerClassName="bg-[#FAF9F6] text-slate-800 border-slate-300 font-bold"
        />
      </div>
    );
  },
);

HoldAETable.displayName = "HoldAETable";

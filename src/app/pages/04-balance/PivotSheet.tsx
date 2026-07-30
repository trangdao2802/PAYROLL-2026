/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Download, RefreshCw, Database, Settings, FileSpreadsheet } from "lucide-react";
import { useAppData } from "../../lib/contexts/AppDataContext";
import { toast } from "sonner";

// ==========================================
// MAPPING DEFINITIONS & LOGIC FROM USER SPEC
// ==========================================

// ==========================================
// PIVOT SHEET COMPONENT
// ==========================================

import PivotWorker from "../../workers/pivot.worker?worker&inline";

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
  const [sourceInfo, setSourceInfo] = useState<string>(() => {
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
  const isPivotSheetVisible = true;
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFileBuffers = useCallback((fileList: { name: string; bank?: string; buffer: ArrayBuffer }[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = new PivotWorker();
        worker.onmessage = (e: MessageEvent) => {
          const { success, result, error } = e.data;
          worker.terminate();
          if (success) {
            resolve(result);
          } else {
            reject(new Error(error || "Unknown worker error"));
          }
        };
        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };
        worker.postMessage({ fileList });
      } catch (err) {
        reject(err);
      }
    });
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
        setSourceInfo(infoStr);

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
          setSourceInfo("");
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
      setSourceInfo(infoStr);
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
    const headers = ["NO.", "Business", "CHARGE TO CENTER MKT / L07", ...typeColumns, "TỔNG CỘNG"];
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

  const totalRowsCount = allFlatRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRowsCount / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalRowsCount === 0 ? 0 : (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRowsCount);
  const paginatedRows = allFlatRows.slice(startIndex, endIndex);

  const renderRows = () => {
    if (paginatedRows.length === 0) {
      return (
        <tr>
          <td colSpan={4 + typeColumns.length} className="py-12 text-center text-slate-400 text-sm">
            Chưa có dữ liệu. Vui lòng tải file ở bảng <span className="font-semibold text-slate-600">Cài đặt & Tải file (Master)</span> và nhấn <span className="font-semibold text-slate-600">Xử lý dữ liệu</span>.
          </td>
        </tr>
      );
    }

    return paginatedRows.map((item) => (
      <tr key={`${item.bu}-${item.l07}`} className="hover:bg-slate-50 transition border-b border-slate-200">
        {!hiddenColumns.no && (
          <td className="py-3 px-3 text-center border-r border-b border-slate-200 font-mono text-slate-500">{item.globalRowId}</td>
        )}
        {!hiddenColumns.business && (
          <td className="py-3 px-4 text-center border-r border-b border-slate-200 font-bold text-slate-700">{item.bu}</td>
        )}
        {!hiddenColumns.charge && (
          <td className="py-3 px-4 text-left border-r border-b border-slate-200 text-slate-800 font-medium truncate max-w-[240px]" title={item.l07}>{item.l07}</td>
        )}
        {typeColumns.map((type, idx) => {
          if (hiddenColumns[`type_${type}`]) return null;
          const val = item.values[idx];
          return (
            <td key={type} className="py-3 px-4 text-right border-r border-b border-slate-200 font-mono">
              {val === 0 ? "0" : val.toLocaleString('vi-VN')}
            </td>
          );
        })}
        {!hiddenColumns.grandTotal && (
          <td className="py-3 px-4 text-right border-r border-b border-slate-200 font-bold text-primary bg-orange-50/30 font-mono">
            {item.rowTotal === 0 ? "0" : item.rowTotal.toLocaleString('vi-VN')}
          </td>
        )}
      </tr>
    ));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-white rounded-none border border-slate-300 shadow-sm relative z-10">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        id="pivot-upload"
        onChange={handleFileUpload}
      />

      {/* HEADER BAR */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>PHÂN BỔ CHI LƯƠNG (THEO TYPE)</span>
          </div>
          {sourceInfo && (
            <span className="text-[10px] normal-case bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-600" />
              {sourceInfo}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 mr-2">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SỐ TRUNG TÂM</p>
              <p className="text-xl font-bold text-slate-800 leading-none">{totalCenters}</p>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="text-right bg-white border border-slate-200 px-4 py-1.5 rounded-lg">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TỔNG CHI PHÍ (VNĐ)</p>
              <p className="text-lg font-bold text-primary leading-none">{totalSalarySum.toLocaleString('vi-VN')}</p>
            </div>
          </div>

          {/* SETTINGS / ACTION MENU DROPDOWN */}
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 shadow-sm cursor-pointer"
              title="Cài đặt & Tác vụ Pivot"
            >
              <Settings className={`w-4 h-4 text-slate-600 ${isProcessing ? "animate-spin" : ""}`} />
              <span className="text-xs font-semibold"></span>
                </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-slate-700 text-xs font-medium divide-y divide-slate-100">
                {/* Column Visibility Section */}
                <div className="p-3 space-y-2">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Chọn cột hiển thị</span>
                    <button
                      onClick={() => setHiddenColumns({})}
                      className="text-[10px] text-primary hover:underline font-normal"
                    >
                      Hiện tất cả
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.no}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, no: !e.target.checked }))}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>NO.</span>
                    </label>
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.business}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, business: !e.target.checked }))}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>Business</span>
                    </label>
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.charge}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, charge: !e.target.checked }))}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>CHARGE TO CENTER MKT / L07</span>
                    </label>
                    {typeColumns.map(type => (
                      <label key={type} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns[`type_${type}`]}
                          onChange={(e) => setHiddenColumns(prev => ({ ...prev, [`type_${type}`]: !e.target.checked }))}
                          className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="truncate" title={type}>{type}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.grandTotal}
                        onChange={(e) => setHiddenColumns(prev => ({ ...prev, grandTotal: !e.target.checked }))}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>TỔNG CỘNG</span>
                    </label>
                  </div>
                </div>

                {/* Settings Actions Section */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      loadMasterData(true);
                    }}
                    disabled={isProcessing}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-600 ${isProcessing ? "animate-spin" : ""}`} />
                    <div>
                      <div className="font-semibold text-slate-800">Đồng bộ từ Cài đặt Master</div>
                      <div className="text-[10px] text-slate-400 font-normal">Cập nhật dữ liệu từ danh sách file Master đã tải</div>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Xuất Báo Cáo Excel</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tải về file Excel bảng Pivot hiện tại</div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadDiagnosticCSV}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-800">Tải Logs CSV</div>
                      <div className="text-[10px] text-slate-400 font-normal">Xuất dữ liệu log kiểm tra các dòng lỗi</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PIVOT TABLE DISPLAY WITH HORIZONTAL GRIDLINES */}
      <div className="overflow-auto relative flex-1 custom-scrollbar">
        {isPivotSheetVisible && (
          <>
            <table className="w-full text-right text-xs whitespace-nowrap border-separate border-spacing-0">
              <thead className="bg-white text-primary font-bold uppercase text-[11px] border-b-2 border-slate-200 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  {!hiddenColumns.no && (
                    <th className="py-3 px-3 text-center border-r border-b border-slate-200 bg-white min-w-[48px] sticky top-0">NO.</th>
                  )}
                  {!hiddenColumns.business && (
                    <th className="py-3 px-4 text-center border-r border-b border-slate-200 bg-white min-w-[90px] sticky top-0">Business</th>
                  )}
                  {!hiddenColumns.charge && (
                    <th className="py-3 px-4 text-left border-r border-b border-slate-200 bg-white min-w-[200px] sticky top-0">CHARGE TO CENTER MKT / L07</th>
                  )}
                  {typeColumns.map(type => {
                    if (hiddenColumns[`type_${type}`]) return null;
                    return (
                      <th key={type} className="py-3 px-4 text-center border-r border-b border-slate-200 min-w-[100px] bg-white sticky top-0">{type}</th>
                    );
                  })}
                  {!hiddenColumns.grandTotal && (
                    <th className="py-3 px-4 text-center border-r border-b border-slate-200 min-w-[120px] bg-orange-50 text-primary font-bold sticky top-0">TỔNG CỘNG</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-200 text-slate-600 font-medium">
                {renderRows()}
              </tbody>
              <tfoot className="font-bold text-slate-800 bg-slate-100 sticky bottom-0 z-20 shadow-[0_-2px_6px_rgba(0,0,0,0.08)]">
                <tr className="bg-slate-100 border-t-2 border-b border-slate-300">
                  {!hiddenColumns.no && (
                    <td className="py-3 px-3 text-center border-r border-b border-slate-300 bg-slate-100 sticky bottom-0 z-20"></td>
                  )}
                  {!hiddenColumns.business && (
                    <td className="py-3 px-4 text-center border-r border-b border-slate-300 bg-slate-100 sticky bottom-0 z-20"></td>
                  )}
                  {!hiddenColumns.charge && (
                    <td className="py-3 px-4 text-left border-r border-b border-slate-300 bg-slate-100 uppercase tracking-wide font-bold sticky bottom-0 z-20">TỔNG CỘNG</td>
                  )}
                  {grandTotals.map((v, idx) => {
                    const type = typeColumns[idx];
                    if (hiddenColumns[`type_${type}`]) return null;
                    return (
                      <td key={`grand-${idx}`} className="py-3 px-4 text-right border-r border-b border-slate-300 text-primary bg-slate-100 sticky bottom-0 z-20 font-mono">
                        {v === 0 ? "0" : v.toLocaleString('vi-VN')}
                      </td>
                    );
                  })}
                  {!hiddenColumns.grandTotal && (
                    <td className="py-3 px-4 text-right border-r border-b border-slate-300 text-primary font-black bg-orange-100 sticky bottom-0 z-20 font-mono">
                      {superGrandTotal === 0 ? "0" : superGrandTotal.toLocaleString('vi-VN')}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
            
            {/* FOOTER PAGINATION BAR */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Hiển thị <span className="font-semibold text-slate-800">{totalRowsCount === 0 ? 0 : startIndex + 1}</span> - <span className="font-semibold text-slate-800">{endIndex}</span> trong tổng số <span className="font-semibold text-slate-800">{totalRowsCount}</span> dòng</span>
                <span className="text-slate-300">|</span>
                <span>Số trung tâm: <span className="font-semibold text-slate-800">{totalCenters}</span></span>
              </div>
      
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Số dòng / trang:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={10000}>Tất cả</option>
                  </select>
                </div>
      
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Trang {validCurrentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

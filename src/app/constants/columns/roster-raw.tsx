import React from "react";

export const ROSTER_RAW_COLUMNS = [
  { key: "business", label: "Business", type: "text" as const, width: 100 },
  { key: "center", label: "Center/Mã AE", type: "text" as const, width: 120, hidden: true },
  { key: "l07", label: "L07", type: "text" as const, width: 140 },
  { key: "chargeToCenterMkt", label: "Charge to Center MKT", type: "text" as const, width: 160, hidden: true },
  { key: "ma_nv", label: "ID Number", type: "text" as const, width: 120 },
  { key: "full_name", label: "Full Name", type: "text" as const, width: 180 },
  { key: "ngay", label: "Date", type: "date" as const, width: 100 },
  { 
    key: "type", 
    label: "Type", 
    type: "text" as const, 
    width: 120,
    render: (val: string) => {
      if (!val) return null;
      const isMkt = val.startsWith("LPAR") || val.startsWith("LRET") || val.startsWith("LDEM") || val.startsWith("LDEC") || val.startsWith("MOTH");
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${isMkt ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
          {val}
        </span>
      );
    }
  },
  { key: "class", label: "Class", type: "text" as const, width: 140, cellClassName: "font-mono text-[11px] text-slate-500" },
  { key: "gio_vao", label: "From", type: "text" as const, width: 90, cellClassName: "font-medium text-slate-400" },
  { key: "gio_ra", label: "To", type: "text" as const, width: 90, cellClassName: "font-medium text-slate-400" },
  { key: "duration", label: "Duration", type: "number" as const, width: 90, cellClassName: "font-black text-slate-900" },
  { 
    key: "overlap_check", 
    label: "Check Overlap", 
    type: "text" as const, 
    width: 120,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (val: string, row: any) => {
      if (!val) return null;
      let badgeStyle = "bg-slate-50 text-slate-600 border border-slate-200/50";
      let isOverlap = false;
      let displayVal = val;
      if (val.startsWith("Trùng lịch")) {
        badgeStyle = "bg-rose-50 text-rose-600 border border-rose-200/50 cursor-pointer hover:bg-rose-100 hover:scale-105 transition-all";
        isOverlap = true;
        displayVal = "Trùng lịch";
      } else if (val.startsWith("Trùng dòng")) {
        badgeStyle = "bg-amber-50 text-amber-700 border border-amber-200/50 cursor-pointer hover:bg-amber-100 hover:scale-105 transition-all";
        isOverlap = true;
        displayVal = "Trùng dòng";
      } else if (val === "Không trùng") {
        badgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
      }

      const handleClick = (e: React.MouseEvent) => {
        if (isOverlap && row) {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent("overlap-filter-requested", {
            detail: {
              ma_nv: row.ma_nv,
              ngay: row.ngay
            }
          }));
        }
      };

      return (
        <span 
          onClick={handleClick}
          title={isOverlap ? (val + " (Click để lọc xem chi tiết các ca trùng)") : undefined}
          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest inline-block ${badgeStyle}`}
        >
          {displayVal}
        </span>
      );
    }
  },
  {
    key: "check_duration",
    label: "Check Duration",
    type: "text" as const,
    width: 130,
    render: (val: string) => {
      if (!val || val === "OK") return <span className="text-emerald-600 font-bold text-[10px]">OK</span>;
      return <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-100">{val}</span>;
    }
  },
  {
    key: "check_class",
    label: "Check Class",
    type: "text" as const,
    width: 100,
    render: (val: string) => {
      if (val === "TRUE" || val === "OK") return <span className="text-emerald-600 font-bold text-[10px]">TRUE</span>;
      if (val === "FALSE") return <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-100">FALSE</span>;
      return null;
    }
  },
  {
    key: "check_sms",
    label: "Check SMS",
    type: "text" as const,
    width: 110,
    render: (val: string) => {
      if (val === "OK") return <span className="text-emerald-600 font-bold text-[10px]">OK</span>;
      if (val === "Duplicate") return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px] border border-amber-100">DUPLICATE</span>;
      return null;
    }
  },
  {
    key: "check_tutoring",
    label: "Check Tutoring",
    type: "text" as const,
    width: 120,
    render: (val: string) => {
      if (val === "OK") return <span className="text-emerald-600 font-bold text-[10px]">OK</span>;
      if (val === "Duplicate") return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px] border border-amber-100">DUPLICATE</span>;
      return null;
    }
  },
  { 
    key: "loai", 
    label: "Loại", 
    type: "text" as const, 
    width: 80,
    render: (val: string) => {
      if (val === "KL") return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black text-[10px]">KL</span>;
      return <span className="text-slate-400 text-[10px]">{val}</span>;
    }
  },
  { key: "notes", label: "Notes", type: "text" as const, width: 250, cellClassName: "text-slate-800 whitespace-pre-wrap leading-relaxed font-medium" },
];

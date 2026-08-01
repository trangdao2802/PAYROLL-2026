const fs = require('fs');
let content = fs.readFileSync('src/app/pages/04-balance/PivotSheet.tsx', 'utf-8');

const badChunk = `      <input        ref={fileIn      {/* TOP HEADER TOOLBAR */}      <div className="pt-[12px] pb-[12px] px-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#e7dbdc] bg-[#FAF9F6]">        <div className="flex flex-wrap items-center gap-3">          <div className="flex items-center gap-2">            <span className="text-[#781D1D] font-bold text-xs uppercase tracking-wider">• PHÂN BỔ CHI LƯƠNG (PIVOT MASTER)</span>          </div>        </div>                {/* STATS BADGES */}        <div className="flex items-center gap-4">          <div className="text-right">            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SỐ TRUNG TÂM</p>            <p className="text-sm font-bold text-slate-800 font-mono leading-tight">{totalCenters}</p>          </div>          <div className="w-[1px] h-8 bg-[#e7dbdc]"></div>          <div className="text-right">            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">TỔNG CHI PHÍ (VNĐ)</p>            <p className="text-sm font-bold text-[#781D1D] font-mono leading-tight">{Math.round(totalSalarySum).toLocaleString('vi-VN')}</p>          </div>        </div>      </div>I PHÍ (VNĐ)</p>            <p className="text-sm font-bold text-[#781D1D] font-mono leading-tight">{totalSalarySum.toLocaleString('vi-VN')}</p>          </div>        </div>      </div>`;

const goodChunk = `      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        id="pivot-upload"
        onChange={handleFileUpload}
      />

      {/* TOP HEADER TOOLBAR */}
      <div className="pt-[12px] pb-[12px] px-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#e7dbdc] bg-[#FAF9F6]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#781D1D] font-bold text-xs uppercase tracking-wider">• PHÂN BỔ CHI LƯƠNG (PIVOT MASTER)</span>
          </div>
        </div>
        
        {/* STATS BADGES */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SỐ TRUNG TÂM</p>
            <p className="text-sm font-bold text-slate-800 font-mono leading-tight">{totalCenters}</p>
          </div>
          <div className="w-[1px] h-8 bg-[#e7dbdc]"></div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">TỔNG CHI PHÍ (VNĐ)</p>
            <p className="text-sm font-bold text-[#781D1D] font-mono leading-tight">{Math.round(totalSalarySum).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>`;

content = content.replace(badChunk, goodChunk);

// Also replace other toLocaleString('vi-VN') inside PivotSheet to use Math.round
content = content.replace(/\{item\.rowTotal === 0 \? <span className="text-slate-300">0<\/span> : item\.rowTotal\.toLocaleString\('vi-VN'\)\}/g, 
  `{item.rowTotal === 0 ? <span className="text-slate-300">0</span> : Math.round(item.rowTotal).toLocaleString('vi-VN')}`);

content = content.replace(/\{v === 0 \? "0" : v\.toLocaleString\('vi-VN'\)\}/g, 
  `{v === 0 ? "0" : Math.round(v).toLocaleString('vi-VN')}`);

content = content.replace(/\{superGrandTotal === 0 \? "0" : superGrandTotal\.toLocaleString\('vi-VN'\)\}/g, 
  `{superGrandTotal === 0 ? "0" : Math.round(superGrandTotal).toLocaleString('vi-VN')}`);

fs.writeFileSync('src/app/pages/04-balance/PivotSheet.tsx', content);
console.log("Done fixing PivotSheet!");

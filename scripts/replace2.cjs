const fs = require('fs');
let code = fs.readFileSync('src/app/pages/03-master/MasterAE.tsx', 'utf8');

const regex = /  return \([\s\S]*?(?=\{\/\* Sibling 2 of Card: Striped pattern \*\/)/;

const newStart = `  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-transparent">
      <AnimatePresence initial={false}>
        {view === "list" && (
          <motion.div
            key="list-main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="flex-1 flex flex-col min-h-0 gap-4 relative overflow-hidden bg-transparent w-full px-6 pt-2 pb-3"
          >
            {/* Inner Content Area holding Sidebar and Table */}
            <div 
              className={\`flex-1 grid min-h-0 relative overflow-hidden \${
                showSidebar ? "grid-cols-[250px_1fr]" : "grid-cols-1"
              } grid-rows-1 w-full h-full\`}
            >
              {/* Left Panel: Sidebar Controls */}
              {showSidebar && (
                <div 
                  className="w-full shrink-0 flex flex-col h-full select-none animate-in fade-in slide-in-from-left duration-500 bg-white border-r border-[var(--border)]"
                  style={{ paddingBottom: "12px", paddingTop: "12px", paddingLeft: "24px", paddingRight: "24px" }}
                >
                  <div 
                    className="flex flex-col h-full overflow-hidden w-full side-panel p-3"
                    style={{ paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px" }}
                  >
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      {/* Summary indicator on the left, sidebar close button on the right */}
                      <div className="flex flex-col gap-0.5 px-2 py-1 select-none">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Master</span>
                        </div>
                        <div className="mt-1">
                          <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">AE System</p>
                          <p className="text-[11px] font-black text-primary leading-tight">Overview</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowSidebar(false)}
                        className="p-1 hover:bg-slate-100 rounded text-primary hover:text-accent cursor-pointer transition-all border border-transparent hover:border-primary/10 shrink-0"
                        title="Ẩn Panel"
                        type="button"
                      >
                        <EyeOff className="w-4 h-4 text-primary/60" />
                      </button>
                    </div>

                    {/* Scrollable Container for all Sidebar content */}
                    <div 
                      className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 flex flex-col min-h-0 gap-6 w-full"
                      style={{ paddingRight: "0px" }}
                    >
                      {/* Always show Summary */}
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 shrink-0">
                          <div className="flex items-center justify-between mb-4">
                            <span className="section-label" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--accent)", display: "block" }}>[ 01 ] Summary</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center justify-center p-1.5 rounded-full border border-slate-200/80 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] active:translate-y-[1px] transition-all cursor-pointer shadow-sm"
                                  title="Cài đặt & Tiện ích"
                                >
                                  <Settings className="w-3.5 h-3.5 text-[#7A1C1C] hover:rotate-45 transition-transform duration-500 shrink-0" />
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
                                <DropdownMenuItem
                                  onClick={handleRefreshData}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                                  <span>Reload dữ liệu</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={currentData.data.length === 0}
                                  onClick={handleExportExcel}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40"
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Xuất Excel</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setShowClearDialog(true)}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer hover:bg-rose-50 text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  <span>Xóa dữ liệu</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex flex-col gap-[0.5rem] mt-[1.25rem]">
                            <div 
                              className="bg-white border border-[var(--border)] px-[0.8rem] py-[0.5rem] flex flex-col gap-1 rounded-sm"
                              style={{ height: "51.807px", borderWidth: "0px" }}
                            >
                              <span className="text-[0.55rem] uppercase tracking-[0.1em] text-muted-foreground font-bold">Total Records</span>
                              <span className="text-[1.2rem] font-sans font-extrabold text-[foreground]">{appData.Sheet1_AE?.data?.length.toLocaleString('vi-VN') || 0}</span>
                            </div>
                            <div className="bg-[rose] px-[0.8rem] py-[0.5rem] flex flex-col gap-1 rounded-sm">
                              <span className="text-[0.55rem] uppercase tracking-[0.1em] text-[foreground]/60 font-bold font-sans">Holds</span>
                              <span className="text-[1.2rem] font-sans font-extrabold text-[foreground]">{appData.Hold_AE?.data?.length.toLocaleString('vi-VN') || 0}</span>
                            </div>
                          </div>
                      </div>

                      <div className="stat-group" style={{ marginBottom: "0px", height: "44.9786px" }}>
                        <span className="label" style={{ color: "#070e15" }}>Last Update</span>
                        <div className="value" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                          {appData?.MasterAE_lastUpdated
                            ? new Date(appData.MasterAE_lastUpdated).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Chưa cập nhật"}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between shrink-0">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/40 uppercase">FILTERS [01]</span>
                      </div>
                      <div className="flex flex-col gap-4 w-full">
                        {/* Search Term input */}
                        <div className="flex flex-col gap-1 relative">
                          <span 
                            className="font-mono text-[8px] tracking-[0.2em] uppercase text-foreground/50 leading-none"
                            style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '10px' }}
                          >
                            KEYWORD
                          </span>
                          <div className="relative">
                            <input
                              placeholder="Tìm kiếm..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="bg-card rounded-lg pl-8 pr-2.5 py-2 border border-[rgba(61,57,53,0.08)] hover:border-accent focus:border-accent focus:outline-none transition-all w-full text-[11px] font-bold text-foreground"
                            />
                            <Search className="w-3.5 h-3.5 text-foreground/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>
                    </div> {/* Closes scrollable container */}

                    <div className="actions mt-auto pt-4 border-t border-[var(--border)] w-full shrink-0">
                      <button 
                        className="btn-secondary w-full"
                        onClick={() => setSearchTerm("")}
                        style={{ height: "37.0704px", paddingTop: "0px", paddingBottom: "0px" }}
                      >
                        Reset Defaults
                      </button>
                      <button 
                        className="btn-primary w-full"
                        onClick={() => setView("upload")}
                        style={{ height: "37.7759px", paddingTop: "0px", paddingBottom: "0px" }}
                      >
                        Tải lên
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Panel: Content Grid */}
              <div 
                className="flex-1 flex flex-col min-h-0 h-full overflow-hidden relative animate-in fade-in slide-in-from-right duration-500 content-area"
                style={{ paddingTop: "0px", paddingBottom: "0px", borderWidth: "0px" }}
              >
                <div className="table-container flex-1 flex flex-col min-h-0 relative bg-card border border-border rounded-xl shadow-sm overflow-hidden master-ae-table-wrapper">
                  {!showSidebar && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="absolute left-4 bottom-[8px] z-[210] w-[26px] h-[26px] bg-slate-900 hover:bg-black text-white border-none rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Hiện Sidebar"
                    >
                      <span className="text-sm select-none" style={{ marginTop: "-2px" }}>💭</span>
                    </button>
                  )}
            {activeTab === "BulkPayment" && (
              <BulkPayment
                showLeftCard={showLeftCard}
                setShowLeftCard={setShowLeftCard}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
              />
            )}
            {activeTab === "Pivot" && <PivotSheet />}
            {activeTab !== "BulkPayment" && activeTab !== "Pivot" && (
              <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                <div 
                  className="bg-card text-card-foreground soft-card force-light flex-1 flex flex-col min-h-0 relative z-10 w-full overflow-hidden border border-border master-ae-table-wrapper" 
                  style={{ paddingBottom: "0px", paddingTop: "0px", borderRadius: "0px", borderWidth: "0px" }}
                >
`;
code = code.replace(regex, newStart);

// Now fix the closing part.
const endRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<ConfirmDialog/m;
const newEnd = `                </div>
              </div>
            )}
            </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog`;

code = code.replace(endRegex, newEnd);
fs.writeFileSync('src/app/pages/03-master/MasterAE.tsx', code);

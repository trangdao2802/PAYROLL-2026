with open("src/app/pages/04-balance/BulkPayment.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "                                      </div>" in line and "                              </div>" in lines[i+1] and "                            )}" in lines[i+2] and "                            {activeBalanceSection === \"III\" && ((" in lines[i+3]:
        # found the broken part
        new_lines.append("                                      </div>\n")
        new_lines.append("                                    </div>\n")
        new_lines.append("                                  ))\n")
        new_lines.append("                                ) : (\n")
        new_lines.append("                                  <span className=\"text-[10px] text-rose-400 italic\">Không có khoản điều chỉnh</span>\n")
        new_lines.append("                                )}\n")
        new_lines.append("                                <div className=\"flex justify-between items-center mt-1 pt-2 border-t border-rose-200/50 font-bold text-rose-950 text-[10px] tracking-wider uppercase\">\n")
        new_lines.append("                                  <span>TOTAL DEDUCTIONS:</span>\n")
        new_lines.append("                                  <span className={`font-black font-mono tracking-tight ${deductionsTotal >= 0 ? \"text-emerald-700\" : \"text-rose-700\"}`}>\n")
        new_lines.append("                                    {deductionsTotal >= 0 ? \"+\" : \"\"}{formatMoneyVND(deductionsTotal).replace(\" ₫\", \"\")}\n")
        new_lines.append("                                  </span>\n")
        new_lines.append("                                </div>\n")
        new_lines.append("                              </div>\n")
        new_lines.append("                            )}\n")
        new_lines.append("                            {activeBalanceSection === \"III\" && (\n")
        skip = True
        continue
    
    if skip:
        if "                            {activeBalanceSection === \"III\" && (" in line:
            skip = False
            # append line if not the one we replaced
        continue
        
    new_lines.append(line)

with open("src/app/pages/04-balance/BulkPayment.tsx", "w") as f:
    f.writelines(new_lines)

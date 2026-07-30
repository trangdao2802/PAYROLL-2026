with open("src/app/pages/04-balance/BulkPayment.tsx", "r") as f:
    content = f.read()

bad_str = """                      const bankExportTotal = (appData.BankExport?.data || [])
                                          return ("""

good_str = """                      const bankExportTotal = (appData.BankExport?.data || [])
                        .reduce((sum, r) => sum + (parseMoneyToNumber(r["Payment Amount"] ?? r["Amount"] ?? r["TOTAL PAYMENT"] ?? r["Số tiền"] ?? r["Thành tiền"] ?? 0) || 0), 0);
                      
                      const totalBulkPayment = bankExportTotal > 0 ? bankExportTotal : (calculationSummary.aeTotal || netPayTotal);
                      const totalAcc = calculationSummary.calculatedTotal || netPayTotal;
                      const bonusTotal = dynamicReportStats?.bonusTotal || 0;
                      const sameMonthHold = dynamicReportStats?.sameMonthHoldTotal || 0;
                      const diffMonthAdd = dynamicReportStats?.diffMonthAddTotal || 0;
                      const totalBankAe = calculationSummary.calculatedTotal - calculationSummary.diff;
                      const diff = totalAcc - totalBulkPayment;

                      return ("""

content = content.replace(bad_str, good_str)
with open("src/app/pages/04-balance/BulkPayment.tsx", "w") as f:
    f.write(content)

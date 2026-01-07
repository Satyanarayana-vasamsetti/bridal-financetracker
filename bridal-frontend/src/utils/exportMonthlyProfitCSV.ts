import { generateMonthlyProfit } from "./monthlyProfit";
import { BridalEvent, Expense } from "@/contexts/DataContext";

export function exportMonthlyProfitCSV(
  events: BridalEvent[],
  expenses: Expense[]
) {
  const rows = generateMonthlyProfit(events, expenses);

  let csv = "Month,Income,Expenses,Profit\n";

  rows.forEach((r) => {
    csv += `${r.month},${r.income},${r.expenses},${r.profit}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "monthly-profit-report.csv";
  a.click();

  URL.revokeObjectURL(url);
}

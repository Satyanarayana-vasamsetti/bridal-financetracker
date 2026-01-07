// src/utils/exportExpensesCSV.ts
import { Expense } from "@/contexts/DataContext";

export function exportExpensesCSV(expenses: Expense[]) {
  if (!expenses.length) {
    alert("No expenses to export");
    return;
  }

  let csv = "Date,Expense Name,Service Type,Amount,Notes\n";

  let total = 0;

  expenses.forEach((e) => {
    total += e.amount;
    csv += `${e.date},${e.expenseName},${e.serviceType},${e.amount},${e.notes ?? ""}\n`;
  });

  // ✅ Summary row
  csv += `,,,Total Expenses,${total}\n`;

  downloadCSV(csv, "expenses.csv");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

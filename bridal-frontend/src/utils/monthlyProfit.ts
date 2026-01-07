import { BridalEvent, Expense } from "@/contexts/DataContext";

export function generateMonthlyProfit(
  events: BridalEvent[],
  expenses: Expense[]
) {
  const map: Record<
    string,
    { income: number; expenses: number }
  > = {};

  events.forEach((e) => {
    const month = e.date.slice(0, 7); // YYYY-MM
    map[month] ??= { income: 0, expenses: 0 };
    map[month].income += e.amount;
  });

  expenses.forEach((e) => {
    const month = e.date.slice(0, 7);
    map[month] ??= { income: 0, expenses: 0 };
    map[month].expenses += e.amount;
  });

  return Object.entries(map).map(([month, v]) => ({
    month,
    income: v.income,
    expenses: v.expenses,
    profit: v.income - v.expenses,
  }));
}

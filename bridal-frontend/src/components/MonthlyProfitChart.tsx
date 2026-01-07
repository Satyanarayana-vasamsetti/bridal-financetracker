// src/components/MonthlyProfitChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BridalEvent, Expense } from "@/contexts/DataContext";

interface Props {
  events: BridalEvent[];
  expenses: Expense[];
}

export default function MonthlyProfitChart({ events, expenses }: Props) {
  const monthlyMap: Record<string, { income: number; expense: number }> = {};

  events.forEach((e) => {
    const month = e.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
    monthlyMap[month].income += e.amount;
  });

  expenses.forEach((e) => {
    const month = e.date.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
    monthlyMap[month].expense += e.amount;
  });

  const data = Object.keys(monthlyMap).map((month) => ({
    month,
    profit: monthlyMap[month].income - monthlyMap[month].expense,
  }));

  if (!data.length) {
    return <p className="text-muted-foreground">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#22c55e"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatDate } from "@/lib/currency";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Receipt,
  Download,
  Heart,
  Sparkles,
} from "lucide-react";

import { ServiceType } from "@/contexts/DataContext";
import { exportEventsCSV } from "@/utils/exportEventsCSV";
import { exportExpensesCSV } from "@/utils/exportExpensesCSV";
import MonthlyProfitChart from "@/components/MonthlyProfitChart";

export default function Dashboard() {
  const {
    totalIncome,
    totalExpenses,
    profit,
    events,
    expenses,
    bridalSummary,
    mehandiSummary,
  } = useData();

  const recentEvents = events.slice(0, 5);
  const recentExpenses = expenses.slice(0, 5);

  const getServiceIcon = (type: ServiceType) =>
    type === "Bridal" ? <Heart className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />;

  const getServiceBadgeClass = (type: ServiceType) =>
    type === "Bridal"
      ? "bg-primary/10 text-primary"
      : "bg-accent/10 text-accent-foreground";

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Bridal & Mehandi Finance Overview
            </p>
          </div>

          {/* EXPORT BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => exportEventsCSV(events)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Events
            </Button>

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => exportExpensesCSV(expenses)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Expenses
            </Button>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Income" value={formatCurrency(totalIncome)} icon={TrendingUp} positive />
          <StatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} />
          <StatCard title="Net Profit" value={formatCurrency(profit)} icon={Wallet} positive={profit >= 0} />
        </div>

        {/* ================= SERVICE SUMMARY ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceCard title="Bridal" summary={bridalSummary} />
          <ServiceCard title="Mehandi" summary={mehandiSummary} />
        </div>

        {/* ================= CHART ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Monthly Profit Report
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <MonthlyProfitChart events={events} expenses={expenses} />
          </CardContent>
        </Card>

        {/* ================= RECENT DATA ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* EVENTS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 text-base">
                <Calendar /> Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col sm:flex-row sm:justify-between gap-2 border-b pb-2"
                >
                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium">{e.clientName}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getServiceBadgeClass(
                          e.serviceType
                        )}`}
                      >
                        {getServiceIcon(e.serviceType)} {e.serviceType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="text-success font-semibold">
                    +{formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* EXPENSES */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 text-base">
                <Receipt /> Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col sm:flex-row sm:justify-between gap-2 border-b pb-2"
                >
                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium">{e.expenseName}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getServiceBadgeClass(
                          e.serviceType
                        )}`}
                      >
                        {getServiceIcon(e.serviceType)} {e.serviceType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="text-destructive font-semibold">
                    -{formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}

/* ================= SMALL COMPONENTS ================= */

function StatCard({ title, value, icon: Icon, positive }: any) {
  return (
    <Card>
      <CardContent className="pt-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p
            className={`text-xl sm:text-2xl font-bold ${
              positive ? "text-success" : "text-destructive"
            }`}
          >
            {value}
          </p>
        </div>
        <Icon className="h-6 w-6 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function ServiceCard({ title, summary }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-center sm:text-left">
        <div>
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="font-bold text-success">
            {formatCurrency(summary.income)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="font-bold text-destructive">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Profit</p>
          <p
            className={`font-bold ${
              summary.profit >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {formatCurrency(summary.profit)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useData, Expense, ServiceType } from "@/contexts/DataContext";
import { formatCurrency, formatDate } from "@/lib/currency";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Pencil, Download } from "lucide-react";
import { toast } from "sonner";

/* ================= CSV EXPORT ================= */

function exportExpensesCSV(
  expenses: Expense[],
  fromDate: string,
  toDate: string,
  serviceFilter: ServiceType | "All"
) {
  let filtered = expenses;

  if (fromDate) filtered = filtered.filter(e => e.date >= fromDate);
  if (toDate) filtered = filtered.filter(e => e.date <= toDate);
  if (serviceFilter !== "All") {
    filtered = filtered.filter(e => e.serviceType === serviceFilter);
  }

  if (filtered.length === 0) {
    toast.error("No data to export");
    return;
  }

  let bridalTotal = 0;
  let mehandiTotal = 0;

  const rows = filtered.map(e => {
    if (e.serviceType === "Bridal") bridalTotal += e.amount;
    if (e.serviceType === "Mehandi") mehandiTotal += e.amount;

    return [
      e.date,
      e.expenseName,
      e.serviceType,
      e.amount,
      e.description || "",
      e.notes || ""
    ];
  });

  rows.push([]);
  rows.push(["SUMMARY"]);
  rows.push(["Bridal Total", "", "", bridalTotal]);
  rows.push(["Mehandi Total", "", "", mehandiTotal]);
  rows.push(["Grand Total", "", "", bridalTotal + mehandiTotal]);

  const csv = [
    ["Date", "Expense", "Service Type", "Amount", "Description", "Notes"],
    ...rows,
  ]
    .map(r => r.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses_export.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= COMPONENT ================= */

export default function Expenses() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    bridalSummary,
    mehandiSummary,
  } = useData();

  /* ---------- ADD FORM ---------- */
  const [date, setDate] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Bridal");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  /* ---------- EDIT ---------- */
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseName, setEditExpenseName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  /* ---------- EXPORT FILTERS ---------- */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportType, setExportType] =
    useState<ServiceType | "All">("All");

  /* ---------- ADD ---------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !expenseName || !amount) {
      toast.error("Fill all required fields");
      return;
    }

    addExpense({
      date,
      expenseName,
      description: description || expenseName,
      serviceType,
      amount: Number(amount),
      notes,
    });

    setDate("");
    setExpenseName("");
    setDescription("");
    setAmount("");
    setNotes("");
  };

  /* ---------- EDIT ---------- */
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseName(expense.expenseName);
    setEditAmount(expense.amount.toString());
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingExpense) return;

    updateExpense(editingExpense.id, {
      date: editingExpense.date,
      expenseName: editExpenseName,
      description: editingExpense.description,
      serviceType: editingExpense.serviceType,
      amount: Number(editAmount),
      notes: editingExpense.notes,
    });

    setEditDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Expenses</h1>
          <div className="flex gap-4">
            <span>Bridal: {formatCurrency(bridalSummary.expenses)}</span>
            <span>Mehandi: {formatCurrency(mehandiSummary.expenses)}</span>
          </div>
        </div>

        {/* EXPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Download /> Export Expenses (CSV)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <Input type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)} />
            <Input type="date" value={toDate}
              onChange={e => setToDate(e.target.value)} />

            <Select value={exportType}
              onValueChange={v => setExportType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Bridal">Bridal</SelectItem>
                <SelectItem value="Mehandi">Mehandi</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() =>
                exportExpensesCSV(expenses, fromDate, toDate, exportType)
              }
            >
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* ADD FORM */}
        <Card>
          <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <Input placeholder="Expense Name"
                value={expenseName}
                onChange={e => setExpenseName(e.target.value)} />

              <Input type="date" value={date}
                onChange={e => setDate(e.target.value)} />

              <Input type="number" placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)} />

              <Select value={serviceType}
                onValueChange={v => setServiceType(v as ServiceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bridal">Bridal</SelectItem>
                  <SelectItem value="Mehandi">Mehandi</SelectItem>
                </SelectContent>
              </Select>

              <Textarea placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)} />

              <Textarea placeholder="Notes"
                value={notes}
                onChange={e => setNotes(e.target.value)} />

              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>

        {/* LIST */}
        <Card>
          <CardContent>
            {expenses.map(e => (
              <div key={e.id} className="flex justify-between py-2 border-b">
                <span>{formatDate(e.date)}</span>
                <span>{e.expenseName}</span>
                <span>{e.serviceType}</span>
                <span className="text-red-600">
                  -{formatCurrency(e.amount)}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(e)}>
                    <Pencil size={16} />
                  </Button>
                  <Button size="sm" onClick={() => deleteExpense(e.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* EDIT */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <Input
              value={editExpenseName}
              onChange={e => setEditExpenseName(e.target.value)}
            />
            <Input
              type="number"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
            />
            <Button onClick={handleEditSubmit}>Save</Button>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}

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
  if (serviceFilter !== "All")
    filtered = filtered.filter(e => e.serviceType === serviceFilter);

  if (!filtered.length) {
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
      e.notes || "",
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
  ].map(r => r.join(",")).join("\n");

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

  /* ---------- ADD ---------- */
  const [date, setDate] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Bridal");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  /* ---------- EDIT ---------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editName, setEditName] = useState("");

  /* ---------- EXPORT ---------- */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportType, setExportType] = useState<ServiceType | "All">("All");

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

  const handleEdit = (e: Expense) => {
    setEditing(e);
    setEditName(e.expenseName);
    setEditAmount(e.amount.toString());
    setEditOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editing) return;

    updateExpense(editing.id, {
      ...editing,
      expenseName: editName,
      amount: Number(editAmount),
    });

    setEditOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Expenses</h1>
          <div className="text-sm flex gap-4">
            <span>Bridal: {formatCurrency(bridalSummary.expenses)}</span>
            <span>Mehandi: {formatCurrency(mehandiSummary.expenses)}</span>
          </div>
        </div>

        {/* EXPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Download /> Export Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            <Select value={exportType} onValueChange={v => setExportType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Bridal">Bridal</SelectItem>
                <SelectItem value="Mehandi">Mehandi</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => exportExpensesCSV(expenses, fromDate, toDate, exportType)}>
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* ADD */}
        <Card>
          <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={handleSubmit}>
              <Input placeholder="Expense Name" value={expenseName} onChange={e => setExpenseName(e.target.value)} />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <Select value={serviceType} onValueChange={v => setServiceType(v as ServiceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bridal">Bridal</SelectItem>
                  <SelectItem value="Mehandi">Mehandi</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <Textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
              <Button type="submit" className="sm:col-span-2 lg:col-span-3">
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* LIST */}
        <Card>
          <CardContent className="space-y-3">
            {expenses.map(e => (
              <div
                key={e.id}
                className="border rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{e.expenseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.date)} • {e.serviceType}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-destructive">
                    -{formatCurrency(e.amount)}
                  </span>
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
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <Input value={editName} onChange={e => setEditName(e.target.value)} />
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

import { useState } from "react";
import { useData, BridalEvent, ServiceType } from "@/contexts/DataContext";
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

function exportEventsCSV(
  events: BridalEvent[],
  fromDate: string,
  toDate: string,
  serviceFilter: ServiceType | "All"
) {
  let filtered = events;

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

    return [e.date, e.clientName, e.eventName, e.serviceType, e.amount, e.notes || ""];
  });

  rows.push([]);
  rows.push(["SUMMARY"]);
  rows.push(["Bridal Total", "", "", "", bridalTotal]);
  rows.push(["Mehandi Total", "", "", "", mehandiTotal]);
  rows.push(["Grand Total", "", "", "", bridalTotal + mehandiTotal]);

  const csv = [
    ["Date", "Client", "Event", "Service Type", "Amount", "Notes"],
    ...rows,
  ].map(r => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "events_export.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= COMPONENT ================= */

export default function Events() {
  const { events, addEvent, updateEvent, deleteEvent, bridalSummary, mehandiSummary } =
    useData();

  /* ---------- ADD ---------- */
  const [date, setDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [eventName, setEventName] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Bridal");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  /* ---------- EDIT ---------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<BridalEvent | null>(null);
  const [editAmount, setEditAmount] = useState("");

  /* ---------- EXPORT ---------- */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportType, setExportType] = useState<ServiceType | "All">("All");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !clientName || !eventName || !amount) {
      toast.error("Fill all required fields");
      return;
    }

    addEvent({
      date,
      clientName,
      eventName,
      serviceType,
      amount: Number(amount),
      notes,
    });

    setDate("");
    setClientName("");
    setEventName("");
    setAmount("");
    setNotes("");
  };

  const handleEdit = (e: BridalEvent) => {
    setEditing(e);
    setEditAmount(e.amount.toString());
    setEditOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editing) return;
    updateEvent(editing.id, {
      ...editing,
      amount: Number(editAmount),
    });
    setEditOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
          <div className="text-sm flex gap-4">
            <span>Bridal: {formatCurrency(bridalSummary.income)}</span>
            <span>Mehandi: {formatCurrency(mehandiSummary.income)}</span>
          </div>
        </div>

        {/* EXPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Download /> Export Events
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
            <Button onClick={() => exportEventsCSV(events, fromDate, toDate, exportType)}>
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* ADD */}
        <Card>
          <CardHeader><CardTitle>Add Event</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input placeholder="Client" value={clientName} onChange={e => setClientName(e.target.value)} />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Input placeholder="Event" value={eventName} onChange={e => setEventName(e.target.value)} />
              <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <Select value={serviceType} onValueChange={v => setServiceType(v as ServiceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bridal">Bridal</SelectItem>
                  <SelectItem value="Mehandi">Mehandi</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
              <Button type="submit" className="sm:col-span-2 lg:col-span-3">Add Event</Button>
            </form>
          </CardContent>
        </Card>

        {/* LIST */}
        <Card>
          <CardContent className="space-y-3">
            {events.map(e => (
              <div
                key={e.id}
                className="border rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{e.clientName} – {e.eventName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.date)} • {e.serviceType}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(e.amount)}</span>
                  <Button size="sm" onClick={() => handleEdit(e)}><Pencil size={16} /></Button>
                  <Button size="sm" onClick={() => deleteEvent(e.id)}><Trash2 size={16} /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* EDIT */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Amount</DialogTitle></DialogHeader>
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

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

  if (fromDate) {
    filtered = filtered.filter(e => e.date >= fromDate);
  }
  if (toDate) {
    filtered = filtered.filter(e => e.date <= toDate);
  }
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
      e.clientName,
      e.eventName,
      e.serviceType,
      e.amount,
      e.notes || ""
    ];
  });

  rows.push([]);
  rows.push(["SUMMARY"]);
  rows.push(["Bridal Total", "", "", "", bridalTotal]);
  rows.push(["Mehandi Total", "", "", "", mehandiTotal]);
  rows.push(["Grand Total", "", "", "", bridalTotal + mehandiTotal]);

  const csv = [
    ["Date", "Client", "Event", "Service Type", "Amount", "Notes"],
    ...rows,
  ]
    .map(r => r.join(","))
    .join("\n");

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
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    bridalSummary,
    mehandiSummary,
  } = useData();

  /* ---------- ADD FORM ---------- */
  const [date, setDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [eventName, setEventName] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Bridal");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  /* ---------- EDIT ---------- */
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BridalEvent | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editEventName, setEditEventName] = useState("");
  const [editServiceType, setEditServiceType] =
    useState<ServiceType>("Bridal");
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");

  /* ---------- EXPORT FILTERS ---------- */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportType, setExportType] =
    useState<ServiceType | "All">("All");

  /* ---------- ADD EVENT ---------- */
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

  /* ---------- EDIT ---------- */
  const handleEdit = (event: BridalEvent) => {
    setEditingEvent(event);
    setEditDate(event.date);
    setEditClientName(event.clientName);
    setEditEventName(event.eventName);
    setEditServiceType(event.serviceType);
    setEditAmount(event.amount.toString());
    setEditNotes(event.notes || "");
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingEvent) return;

    updateEvent(editingEvent.id, {
      date: editDate,
      clientName: editClientName,
      eventName: editEventName,
      serviceType: editServiceType,
      amount: Number(editAmount),
      notes: editNotes,
    });

    setEditDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Events</h1>
          <div className="flex gap-4">
            <span>Bridal: {formatCurrency(bridalSummary.income)}</span>
            <span>Mehandi: {formatCurrency(mehandiSummary.income)}</span>
          </div>
        </div>

        {/* EXPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Download /> Export Events (CSV)
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
                exportEventsCSV(events, fromDate, toDate, exportType)
              }
            >
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* ADD FORM */}
        <Card>
          <CardHeader><CardTitle>Add Event</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <Input placeholder="Client" value={clientName}
                onChange={e => setClientName(e.target.value)} />
              <Input type="date" value={date}
                onChange={e => setDate(e.target.value)} />
              <Input placeholder="Event" value={eventName}
                onChange={e => setEventName(e.target.value)} />
              <Input type="number" placeholder="Amount" value={amount}
                onChange={e => setAmount(e.target.value)} />

              <Select value={serviceType}
                onValueChange={v => setServiceType(v as ServiceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bridal">Bridal</SelectItem>
                  <SelectItem value="Mehandi">Mehandi</SelectItem>
                </SelectContent>
              </Select>

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
            {events.map(e => (
              <div key={e.id} className="flex justify-between py-2 border-b">
                <span>{formatDate(e.date)}</span>
                <span>{e.clientName}</span>
                <span>{e.eventName}</span>
                <span>{e.serviceType}</span>
                <span>{formatCurrency(e.amount)}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(e)}>
                    <Pencil size={16} />
                  </Button>
                  <Button size="sm" onClick={() => deleteEvent(e.id)}>
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
            <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
            <Input value={editClientName}
              onChange={e => setEditClientName(e.target.value)} />
            <Input value={editEventName}
              onChange={e => setEditEventName(e.target.value)} />
            <Input type="number" value={editAmount}
              onChange={e => setEditAmount(e.target.value)} />
            <Button onClick={handleEditSubmit}>Save</Button>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}

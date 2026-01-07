// src/utils/exportEventsCSV.ts
import { BridalEvent } from "@/contexts/DataContext";

export function exportEventsCSV(events: BridalEvent[]) {
  if (!events.length) {
    alert("No events to export");
    return;
  }

  let csv = "Date,Client Name,Event Name,Service Type,Amount,Notes\n";

  let total = 0;

  events.forEach((e) => {
    total += e.amount;
    csv += `${e.date},${e.clientName},${e.eventName},${e.serviceType},${e.amount},${e.notes ?? ""}\n`;
  });

  // ✅ Summary row
  csv += `,,,,Total Income,${total}\n`;

  downloadCSV(csv, "events.csv");
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

// src/utils/exportCsv.ts

type ServiceType = "Bridal" | "Mehandi";

interface ExportOptions<T> {
  data: T[];
  fileName: string;
  fromDate?: string;
  toDate?: string;
  serviceType?: ServiceType | "All";
  getAmount: (item: T) => number;
  getServiceType: (item: T) => ServiceType;
  mapRow: (item: T) => (string | number)[];
  headers: string[];
}

export function exportToCSV<T>({
  data,
  fileName,
  fromDate,
  toDate,
  serviceType = "All",
  getAmount,
  getServiceType,
  mapRow,
  headers,
}: ExportOptions<T>) {
  let filtered = [...data];

  /* 🔹 Date range filter */
  if (fromDate) {
    filtered = filtered.filter(
      (d: any) => new Date(d.date) >= new Date(fromDate)
    );
  }

  if (toDate) {
    filtered = filtered.filter(
      (d: any) => new Date(d.date) <= new Date(toDate)
    );
  }

  /* 🔹 Service filter */
  if (serviceType !== "All") {
    filtered = filtered.filter(
      (d) => getServiceType(d) === serviceType
    );
  }

  /* 🔹 Calculate summary */
  const totalAmount = filtered.reduce(
    (sum, d) => sum + getAmount(d),
    0
  );

  /* 🔹 Build CSV */
  const rows: (string | number)[][] = [
    headers,
    ...filtered.map(mapRow),
    [],
    ["TOTAL", "", "", "", totalAmount], // summary row
  ];

  const csvContent = rows
    .map((row) => row.join(","))
    .join("\n");

  /* 🔹 Download */
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

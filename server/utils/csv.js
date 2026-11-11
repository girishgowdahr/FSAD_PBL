export function sanitizeCell(val) {
  if (val === null || val === undefined) {
    return '""';
  }

  let str;
  if (val instanceof Date) {
    str = val.toISOString();
  } else {
    str = String(val);
  }

  // Formula / CSV injection protection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Double internal quotes and wrap in quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function formatCsv(columns, rows) {
  const headerLabels = columns.map((col) => (typeof col === "object" ? col.label : col));
  const headerKeys = columns.map((col) => (typeof col === "object" ? col.key : col));

  const headerLine = headerLabels.map(sanitizeCell).join(",");
  const dataLines = rows.map((row) =>
    headerKeys.map((key) => sanitizeCell(row[key])).join(",")
  );

  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

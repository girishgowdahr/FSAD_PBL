export function extractFilename(contentDisposition, defaultFilename) {
  if (!contentDisposition) return defaultFilename;
  const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
  if (match && match[1]) {
    return match[1].replace(/['"]/g, "").trim();
  }
  return defaultFilename;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

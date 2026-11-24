/** Downloads a table as a real Excel (.xlsx) file. The Excel library is loaded only when someone downloads. */
export async function downloadXlsx(fileName: string, sheet: string, headers: string[], rows: (string | number | null | undefined)[][], widths?: number[]): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const head = headers.map(h => ({ value: h, fontWeight: 'bold' as const, backgroundColor: '#e8eef9' }));
  const body = rows.map(r => r.map(v => (typeof v === 'number' ? { value: v, type: Number } : { value: v == null ? '' : String(v), type: String })));
  const columns = headers.map((h, i) => ({ width: widths?.[i] ?? Math.max(12, Math.min(34, h.length + 6)) }));
  await writeXlsxFile([head, ...body] as any, { columns, sheet } as any).toFile(fileName.endsWith('.xlsx') ? fileName : fileName + '.xlsx');
}

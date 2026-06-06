export type ExportFormat = 'csv' | 'xlsx';

export interface ExportColumn<Row> {
  header: string;
  value: (row: Row) => string | number | boolean | null | undefined;
}

function csvEscape(value: string | number | boolean | null | undefined) {
  const text = value == null ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTableExport<Row>(args: {
  format: ExportFormat;
  filename: string;
  sheetName: string;
  columns: ExportColumn<Row>[];
  rows: Row[];
}) {
  const { format, filename, sheetName, columns, rows } = args;

  if (format === 'csv') {
    const header = columns.map((column) => csvEscape(column.header)).join(',');
    const lines = rows.map((row) => columns.map((column) => csvEscape(column.value(row))).join(','));
    const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
    return;
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.header,
    width: Math.max(14, column.header.length + 4),
  }));

  rows.forEach((row) => {
    const out: Record<string, string | number | boolean | null | undefined> = {};
    columns.forEach((column) => {
      out[column.header] = column.value(row);
    });
    worksheet.addRow(out);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
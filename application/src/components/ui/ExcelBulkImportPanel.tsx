import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from './UIPrimitives';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  RefreshCw,
  ArrowRight,
  Database,
  FileText,
} from 'lucide-react';

export interface FieldMapping {
  key: string;
  label: string;
  required?: boolean;
  sampleValue?: string;
}

export interface ExcelBulkImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  fields: FieldMapping[];
  sampleTemplateFileName: string;
  sampleData: Record<string, any>[];
  onImport: (rows: Record<string, any>[]) => Promise<{ count: number }>;
  onSuccess: () => void;
}

export const ExcelBulkImportPanel: React.FC<ExcelBulkImportPanelProps> = ({
  isOpen,
  onClose,
  title,
  description,
  fields,
  sampleTemplateFileName,
  sampleData,
  onImport,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-map headers based on similar field names
  const autoMapHeaders = (headers: string[], expectedFields: FieldMapping[]) => {
    const map: Record<string, string> = {};
    expectedFields.forEach((f) => {
      const targetLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetKey = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const matched = headers.find((h) => {
        const cleanHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          cleanHeader === targetLabel ||
          cleanHeader === targetKey ||
          cleanHeader.includes(targetKey) ||
          targetKey.includes(cleanHeader) ||
          cleanHeader.includes('name') && targetKey.includes('name') ||
          cleanHeader.includes('customer') && targetKey.includes('client') ||
          cleanHeader.includes('code') && targetKey.includes('code') ||
          cleanHeader.includes('address') && targetKey.includes('address') ||
          cleanHeader.includes('phone') && targetKey.includes('phone') ||
          cleanHeader.includes('email') && targetKey.includes('email')
        );
      });

      if (matched) {
        map[f.key] = matched;
      }
    });
    return map;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    processFile(uploaded);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    processFile(dropped);
  };

  const processFile = async (f: File) => {
    setFile(f);
    setIsProcessingFile(true);
    setErrorMessage(null);
    setImportSuccessCount(null);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded file has no valid sheets.');
      }

      setSheetNames(workbook.SheetNames);
      const activeSheet = workbook.SheetNames[0];
      setSelectedSheet(activeSheet);

      parseSheetData(workbook, activeSheet);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse the uploaded Excel file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (jsonData.length === 0) {
      setErrorMessage('The selected sheet has no data rows.');
      setRawRows([]);
      setExcelHeaders([]);
      return;
    }

    const headers = Object.keys(jsonData[0] || {});
    setRawRows(jsonData);
    setExcelHeaders(headers);

    const initialMap = autoMapHeaders(headers, fields);
    setColumnMap(initialMap);
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!file) return;
    setSelectedSheet(sheetName);
    setIsProcessingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      parseSheetData(workbook, sheetName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch sheet.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleMappingChange = (fieldKey: string, headerValue: string) => {
    setColumnMap((prev) => ({
      ...prev,
      [fieldKey]: headerValue,
    }));
  };

  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Data');
    XLSX.writeFile(wb, sampleTemplateFileName);
  };

  const resetForm = () => {
    setFile(null);
    setRawRows([]);
    setExcelHeaders([]);
    setColumnMap({});
    setImportSuccessCount(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeImport = async () => {
    // Validate required fields are mapped
    const missingRequired = fields
      .filter((f) => f.required && !columnMap[f.key])
      .map((f) => f.label);

    if (missingRequired.length > 0) {
      setErrorMessage(`Please map required field(s): ${missingRequired.join(', ')}`);
      return;
    }

    // Build normalized rows
    const preparedRows = rawRows
      .map((row) => {
        const item: Record<string, any> = {};
        fields.forEach((f) => {
          const mappedHeader = columnMap[f.key];
          item[f.key] = mappedHeader ? row[mappedHeader] : undefined;
        });
        return item;
      })
      .filter((item) => {
        // filter out rows where mandatory fields are empty
        const primaryRequired = fields.find((f) => f.required);
        if (primaryRequired) {
          const val = item[primaryRequired.key];
          return val !== undefined && val !== null && String(val).trim() !== '';
        }
        return true;
      });

    if (preparedRows.length === 0) {
      setErrorMessage('No valid rows found to import based on current column mapping.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setImportProgress(20);

    try {
      setImportProgress(50);
      const res = await onImport(preparedRows);
      setImportProgress(100);
      setImportSuccessCount(res.count);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Preview computed rows
  const previewRows = rawRows.slice(0, 5).map((row) => {
    const preview: Record<string, any> = {};
    fields.forEach((f) => {
      const mappedHeader = columnMap[f.key];
      preview[f.key] = mappedHeader ? row[mappedHeader] : '-';
    });
    return preview;
  });

  return (
    <Card className="border-2 border-[#0274BB]/30 bg-white shadow-md overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-[#F0F9FF] to-white border-b border-[#BAE6FD]/40 py-4 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-[#0274BB] flex items-center justify-center text-white shadow-sm">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                Batch Excel / CSV
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              {description}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSample}
            className="text-xs flex items-center gap-1.5 border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            title="Download formatted sample template"
          >
            <Download className="size-3.5 text-[#0274BB]" /> Download Template
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#334155] hover:bg-[#F1F5F9] rounded-md transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-lg text-sm flex items-start gap-3">
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Success Confirmation */}
        {importSuccessCount !== null && (
          <div className="p-5 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] rounded-lg text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-[#16A34A]" />
              <div>
                <p className="font-bold text-base">Bulk Import Successfully Completed!</p>
                <p className="text-xs text-[#15803D] mt-0.5">
                  {importSuccessCount} records were inserted and linked to your active tenant.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={resetForm}
                className="text-xs"
              >
                Import More Records
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Upload Zone if no file loaded */}
        {importSuccessCount === null && !file && (
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0274BB] rounded-xl p-8 text-center cursor-pointer transition-all bg-[#F8FAFC] hover:bg-[#F0F9FF] group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="size-14 mx-auto mb-3 rounded-full bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center text-[#0274BB] group-hover:scale-105 transition-transform">
              <UploadCloud className="size-7" />
            </div>
            <h4 className="text-sm font-semibold text-[#1E293B]">
              Click to browse or drag and drop your spreadsheet here
            </h4>
            <p className="text-xs text-[#64748B] mt-1">
              Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
            </p>
          </div>
        )}

        {/* Step 2: Mapping & Preview if file loaded */}
        {importSuccessCount === null && file && (
          <div className="space-y-6">
            {/* File info bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#334155] gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-[#0274BB]" />
                <span className="font-semibold text-[#0F172A]">{file.name}</span>
                <span className="text-[#94A3B8]">({(file.size / 1024).toFixed(1)} KB)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] font-semibold text-[#475569]">
                  {rawRows.length} Rows Detected
                </span>
              </div>

              <div className="flex items-center gap-3">
                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#64748B]">Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-2 py-1 text-xs bg-white text-[#1E293B]"
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="text-xs h-7 text-[#EF4444] hover:bg-[#FEF2F2] border-[#FCA5A5]"
                >
                  <RefreshCw className="size-3 mr-1" /> Replace File
                </Button>
              </div>
            </div>

            {/* Column Mapping Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                  <Database className="size-3.5 text-[#0274BB]" /> Column Mapping Configuration
                </h4>
                <span className="text-[11px] text-[#64748B]">
                  Match your Excel columns with system fields
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fields.map((field) => {
                  const currentMapped = columnMap[field.key] || '';
                  const isMapped = Boolean(currentMapped);
                  return (
                    <div
                      key={field.key}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isMapped
                          ? 'border-[#BAE6FD] bg-[#F0F9FF]'
                          : field.required
                          ? 'border-[#FCA5A5] bg-[#FEF2F2]'
                          : 'border-[#E2E8F0] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[#0F172A] flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-[#DC2626] font-bold">*</span>}
                        </span>
                        {isMapped ? (
                          <span className="text-[10px] text-[#0284C7] font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="size-3" /> Mapped
                          </span>
                        ) : field.required ? (
                          <span className="text-[10px] text-[#DC2626] font-semibold">Required</span>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8]">Optional</span>
                        )}
                      </div>

                      <select
                        value={currentMapped}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs bg-white text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0274BB]"
                      >
                        <option value="">-- Do Not Import --</option>
                        {excelHeaders.map((header) => (
                          <option key={header} value={header}>
                            Excel Column: "{header}"
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Data Preview (First 5 of {rawRows.length} Rows)
                </h4>
              </div>

              <div className="border border-[#E2E8F0] rounded-lg overflow-x-auto max-h-60 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                    <tr>
                      <th className="p-2.5 font-semibold w-12 text-center">#</th>
                      {fields.map((f) => (
                        <th key={f.key} className="p-2.5 font-semibold">
                          {f.label}
                          {f.required && <span className="text-[#DC2626] ml-0.5">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[#1E293B]">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]">
                        <td className="p-2.5 text-center text-[#94A3B8] font-mono">{idx + 1}</td>
                        {fields.map((f) => (
                          <td key={f.key} className="p-2.5 truncate max-w-[200px]" title={String(row[f.key] || '')}>
                            {row[f.key] || <span className="text-[#CBD5E1] italic">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progress Bar */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#0274BB] font-semibold">
                  <span>Importing records to database...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0274BB] h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer Actions */}
      {importSuccessCount === null && (
        <CardFooter className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-3 px-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isImporting}
            className="text-xs"
          >
            Cancel
          </Button>

          {file && (
            <Button
              variant="primary"
              size="sm"
              onClick={executeImport}
              disabled={isImporting || isProcessingFile || rawRows.length === 0}
              className="text-xs flex items-center gap-2 bg-[#0274BB] hover:bg-[#02629E]"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" /> Importing {rawRows.length} Records...
                </>
              ) : (
                <>
                  <ArrowRight className="size-3.5" /> Execute Bulk Import ({rawRows.length} rows)
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

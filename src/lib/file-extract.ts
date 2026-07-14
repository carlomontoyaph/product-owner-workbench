import mammoth from "mammoth";
import * as XLSX from "xlsx";

export async function extractTextFromFile(
  fileName: string,
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; error?: string }> {
  const ext = (fileName.split(".").pop() || "").toLowerCase();

  try {
    switch (ext) {
      case "docx":
        return await extractDocx(arrayBuffer);
      case "xlsx":
        return await extractXlsx(arrayBuffer);
      case "txt":
      case "md":
      case "csv":
        return { text: new TextDecoder().decode(arrayBuffer) };
      case "pdf":
        return {
          text: "",
          error: "PDF support is coming soon. Please provide a text document (.txt, .md, .csv, .docx, .xlsx).",
        };
      case "png":
      case "jpg":
      case "jpeg":
        return {
          text: "",
          error: "Image files are not supported for text extraction. Please provide a text document (.txt, .md, .csv, .docx, .xlsx).",
        };
      default:
        return {
          text: "",
          error: `File type .${ext} is not recognized. Supported: txt, md, csv, docx, xlsx (pdf coming soon).`,
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: "",
      error: `Failed to extract text from ${ext}: ${msg}`,
    };
  }
}

async function extractDocx(buffer: ArrayBuffer): Promise<{ text: string }> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return { text: result.value || "" };
}

async function extractXlsx(buffer: ArrayBuffer): Promise<{ text: string }> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    if (csv.trim()) {
      sheets.push(`[Sheet: ${sheetName}]\n${csv}`);
    }
  });

  return { text: sheets.join("\n") };
}

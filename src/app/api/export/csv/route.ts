import { NextRequest, NextResponse } from "next/server";
import { generateCsv, type CsvExportInput } from "@/lib/csv-export";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CsvExportInput;
    const { csv, filename } = generateCsv(body);
    return NextResponse.json({ csv, filename });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

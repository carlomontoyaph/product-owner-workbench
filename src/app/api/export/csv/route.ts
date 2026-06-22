import { NextRequest, NextResponse } from "next/server";
import { generateCsv } from "@/lib/csv-export";
import type { EpicData, UserStoryData, AcData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csv, filename } = generateCsv({
      epic: body.epic as EpicData,
      stories: body.stories as UserStoryData,
      ac: body.ac as AcData,
    });
    return NextResponse.json({ csv, filename });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

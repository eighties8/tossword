import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Row = { date: string; root: string; mystery: string };

const FILE = path.join(process.cwd(), "data", "puzzles-2025.json");

function todayEasternISO(): string {
  const nowET = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  return nowET.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = url.searchParams.get("date"); // optional, for future diagnostics
  const today = todayEasternISO();
  const date = requested ?? today;

  // Hard gate to prevent scraping future answers
  if (date !== today) {
    return NextResponse.json({ error: "Unavailable for this date." }, { status: 403 });
  }

  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const rows: Row[] = JSON.parse(raw);
    const row = rows.find(r => r.date === date);

    if (!row) {
      return NextResponse.json({ error: "No puzzle for date." }, { status: 404 });
    }

    return new NextResponse(JSON.stringify(row), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to read puzzle data:", error);
    return NextResponse.json({ error: "Failed to load puzzle data." }, { status: 500 });
  }
}

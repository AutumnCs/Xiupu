import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  if (extension === "docx") {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      text = (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  } else {
    return NextResponse.json({ ok: false, error: "unsupported_file" }, { status: 415 });
  }
  return NextResponse.json({ ok: true, name: file.name, text: text.trim() });
}

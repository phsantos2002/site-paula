import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSupabase, UPLOAD_BUCKET } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Nenhum arquivo." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const safe = (file.name || "imagem").replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}-${safe}`;

    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.storage.from(UPLOAD_BUCKET).upload(name, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(name);
      return NextResponse.json({ ok: true, path: data.publicUrl });
    }

    // fallback local
    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), bytes);
    return NextResponse.json({ ok: true, path: `/uploads/${name}` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Falha no upload." }, { status: 500 });
  }
}

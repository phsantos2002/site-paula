import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSupabase, UPLOAD_BUCKET } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const MIME_BY_EXT = {
  dng: "image/x-adobe-dng", heic: "image/heic", heif: "image/heif",
  tif: "image/tiff", tiff: "image/tiff", webp: "image/webp", avif: "image/avif",
  cr2: "image/x-canon-cr2", cr3: "image/x-canon-cr3", nef: "image/x-nikon-nef",
  arw: "image/x-sony-arw", raf: "image/x-fuji-raf", rw2: "image/x-panasonic-rw2",
  orf: "image/x-olympus-orf", raw: "image/x-dcraw",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
};

function guessType(file) {
  if (file.type) return file.type;
  const ext = (file.name || "").split(".").pop()?.toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

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
    let bytes = Buffer.from(await file.arrayBuffer());
    let fileName = file.name || "imagem";
    let contentType = guessType(file);

    // HEIC/HEIF (foto de iPhone): converte para JPG no servidor — navegadores não exibem
    // HEIC, então nunca guardamos nesse formato. (O painel tenta converter antes; isto é a
    // garantia para qualquer navegador.)
    const isHeic = /image\/hei[cf]/i.test(contentType) || /\.hei[cf]$/i.test(fileName);
    if (isHeic) {
      try {
        const mod = await import("heic-convert");
        const convert = mod.default || mod;
        const out = await convert({ buffer: bytes, format: "JPEG", quality: 0.88 });
        bytes = Buffer.from(out);
        fileName = fileName.replace(/\.\w+$/, "") + ".jpg";
        contentType = "image/jpeg";
      } catch {
        return NextResponse.json(
          { ok: false, error: "Não foi possível converter a foto HEIC. Envie em JPG ou PNG." },
          { status: 400 }
        );
      }
    }

    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}-${safe}`;

    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.storage.from(UPLOAD_BUCKET).upload(name, bytes, {
        contentType,
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
    return NextResponse.json({ ok: false, error: e?.message || "Falha no upload." }, { status: 500 });
  }
}

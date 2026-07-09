import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

// CRC32 (necessário no formato ZIP).
function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}

// ZIP sem compressão (STORE) — fotos já vêm comprimidas (jpg/png), então não perde nada
// e não precisa de dependência externa.
function buildZip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf8");
    const crc = crc32(f.data);
    const size = f.data.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // método 0 = STORE
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, nameBuf, f.data);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(size, 20);
    cd.writeUInt32LE(size, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += local.length + nameBuf.length + f.data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, centralBuf, end]);
}

function slug(s) {
  return String(s || "imovel").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 40) || "imovel";
}

export async function POST(req) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  try {
    const { images = [], name = "imovel" } = await req.json();
    const base = siteUrl();
    const safe = slug(name);
    const files = [];
    let idx = 0;
    for (const src of Array.isArray(images) ? images : []) {
      idx++;
      if (!src) continue;
      const url = /^https?:\/\//i.test(src) ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
      let res;
      try { res = await fetch(url); } catch { continue; }
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length) continue;
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
      files.push({ name: `${safe}-${String(idx).padStart(2, "0")}.${ext}`, data: buf });
    }
    if (!files.length) {
      return NextResponse.json({ ok: false, error: "Nenhuma foto acessível para baixar." }, { status: 400 });
    }
    const zip = buildZip(files);
    // Stream em pedaços (evita limite de payload de função serverless).
    const CHUNK = 512 * 1024;
    const stream = new ReadableStream({
      start(controller) {
        for (let i = 0; i < zip.length; i += CHUNK) {
          controller.enqueue(new Uint8Array(zip.subarray(i, i + CHUNK)));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safe}-fotos.zip"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Falha ao gerar o ZIP." }, { status: 500 });
  }
}

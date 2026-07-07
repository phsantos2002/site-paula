import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getProperties, migrateStatuses, saveProperties } from "@/lib/properties";

export const runtime = "nodejs";

/** Migração única (idempotente): extrai status dos títulos e regrava. Protegida por sessão. */
export async function POST() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  try {
    const current = await getProperties();
    const { list, changed } = migrateStatuses(current);
    const properties = await saveProperties(list);
    return NextResponse.json({ ok: true, changed, total: properties.length, properties });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha na migração." }, { status: 500 });
  }
}

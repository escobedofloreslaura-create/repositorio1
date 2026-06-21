import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cerrarSesion } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("crm_session")?.value;
    if (token) await cerrarSesion(token);
    const res = NextResponse.json({ ok: true, data: null });
    res.cookies.delete("crm_session");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al cerrar sesión" }, { status: 500 });
  }
}

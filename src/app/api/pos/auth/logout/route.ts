import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cerrarSesionPos, POS_COOKIE } from "@/lib/pos/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(POS_COOKIE)?.value;
    if (token) await cerrarSesionPos(token);
    const res = NextResponse.json({ ok: true, data: null });
    res.cookies.delete(POS_COOKIE);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al cerrar sesión" }, { status: 500 });
  }
}

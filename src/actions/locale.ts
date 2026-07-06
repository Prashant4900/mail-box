"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "NEXT_LOCALE";

export async function setUserLocale(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale);
}

export async function getUserLocale() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || "en";
}

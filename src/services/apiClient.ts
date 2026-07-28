import { auth } from "../lib/firebaseClient";
import { getIdToken, signOut } from "firebase/auth";

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Sesi tidak valid atau pengguna belum masuk.");
  }

  let token = await getIdToken(user);

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    try {
      token = await getIdToken(user, true);
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        await signOut(auth).catch(() => {});
        throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.");
      }
    } catch (err: any) {
      if (err.message && err.message.includes("Silakan masuk kembali")) {
        throw err;
      }
      await signOut(auth).catch(() => {});
      throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.");
    }
  }

  return response;
}

import { appConfig } from "@/config";

const REQUEST_PATH = "/api/v1/public/account-deletion";
const CONFIRM_PATH = "/api/v1/public/account-deletion/confirm";

async function postJson(path: string, body: Record<string, string>): Promise<void> {
  const url = `${appConfig.urls.api}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Client-Source": "landing",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

/** Queue deletion + send confirmation email. Body: { email } */
export async function requestAccountDeletion(email: string): Promise<void> {
  await postJson(REQUEST_PATH, { email: email.trim() });
}

/** Confirm after email link. Body: { email, token } */
export async function confirmAccountDeletion(email: string, token: string): Promise<void> {
  await postJson(CONFIRM_PATH, { email: email.trim(), token: token.trim() });
}

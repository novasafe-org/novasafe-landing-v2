import { appConfig, runtime } from "@/config";

export type ContactCategory =
  | "General Question"
  | "Technical Support"
  | "Security Issue"
  | "Partnership"
  | "Feature Request"
  | "Other";

export type ContactFormPayload = {
  name: string;
  email: string;
  category: ContactCategory;
  message: string;
};

const CONTACT_ENDPOINT = "/v1/public/contact";

export async function submitContactForm(payload: ContactFormPayload): Promise<void> {
  const url = `${appConfig.urls.api}${CONTACT_ENDPOINT}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) return;
  } catch {
    // Endpoint may not exist yet — fall through to dev simulation below.
  }

  if (runtime.isDevelopment) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return;
  }

  throw new Error("submit_failed");
}

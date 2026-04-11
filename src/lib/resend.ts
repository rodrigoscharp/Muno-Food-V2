import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  }
  return _resend;
}

// Keep backwards compat for any existing usage
export const resend = { emails: { send: (...args: Parameters<Resend["emails"]["send"]>) => getResend().emails.send(...args) } };

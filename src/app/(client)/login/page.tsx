import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return <LoginForm googleEnabled={googleEnabled} />;
}

import Link from "next/link"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl font-bold text-amber-900">conneczen</span>
        </Link>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-amber-700">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-amber-900">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy-policy" className="underline hover:text-amber-900">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}

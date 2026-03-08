"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
      <div className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <h1>Sign In</h1>
        <p className="muted">Access your HomeBase account and connected LMS services.</p>

        {process.env.NEXT_PUBLIC_BYU_SSO_ENABLED === "true" ? (
          <button type="button" onClick={() => signIn("byu", { callbackUrl: "/" })}>
            Sign In with BYU SSO
          </button>
        ) : null}

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setSubmitting(true);
            try {
              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/"
              });
              if (!result) {
                setError("Sign in failed. No response from auth server.");
                return;
              }
              if (result.error) {
                setError(result.error === "CredentialsSignin" ? "Invalid email/password" : result.error);
                return;
              }

              router.replace(result.url ?? "/");
              router.refresh();
            } catch {
              setError("Sign in failed. Check network/settings and try again.");
            } finally {
              setSubmitting(false);
            }
          }}
          style={{ display: "grid", gap: "0.6rem" }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error ? <small style={{ color: "#b91c1c" }}>{error}</small> : null}

        <small>
          No account? <Link href="/sign-up">Create one</Link>
        </small>
      </div>
    </main>
  );
}

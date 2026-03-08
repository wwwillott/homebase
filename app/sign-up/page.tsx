"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
      <div className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <h1>Create Account</h1>
        <p className="muted">Sign up for HomeBase with your own account.</p>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);

            const response = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
              setError("Unable to create account. Try a different email.");
              return;
            }

            const result = await signIn("credentials", {
              email,
              password,
              redirect: false,
              callbackUrl: "/"
            });
            if (result?.error) {
              setError("Account created, but automatic sign-in failed.");
              return;
            }
            window.location.href = "/";
          }}
          style={{ display: "grid", gap: "0.6rem" }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
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
            placeholder="Password (8+ chars)"
            required
            minLength={8}
          />
          <button type="submit">Create Account</button>
        </form>

        {error ? <small style={{ color: "#b91c1c" }}>{error}</small> : null}

        <small>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </small>
      </div>
    </main>
  );
}

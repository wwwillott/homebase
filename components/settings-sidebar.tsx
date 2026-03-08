"use client";

import { useState } from "react";
import { ThemeOption, ThemePreviewPicker } from "@/components/theme-preview-picker";
import { LmsProvider } from "@/types/lms";

type ThemeId =
  | "scholar-paper"
  | "terminal-study"
  | "sunrise-calendar"
  | "studio-minimal"
  | "midnight-focus"
  | "campus-retro";

interface Props {
  open: boolean;
  onClose: () => void;
  themes: ThemeOption[];
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
  onSignOut: () => void;
  onSyncComplete: () => Promise<void>;
}

const LMS_PROVIDERS: Array<{ id: LmsProvider; label: string }> = [
  { id: "LEARNING_SUITE", label: "Learning Suite" },
  { id: "CANVAS", label: "Canvas" },
  { id: "GRADESCOPE", label: "Gradescope" },
  { id: "MAX", label: "Max" }
];

export function SettingsSidebar({
  open,
  onClose,
  themes,
  value,
  onChange,
  onSignOut,
  onSyncComplete
}: Props) {
  const [tokens, setTokens] = useState<Record<LmsProvider, string>>({
    LEARNING_SUITE: "",
    CANVAS: "",
    GRADESCOPE: "",
    MAX: ""
  });
  const [status, setStatus] = useState<string>("");

  async function connectProvider(provider: LmsProvider) {
    setStatus(`Connecting ${provider}...`);
    const response = await fetch(`/api/connectors/${provider}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokens[provider] || `manual-${provider.toLowerCase()}`
      })
    });

    if (!response.ok) {
      setStatus(`Failed to connect ${provider}.`);
      return;
    }

    setStatus(`Connected ${provider}.`);
  }

  async function syncNow() {
    setStatus("Syncing assignments...");
    const response = await fetch("/api/sync/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      setStatus("Sync failed.");
      return;
    }

    await onSyncComplete();
    setStatus("Sync complete.");
  }

  return (
    <>
      {open ? <button type="button" className="settings-overlay" onClick={onClose} aria-label="Close settings" /> : null}
      <aside className={`settings-sidebar ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings">
            Close
          </button>
        </div>
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong>Theme</strong>
          <ThemePreviewPicker themes={themes} value={value} onChange={onChange} />
        </div>

        <div style={{ display: "grid", gap: "0.6rem", marginTop: "1rem" }}>
          <strong>Connect LMS</strong>
          {LMS_PROVIDERS.map((provider) => (
            <div key={provider.id} className="connector-row">
              <label>{provider.label}</label>
              <input
                type="text"
                value={tokens[provider.id]}
                onChange={(event) =>
                  setTokens((current) => ({
                    ...current,
                    [provider.id]: event.currentTarget.value
                  }))
                }
                placeholder="Token / code / username"
              />
              <button type="button" onClick={() => connectProvider(provider.id)}>
                Connect
              </button>
            </div>
          ))}
          <button type="button" onClick={syncNow}>
            Sync now
          </button>
          {status ? <small>{status}</small> : null}
        </div>

        <div style={{ display: "grid", gap: "0.6rem", marginTop: "1rem" }}>
          <button type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

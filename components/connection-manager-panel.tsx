"use client";

import { useMemo, useState } from "react";
import { LmsProvider } from "@/types/lms";

export type ManagedClass = {
  id: string;
  name: string;
  lms: LmsProvider;
  color?: string;
  learningSuiteFeedUrl?: string;
  learningSuiteConnected?: boolean;
  maxFeedUrl?: string;
  maxConnected?: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  classes: ManagedClass[];
  palette: string[];
  onClassesChange: (next: ManagedClass[]) => void;
  onSyncComplete: () => Promise<void>;
  onOpenSetupWizard: () => void;
}

const LMS_OPTIONS: LmsProvider[] = ["CANVAS", "LEARNING_SUITE", "GRADESCOPE", "MAX"];

function createClass(): ManagedClass {
  return {
    id: `class-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    name: "",
    lms: "CANVAS",
    color: undefined
  };
}

export function ConnectionManagerPanel({
  open,
  onClose,
  classes,
  palette,
  onClassesChange,
  onSyncComplete,
  onOpenSetupWizard
}: Props) {
  const [canvasToken, setCanvasToken] = useState("");
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("https://byu.instructure.com");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeUpdate, setActiveUpdate] = useState<string | null>(null);

  const learningSuiteClasses = useMemo(
    () => classes.filter((item) => item.lms === "LEARNING_SUITE"),
    [classes]
  );
  const maxClasses = useMemo(
    () => classes.filter((item) => item.lms === "MAX"),
    [classes]
  );

  async function connectCanvas() {
    setBusy(true);
    setStatus("Connecting Canvas...");
    try {
      const response = await fetch("/api/connectors/CANVAS/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: canvasToken, baseUrl: canvasBaseUrl })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(`Canvas connection failed: ${payload.error ?? "unknown error"}`);
        return;
      }
      await importCanvasClasses();
      setStatus("Canvas connected. Classes imported.");
    } finally {
      setBusy(false);
    }
  }

  async function importCanvasClasses() {
    const response = await fetch("/api/connectors/canvas/courses");
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setStatus(`Canvas class import failed: ${payload.error ?? "unknown error"}`);
      return;
    }
    const payload = (await response.json()) as { courses?: Array<{ id: string; name: string }> };
    if (!payload.courses?.length) {
      setStatus("Canvas connected, but no courses were returned.");
      return;
    }

    const existing = new Map(classes.map((item) => [item.id, item]));
    const merged = [...classes];
    for (const course of payload.courses) {
      const id = `canvas-${course.id}`;
      if (existing.has(id)) {
        continue;
      }
      merged.push({ id, name: course.name, lms: "CANVAS" });
    }
    onClassesChange(merged);
  }

  async function connectLearningSuite() {
    setBusy(true);
    setActiveUpdate("LEARNING_SUITE");
    setStatus("Connecting Learning Suite...");
    try {
      const feedUrls = learningSuiteClasses
        .map((item) => item.learningSuiteFeedUrl?.trim())
        .filter((value): value is string => Boolean(value));
      if (feedUrls.length === 0) {
        setStatus("Add at least one Learning Suite iCal feed URL.");
        return;
      }

      const response = await fetch("/api/connectors/LEARNING_SUITE/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: feedUrls.join("\n") })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(`Learning Suite connection failed: ${payload.error ?? "unknown error"}`);
        return;
      }

      onClassesChange(
        classes.map((item) =>
          item.lms === "LEARNING_SUITE"
            ? {
                ...item,
                learningSuiteConnected: Boolean(item.learningSuiteFeedUrl?.trim())
              }
            : item
        )
      );
      setStatus("Learning Suite connected for classes with feed links.");
    } finally {
      setBusy(false);
      setActiveUpdate(null);
    }
  }

  async function connectMax() {
    setBusy(true);
    setActiveUpdate("MAX");
    setStatus("Connecting Max...");
    try {
      const feedUrls = maxClasses
        .map((item) => item.maxFeedUrl?.trim())
        .filter((value): value is string => Boolean(value));
      if (feedUrls.length === 0) {
        setStatus("Add at least one Max feed URL.");
        return;
      }

      const response = await fetch("/api/connectors/MAX/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: feedUrls.join("\n") })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(`Max connection failed: ${payload.error ?? "unknown error"}`);
        return;
      }

      onClassesChange(
        classes.map((item) =>
          item.lms === "MAX"
            ? {
                ...item,
                maxConnected: Boolean(item.maxFeedUrl?.trim())
              }
            : item
        )
      );
      setStatus("Max connected for classes with feed links.");
    } finally {
      setBusy(false);
      setActiveUpdate(null);
    }
  }

  async function syncNow() {
    setBusy(true);
    setStatus("Syncing assignments...");
    try {
      await fetch("/api/sync/run", { method: "POST", headers: { "Content-Type": "application/json" } });
      await onSyncComplete();
      setStatus("Sync complete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="settings-overlay" onClick={onClose} aria-hidden="true" />
      ) : null}
      <aside
        className={`settings-sidebar ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-manager-title"
        aria-hidden={!open}
      >
        <div className="settings-header">
          <h2 id="connection-manager-title">Connection Manager</h2>
          <button type="button" onClick={onClose} aria-label="Close connection manager">
            Close
          </button>
        </div>

        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong>Class Manager</strong>
          {classes.map((item) => (
            <div key={item.id} className="connector-row">
              <input
                type="text"
                value={item.name}
                placeholder="Course name"
                onChange={(event) =>
                  onClassesChange(
                    classes.map((row) =>
                      row.id === item.id ? { ...row, name: event.currentTarget.value } : row
                    )
                  )
                }
              />
              <select
                value={item.lms}
                onChange={(event) =>
                  onClassesChange(
                    classes.map((row) =>
                      row.id === item.id
                        ? { ...row, lms: event.currentTarget.value as LmsProvider }
                        : row
                    )
                  )
                }
              >
                {LMS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <label className="color-picker">
                <span className="muted">Color</span>
                <input
                  type="color"
                  value={
                    item.color ??
                    palette[classes.findIndex((row) => row.id === item.id) % Math.max(palette.length, 1)] ??
                    "#dbeafe"
                  }
                  onChange={(event) =>
                    onClassesChange(
                      classes.map((row) =>
                        row.id === item.id ? { ...row, color: event.currentTarget.value } : row
                      )
                    )
                  }
                  aria-label="Class color"
                />
              </label>
              {item.lms === "LEARNING_SUITE" ? (
                <div className="row" style={{ width: "100%" }}>
                  <input
                    type="text"
                    value={item.learningSuiteFeedUrl ?? ""}
                    placeholder="Learning Suite iCal feed URL"
                    onChange={(event) =>
                      onClassesChange(
                        classes.map((row) =>
                          row.id === item.id
                            ? {
                                ...row,
                                learningSuiteFeedUrl: event.currentTarget.value,
                                learningSuiteConnected: false
                              }
                            : row
                        )
                      )
                    }
                  />
                  {item.learningSuiteConnected ? (
                    <span className="status-pill ok">Feed added</span>
                  ) : (
                    <span className="status-pill warn">Needs connect</span>
                  )}
                  <button
                    type="button"
                    onClick={connectLearningSuite}
                    disabled={busy || !item.learningSuiteFeedUrl?.trim()}
                  >
                    {item.learningSuiteConnected ? "Update feed" : "Connect feed"}
                  </button>
                </div>
              ) : null}
              {item.lms === "MAX" ? (
                <div className="row" style={{ width: "100%" }}>
                  <input
                    type="text"
                    value={item.maxFeedUrl ?? ""}
                    placeholder="Max connection string / feed URL"
                    onChange={(event) =>
                      onClassesChange(
                        classes.map((row) =>
                          row.id === item.id
                            ? { ...row, maxFeedUrl: event.currentTarget.value, maxConnected: false }
                            : row
                        )
                      )
                    }
                  />
                  {item.maxConnected ? (
                    <span className="status-pill ok">Feed added</span>
                  ) : (
                    <span className="status-pill warn">Needs connect</span>
                  )}
                  <button
                    type="button"
                    onClick={connectMax}
                    disabled={busy || !item.maxFeedUrl?.trim()}
                  >
                    {item.maxConnected ? "Update feed" : "Connect feed"}
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onClassesChange(classes.filter((row) => row.id !== item.id))}
                disabled={classes.length <= 1}
              >
                Remove Class
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onClassesChange([...classes, createClass()])}>
            Add Class
          </button>
          <button type="button" onClick={onOpenSetupWizard}>
            Open Setup Wizard
          </button>
        </div>

        <div style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
          <strong>Canvas Connection</strong>
          <p className="muted">Canvas classes pull together through one account connection.</p>
          <input
            type="text"
            value={canvasToken}
            onChange={(event) => setCanvasToken(event.currentTarget.value)}
            placeholder="Canvas API token"
          />
          <input
            type="text"
            value={canvasBaseUrl}
            onChange={(event) => setCanvasBaseUrl(event.currentTarget.value)}
            placeholder="Canvas base URL (e.g. https://byu.instructure.com)"
          />
          <div className="row">
            <button type="button" onClick={connectCanvas} disabled={busy || !canvasToken.trim()}>
              Connect Canvas Token
            </button>
            <button type="button" onClick={importCanvasClasses} disabled={busy}>
              Import Canvas Classes
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
          <strong>Max Connection</strong>
          <p className="muted">
            Provide Max connection strings/feed links if required by your class. If the Max schedule
            changes, refresh the link here.
          </p>
          <button type="button" onClick={connectMax} disabled={busy}>
            {activeUpdate === "MAX" ? "Updating feeds..." : "Connect Max Feeds"}
          </button>
        </div>

        <div style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
          <button type="button" onClick={syncNow} disabled={busy}>
            Sync now
          </button>
          {status ? (
            <small role="status" aria-live="polite">
              {status}
            </small>
          ) : null}
        </div>
      </aside>
    </>
  );
}

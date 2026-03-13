"use client";

import { ManagedClass } from "@/components/connection-manager-panel";
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
  classes: ManagedClass[];
  palette: string[];
  onOpenConnectionManager: () => void;
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
  classes,
  palette,
  onOpenConnectionManager
}: Props) {
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
          <strong>Class Manager</strong>
          {classes.length === 0 ? (
            <div className="connector-row">
              <small className="muted">No classes added yet.</small>
            </div>
          ) : (
            classes.map((item) => (
              <div key={item.id} className="connector-row">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="row" style={{ gap: "0.5rem" }}>
                    <span
                      className="class-color-dot"
                      style={{
                        background:
                          item.color ??
                          palette[classes.findIndex((row) => row.id === item.id) % Math.max(palette.length, 1)] ??
                          "var(--line)"
                      }}
                      aria-hidden="true"
                    />
                    {item.name || "Unnamed class"}
                  </span>
                  {item.lms === "LEARNING_SUITE" && item.learningSuiteConnected ? (
                    <span
                      className="ls-connected-icon"
                      title="learning suite has been connected for this class"
                      aria-label="learning suite has been connected for this class"
                    >
                      LS
                    </span>
                  ) : null}
                  {item.lms === "MAX" && item.maxConnected ? (
                    <span
                      className="max-connected-icon"
                      title="max has been connected for this class"
                      aria-label="max has been connected for this class"
                    >
                      MAX
                    </span>
                  ) : null}
                </div>
                <small className="muted">
                  Platform: {LMS_PROVIDERS.find((p) => p.id === item.lms)?.label ?? item.lms}
                </small>
              </div>
            ))
          )}
          <button type="button" onClick={onOpenConnectionManager}>
            Open Connection Manager
          </button>
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

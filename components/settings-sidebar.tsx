"use client";

import { ThemeOption, ThemePreviewPicker } from "@/components/theme-preview-picker";

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
}

export function SettingsSidebar({ open, onClose, themes, value, onChange }: Props) {
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
      </aside>
    </>
  );
}

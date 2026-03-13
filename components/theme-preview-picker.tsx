"use client";

type ThemeId =
  | "scholar-paper"
  | "terminal-study"
  | "sunrise-calendar"
  | "studio-minimal"
  | "midnight-focus"
  | "campus-retro";

export interface ThemeOption {
  id: ThemeId;
  label: string;
  mood: string;
  headingFont: string;
  bodyFont: string;
  swatches: [string, string, string];
  palette: string[];
}

interface Props {
  themes: ThemeOption[];
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export function ThemePreviewPicker({ themes, value, onChange }: Props) {
  return (
    <div className="theme-grid">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={`theme-card ${value === theme.id ? "active" : ""}`}
        >
          <div className="theme-head">
            <strong>{theme.label}</strong>
            <small>{theme.mood}</small>
          </div>
          <div className="theme-swatches">
            {theme.swatches.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
          <small>{theme.headingFont} + {theme.bodyFont}</small>
        </button>
      ))}
    </div>
  );
}

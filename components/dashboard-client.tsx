"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { AssignmentList } from "@/components/assignment-list";
import { InsightsPanel } from "@/components/insights-panel";
import { OnboardingConnectionWizard } from "@/components/onboarding-connection-wizard";
import { ScheduleView } from "@/components/schedule-view";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { ThemeOption } from "@/components/theme-preview-picker";
import { ViewModeSwitch } from "@/components/view-mode-switch";
import { AggregatedAssignment } from "@/types/lms";

const THEME_STORAGE_KEY = "homebase-theme";

type ThemeId =
  | "scholar-paper"
  | "terminal-study"
  | "sunrise-calendar"
  | "studio-minimal"
  | "midnight-focus"
  | "campus-retro";

const THEMES: ThemeOption[] = [
  {
    id: "scholar-paper",
    label: "Scholar Paper",
    mood: "Focused academic planner",
    headingFont: "Fraunces",
    bodyFont: "Source Sans 3",
    swatches: ["#f6f1e9", "#1f2937", "#1f4c4d"]
  },
  {
    id: "terminal-study",
    label: "Terminal Study",
    mood: "Dense command-center feel",
    headingFont: "Space Grotesk",
    bodyFont: "IBM Plex Mono",
    swatches: ["#0b1114", "#d9ffe8", "#4affc3"]
  },
  {
    id: "sunrise-calendar",
    label: "Sunrise Calendar",
    mood: "Warm, optimistic planning",
    headingFont: "Sora",
    bodyFont: "Manrope",
    swatches: ["#fff5eb", "#1f2a44", "#ff7a2f"]
  },
  {
    id: "studio-minimal",
    label: "Studio Minimal",
    mood: "Editorial and quiet",
    headingFont: "DM Serif Display",
    bodyFont: "Work Sans",
    swatches: ["#f8f8f6", "#111111", "#0b7f7a"]
  },
  {
    id: "midnight-focus",
    label: "Midnight Focus",
    mood: "Calm deep-work mode",
    headingFont: "Outfit",
    bodyFont: "Inter Tight",
    swatches: ["#0f172e", "#e6eefc", "#6ef0c2"]
  },
  {
    id: "campus-retro",
    label: "Campus Retro",
    mood: "Notebook + binder nostalgia",
    headingFont: "Bricolage Grotesque",
    bodyFont: "Merriweather Sans",
    swatches: ["#f8edd9", "#2f2a24", "#2d5b93"]
  }
];

export function DashboardClient() {
  const [view, setView] = useState<"daily" | "weekly" | "monthly" | "list">("list");
  const [items, setItems] = useState<AggregatedAssignment[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [assignmentTypes, setAssignmentTypes] = useState<string[]>([]);
  const [classId, setClassId] = useState<string>("all");
  const [assignmentType, setAssignmentType] = useState<string>("all");
  const [completion, setCompletion] = useState<"all" | "incomplete" | "complete">("all");
  const [theme, setTheme] = useState<ThemeId>("terminal-study");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState<boolean | null>(null);

  async function loadAssignments() {
    setLoading(true);
    const params = new URLSearchParams({ view, completion });
    if (classId !== "all") params.set("classId", classId);
    if (assignmentType !== "all") params.set("assignmentType", assignmentType);

    const response = await fetch(`/api/assignments?${params.toString()}`);
    if (!response.ok) {
      setLoading(false);
      return;
    }

    const data = await response.json();
    setItems(data.assignments ?? []);
    setClasses(data.meta?.classes ?? []);
    setAssignmentTypes(data.meta?.assignmentTypes ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAssignments().catch(() => setLoading(false));
  }, [view, classId, assignmentType, completion]);

  useEffect(() => {
    async function loadConnectorStatus() {
      const response = await fetch("/api/connectors/status");
      if (!response.ok) {
        setHasConnections(true);
        return;
      }
      const payload = (await response.json()) as { hasConnections?: boolean };
      setHasConnections(Boolean(payload.hasConnections));
    }

    loadConnectorStatus().catch(() => setHasConnections(true));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some((themeOption) => themeOption.id === stored)) {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
      return;
    }
    document.documentElement.dataset.theme = "terminal-study";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTs = +new Date(a.mergedFields.dueAt);
        const bTs = +new Date(b.mergedFields.dueAt);
        if (Number.isNaN(aTs) && Number.isNaN(bTs)) return 0;
        if (Number.isNaN(aTs)) return 1;
        if (Number.isNaN(bTs)) return -1;
        return aTs - bTs;
      }),
    [items]
  );

  return (
    <main>
      <button
        type="button"
        className="settings-trigger"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.3 2h3.4l.5 2.3c.5.2 1 .4 1.4.8l2.2-.8 1.7 2.9-1.7 1.6c.1.5.2 1 .2 1.5s-.1 1-.2 1.5l1.7 1.6-1.7 2.9-2.2-.8c-.4.3-.9.6-1.4.8l-.5 2.3h-3.4l-.5-2.3c-.5-.2-1-.4-1.4-.8l-2.2.8-1.7-2.9 1.7-1.6c-.1-.5-.2-1-.2-1.5s.1-1 .2-1.5L2.5 7.2l1.7-2.9 2.2.8c.4-.3.9-.6 1.4-.8L10.3 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <SettingsSidebar
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        themes={THEMES}
        value={theme}
        onChange={setTheme}
        onSyncComplete={loadAssignments}
        onSignOut={() => signOut({ callbackUrl: "/sign-in" })}
      />
      <header style={{ marginBottom: "1.3rem", display: "grid", gap: "0.6rem" }}>
        <h1>HomeBase</h1>
        <p className="muted">Unified assignments from Learning Suite, Canvas, Gradescope, and Max.</p>
        {hasConnections === false ? (
          <OnboardingConnectionWizard
            onDone={async () => {
              await loadAssignments();
              setHasConnections(true);
            }}
          />
        ) : null}
        <ViewModeSwitch value={view} onChange={setView} />
        <div className="row">
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="all">All Classes</option>
            {classes.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
            <option value="all">All Types</option>
            {assignmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={completion}
            onChange={(e) => setCompletion(e.target.value as "all" | "incomplete" | "complete")}
          >
            <option value="all">All Completion</option>
            <option value="incomplete">Incomplete</option>
            <option value="complete">Completed</option>
          </select>
        </div>
      </header>

      {loading ? <p>Loading assignments...</p> : null}

      <div className="grid">
        {view === "list" ? (
          <AssignmentList items={sortedItems} onToggled={loadAssignments} />
        ) : (
          <ScheduleView mode={view} items={sortedItems} />
        )}
        <InsightsPanel items={sortedItems} />
      </div>
    </main>
  );
}

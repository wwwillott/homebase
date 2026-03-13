"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { AssignmentList } from "@/components/assignment-list";
import {
  ConnectionManagerPanel,
  ManagedClass
} from "@/components/connection-manager-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { OnboardingConnectionWizard } from "@/components/onboarding-connection-wizard";
import { ScheduleView } from "@/components/schedule-view";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { ThemeOption } from "@/components/theme-preview-picker";
import { ViewModeSwitch } from "@/components/view-mode-switch";
import { AggregatedAssignment } from "@/types/lms";

const THEME_STORAGE_KEY = "homebase-theme";
const CLASS_MANAGER_STORAGE_KEY = "homebase-class-manager-v1";

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
  const [connectionManagerOpen, setConnectionManagerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [managedClasses, setManagedClasses] = useState<ManagedClass[]>([]);

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
        return;
      }
      const payload = (await response.json()) as { hasConnections?: boolean };
      if (!payload.hasConnections) {
        setShowSetupWizard(true);
      }
    }

    loadConnectorStatus().catch(() => undefined);
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
    try {
      const raw = localStorage.getItem(CLASS_MANAGER_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as ManagedClass[];
      if (Array.isArray(parsed)) {
        setManagedClasses(
          parsed.filter(
            (item): item is ManagedClass =>
              Boolean(item && typeof item.id === "string" && typeof item.lms === "string")
          )
        );
      }
    } catch {
      // Ignore corrupted local state and let user rebuild class manager entries.
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(CLASS_MANAGER_STORAGE_KEY, JSON.stringify(managedClasses));
  }, [managedClasses]);

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
      <button
        type="button"
        className="connections-trigger"
        onClick={() => setConnectionManagerOpen(true)}
        aria-label="Open connection manager"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.5 6.5a4 4 0 1 0 0 8h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13.5 9.5a4 4 0 1 1 0 8h-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <SettingsSidebar
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        themes={THEMES}
        value={theme}
        onChange={setTheme}
        classes={managedClasses}
        onOpenConnectionManager={() => {
          setSettingsOpen(false);
          setConnectionManagerOpen(true);
        }}
        onSignOut={() => signOut({ callbackUrl: "/sign-in" })}
      />
      <ConnectionManagerPanel
        open={connectionManagerOpen}
        onClose={() => setConnectionManagerOpen(false)}
        classes={managedClasses}
        onClassesChange={setManagedClasses}
        onSyncComplete={loadAssignments}
        onOpenSetupWizard={() => {
          setConnectionManagerOpen(false);
          setShowSetupWizard(true);
        }}
      />
      <header style={{ marginBottom: "1.3rem", display: "grid", gap: "0.6rem" }}>
        <h1>HomeBase</h1>
        <p className="muted">Unified assignments from Learning Suite, Canvas, Gradescope, and Max.</p>
        <OnboardingConnectionWizard
          open={showSetupWizard}
          onClose={() => setShowSetupWizard(false)}
          onCaptureClasses={(captured) => setManagedClasses(captured)}
          onDone={async () => {
            await loadAssignments();
            setShowSetupWizard(false);
          }}
        />
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

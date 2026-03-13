"use client";

import { useMemo, useState } from "react";
import { ManagedClass } from "@/components/connection-manager-panel";
import { LmsProvider } from "@/types/lms";

type CourseRow = {
  id: string;
  name: string;
  platform: LmsProvider;
};

interface Props {
  open: boolean;
  onClose?: () => void;
  onDone: () => Promise<void>;
  onCaptureClasses?: (classes: ManagedClass[]) => void;
}

const PLATFORMS: LmsProvider[] = ["LEARNING_SUITE", "CANVAS", "GRADESCOPE", "MAX"];
const PLATFORM_SET = new Set<LmsProvider>(PLATFORMS);

function createCourse(defaultPlatform: LmsProvider = "CANVAS"): CourseRow {
  return {
    id: `course-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    name: "",
    platform: defaultPlatform
  };
}

export function OnboardingConnectionWizard({ open, onClose, onDone, onCaptureClasses }: Props) {
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<CourseRow[]>([createCourse()]);
  const [canvasToken, setCanvasToken] = useState("");
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("https://byu.instructure.com");
  const [learningSuiteFeeds, setLearningSuiteFeeds] = useState<Record<string, string>>({});
  const [maxFeeds, setMaxFeeds] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const safeCourses = useMemo(
    () =>
      courses
        .filter((course): course is CourseRow => Boolean(course && typeof course.id === "string"))
        .map((course) => ({
          ...course,
          platform: PLATFORM_SET.has(course.platform) ? course.platform : "CANVAS"
        })),
    [courses]
  );

  const hasCanvasCourses = useMemo(
    () => safeCourses.some((course) => course.platform === "CANVAS" && course.name.trim()),
    [safeCourses]
  );
  const learningSuiteCourses = useMemo(
    () => safeCourses.filter((course) => course.platform === "LEARNING_SUITE" && course.name.trim()),
    [safeCourses]
  );
  const maxCourses = useMemo(
    () => safeCourses.filter((course) => course.platform === "MAX" && course.name.trim()),
    [safeCourses]
  );

  function captureClasses() {
    onCaptureClasses?.(
      safeCourses
        .filter((course) => course.name.trim())
        .map((course) => ({
          id: course.id,
          name: course.name.trim(),
          lms: course.platform,
          learningSuiteFeedUrl: learningSuiteFeeds[course.id] ?? "",
          maxFeedUrl: maxFeeds[course.id] ?? "",
          learningSuiteConnected: Boolean(learningSuiteFeeds[course.id]?.trim()),
          maxConnected: Boolean(maxFeeds[course.id]?.trim())
        }))
    );
  }

  async function connectCanvasToken() {
    setBusy(true);
    setStatus("Connecting Canvas...");
    try {
      const response = await fetch("/api/connectors/CANVAS/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: canvasToken,
          baseUrl: canvasBaseUrl
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(`Canvas connection failed: ${payload.error ?? "unknown error"}`);
        return;
      }
      setStatus("Canvas connected.");
    } finally {
      setBusy(false);
    }
  }

  async function connectLearningSuite() {
    setBusy(true);
    setStatus("Connecting Learning Suite...");
    try {
      const feeds = learningSuiteCourses
        .map((course) => learningSuiteFeeds[course.id]?.trim())
        .filter(Boolean)
        .join("\n");

      if (!feeds) {
        setStatus("Add at least one Learning Suite iCal feed URL.");
        return;
      }

      const response = await fetch("/api/connectors/LEARNING_SUITE/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: feeds })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(`Learning Suite connection failed: ${payload.error ?? "unknown error"}`);
        return;
      }
      setStatus("Learning Suite feeds saved. Classes marked as connected.");
    } finally {
      setBusy(false);
    }
  }

  async function connectMax() {
    setBusy(true);
    setStatus("Connecting Max...");
    try {
      const feeds = maxCourses
        .map((course) => maxFeeds[course.id]?.trim())
        .filter(Boolean)
        .join("\n");

      if (!feeds) {
        setStatus("Add at least one Max connection string/feed URL.");
        return;
      }

      const response = await fetch("/api/connectors/MAX/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: feeds })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(`Max connection failed: ${payload.error ?? "unknown error"}`);
        return;
      }
      setStatus("Max feeds saved. Classes marked as connected.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setStatus("Running first sync...");
    try {
      await fetch("/api/sync/run", { method: "POST", headers: { "Content-Type": "application/json" } });
      await onDone();
      setStatus("Setup complete.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="wizard-overlay" onClick={onClose} aria-hidden="true" />
      <section className="wizard-modal">
        <div className="settings-header">
          <h2>Get Started</h2>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Close setup wizard">
              Close
            </button>
          ) : null}
        </div>
      {step === 1 ? (
        <>
          <p className="muted">
            Add your current schedule first. For each course, pick which LMS it uses.
          </p>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {safeCourses.map((course) => (
              <div key={course.id} className="row">
                <input
                  type="text"
                  placeholder="Course name"
                  value={course.name}
                  onChange={(event) =>
                    setCourses((current) =>
                      current.map((row) =>
                        row.id === course.id
                          ? {
                              ...row,
                              name: (event.target as HTMLInputElement).value ?? ""
                            }
                          : row
                      )
                    )
                  }
                />
                <select
                  value={PLATFORM_SET.has(course.platform) ? course.platform : "CANVAS"}
                  onChange={(event) =>
                    setCourses((current) =>
                      current.map((row) =>
                        row.id === course.id
                          ? {
                              ...row,
                              platform: PLATFORM_SET.has((event.target as HTMLSelectElement).value as LmsProvider)
                                ? ((event.target as HTMLSelectElement).value as LmsProvider)
                                : "CANVAS"
                            }
                          : row
                      )
                    )
                  }
                >
                  {PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setCourses((current) => current.filter((row) => row.id !== course.id))
                  }
                  disabled={safeCourses.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="row">
            <button
              type="button"
              onClick={() =>
                setCourses((current) => [...current, createCourse()])
              }
            >
              Add Course
            </button>
            <button
              type="button"
              onClick={() => {
                captureClasses();
                setStep(hasCanvasCourses ? 2 : learningSuiteCourses.length > 0 ? 3 : 4);
              }}
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <p className="muted">Connect Canvas for classes marked as Canvas.</p>
          <input
            type="text"
            value={canvasToken}
            onChange={(event) => setCanvasToken((event.target as HTMLInputElement).value)}
            placeholder="Canvas API token"
          />
          <input
            type="text"
            value={canvasBaseUrl}
            onChange={(event) => setCanvasBaseUrl((event.target as HTMLInputElement).value)}
            placeholder="Canvas base URL (e.g. https://byu.instructure.com)"
          />
          <div className="row">
            <button type="button" onClick={connectCanvasToken} disabled={busy || !canvasToken.trim()}>
              Connect Canvas Token
            </button>
            <a href={`/api/connectors/canvas/oauth/start?baseUrl=${encodeURIComponent(canvasBaseUrl)}`}>
              Connect with Canvas OAuth
            </a>
            <button
              type="button"
              onClick={() => {
                captureClasses();
                setStep(learningSuiteCourses.length ? 3 : maxCourses.length ? 4 : 5);
              }}
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <p className="muted">Add iCalendar feed links for classes marked as Learning Suite.</p>
          {learningSuiteCourses.map((course) => (
            <div key={course.id} style={{ display: "grid", gap: "0.4rem" }}>
              <strong>{course.name}</strong>
              <input
                type="text"
                value={learningSuiteFeeds[course.id] ?? ""}
                onChange={(event) =>
                  setLearningSuiteFeeds((current) => ({
                    ...current,
                    [course.id]: (event.target as HTMLInputElement).value ?? ""
                  }))
                }
                placeholder="Learning Suite iCal feed URL"
              />
            </div>
          ))}
          <p className="muted">
            Notice: if your teacher changes the schedule, it won&apos;t appear here. Update this iCal Feed link periodically.
          </p>
          <div className="row">
            <button type="button" onClick={connectLearningSuite} disabled={busy}>
              Connect Learning Suite Feeds
            </button>
            <button
              type="button"
              onClick={() => {
                captureClasses();
                setStep(maxCourses.length ? 4 : 5);
              }}
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <p className="muted">
            Add Max connection strings/feed links for classes marked as Max (if required).
          </p>
          {maxCourses.map((course) => (
            <div key={course.id} style={{ display: "grid", gap: "0.4rem" }}>
              <strong>{course.name}</strong>
              <input
                type="text"
                value={maxFeeds[course.id] ?? ""}
                onChange={(event) =>
                  setMaxFeeds((current) => ({
                    ...current,
                    [course.id]: (event.target as HTMLInputElement).value ?? ""
                  }))
                }
                placeholder="Max connection string / feed URL"
              />
            </div>
          ))}
          <div className="row">
            <button type="button" onClick={connectMax} disabled={busy}>
              Connect Max Feeds
            </button>
            <button
              type="button"
              onClick={() => {
                captureClasses();
                setStep(5);
              }}
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <p className="muted">Finish setup and run your first sync.</p>
          <button type="button" onClick={finish} disabled={busy}>
            Finish Setup
          </button>
        </>
      ) : null}

      {status ? <small>{status}</small> : null}
      </section>
    </>
  );
}

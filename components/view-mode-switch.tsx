"use client";

interface Props {
  value: "daily" | "weekly" | "monthly" | "list" | "calendar";
  onChange: (view: "daily" | "weekly" | "monthly" | "list" | "calendar") => void;
}

export function ViewModeSwitch({ value, onChange }: Props) {
  const options = ["daily", "weekly", "monthly", "list", "calendar"] as const;

  return (
    <div className="row">
      {options.map((option) => (
        <button
          key={option}
          style={{ borderColor: value === option ? "#1d4ed8" : undefined }}
          onClick={() => onChange(option)}
          type="button"
        >
          {option[0].toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}

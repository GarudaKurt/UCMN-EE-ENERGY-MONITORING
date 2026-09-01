"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DateCalendarFieldProps {
  label: string;
  name: string;
  /** ISO date string, e.g. "2026-09-15" */
  value: string;
  onChange: (value: string) => void;
}

function parseValue(value: string): { year: number; month: number; day: number } {
  if (value) {
    const [y, m, d] = value.split("-").map(Number);
    if (y && m && d) return { year: y, month: m - 1, day: d };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplay(year: number, month: number, day: number): string {
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

export default function DateCalendarField({ label, name, value, onChange }: DateCalendarFieldProps) {
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected.year);
  const [viewMonth, setViewMonth] = useState(selected.month);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePick = (day: number) => {
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const isSelected = (day: number) =>
    viewYear === selected.year && viewMonth === selected.month && day === selected.day;

  const isToday = (day: number) => {
    const now = new Date();
    return (
      viewYear === now.getFullYear() &&
      viewMonth === now.getMonth() &&
      day === now.getDate()
    );
  };

  return (
    <div className="mb-4" ref={containerRef}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </label>

      <div className="relative">
        <button
          id={name}
          type="button"
          onClick={() => {
            setViewYear(selected.year);
            setViewMonth(selected.month);
            setOpen((o) => !o);
          }}
          className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm text-neutral-900"
        >
          <span>{formatDisplay(selected.year, selected.month, selected.day)}</span>
          <Calendar size={16} className="text-neutral-400" />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-neutral-900">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[10px] font-medium text-neutral-400">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) =>
                day === null ? (
                  <div key={`blank-${idx}`} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handlePick(day)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                      isSelected(day)
                        ? "bg-neutral-900 text-white"
                        : isToday(day)
                        ? "bg-neutral-200 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
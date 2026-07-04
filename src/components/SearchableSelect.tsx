"use client";

import { useEffect, useRef, useState } from "react";

export function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled,
  required,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function closeDropdown() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const selected = options.find((o) => o.code === value);
  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? closeDropdown() : setOpen(true))}
        className="die-cut-flat flex w-full items-center justify-between gap-2 bg-paper px-3 py-2 text-left text-sm text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className={`truncate ${selected ? "text-ink" : "text-graphite"}`}>
          {selected?.name ?? placeholder}
        </span>
        <span className="shrink-0 text-graphite">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full border border-graphite bg-paper shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border-b border-graphite px-3 py-2 text-sm text-ink outline-none"
          />
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 font-mono text-xs text-graphite">{emptyLabel}</li>
            )}
            {filtered.map((o) => (
              <li key={o.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.code);
                    closeDropdown();
                  }}
                  className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-kraft-dark/20 ${
                    o.code === value ? "bg-forest/10 font-semibold text-forest" : "text-ink"
                  }`}
                >
                  {o.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

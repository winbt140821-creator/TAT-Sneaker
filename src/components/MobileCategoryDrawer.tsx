"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronDownIcon, MenuIcon, XMarkIcon } from "./icons";

type Cat = {
  id: string;
  slug: string;
  label: string;
  children: { id: string; slug: string; label: string }[];
};

export function MobileCategoryDrawer({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        aria-label="Mở danh mục"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-ink lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink lg:hidden" role="dialog" aria-modal="true">
          <div className="flex items-center justify-end p-4">
            <button
              type="button"
              aria-label="Đóng danh mục"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center text-paper"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto px-4 pb-6">
            {categories.map((c) => {
              const isOpen = openId === c.id;
              return (
                <li key={c.id} className="border-b border-paper/15">
                  <div className="flex items-center">
                    <Link
                      href={`/?category=${encodeURIComponent(c.slug)}`}
                      onClick={() => setOpen(false)}
                      className="flex-1 py-3.5 font-display text-base text-paper"
                    >
                      {c.label}
                    </Link>
                    {c.children.length > 0 && (
                      <button
                        type="button"
                        aria-label={`Danh mục con của ${c.label}`}
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(isOpen ? null : c.id)}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-paper"
                      >
                        <ChevronDownIcon
                          className={"h-4 w-4 transition-transform " + (isOpen ? "rotate-180" : "")}
                        />
                      </button>
                    )}
                  </div>
                  {isOpen && c.children.length > 0 && (
                    <ul className="pb-2">
                      {c.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/?category=${encodeURIComponent(child.slug)}`}
                            onClick={() => setOpen(false)}
                            className="block py-2 pl-4 font-mono text-sm text-paper/80"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

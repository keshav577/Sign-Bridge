"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/speech", label: "Speech" },
  { href: "/sign", label: "Sign" },
  { href: "/classroom", label: "Classroom" },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false); // mobile menu

  // The small script in layout.js already set the theme. Here we only read it.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("signbridge-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <header className="sticky top-0 z-40 border-b border-fog bg-white/90 backdrop-blur dark:border-white/10 dark:bg-ink/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="" width={60} height={60} priority className="rounded-xl" />
          <span className="text-ink dark:text-white">
            Sign<span className="text-ink/70 dark:text-fog">Bridge</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex" aria-label="Main">
          {links.map((link) => {
            const active = path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-3 py-2 transition ${
                  active
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-ink/75 hover:bg-fog hover:text-ink dark:text-fog dark:hover:bg-ink-soft dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-xl border-2 border-fog p-2 text-ink transition hover:border-ink hover:text-ink dark:border-white/15 dark:text-fog dark:hover:border-white"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-xl border-2 border-fog p-2 text-ink md:hidden dark:border-white/15 dark:text-fog"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-fog px-4 py-2 md:hidden dark:border-white/10" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 font-semibold text-ink hover:bg-fog dark:text-fog dark:hover:bg-ink-soft"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

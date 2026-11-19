"use client";
import { useEffect, useRef, useState } from "react";
import { Copy, Trash2, Download, Save, Check } from "lucide-react";

/* =====================================================================
   Small helper functions shared by many pages.
   They are kept in this file so the project keeps the simple folder
   structure. They only touch LocalStorage when they are CALLED
   (inside an event handler or useEffect), never while the page is
   being rendered on the server.
   ===================================================================== */

const HISTORY_KEY = "signbridge-history";

// A simple unique id (crypto.randomUUID does not work on plain http pages)
export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Create one caption line. source is "Speech" or "Sign".
export function makeCaption(source, text) {
  return { id: makeId(), source, text, time: new Date().toLocaleTimeString() };
}

// Turn a list of captions into plain text, one line each.
export function transcriptToText(items) {
  return items.map((item) => `[${item.time}] ${item.source}: ${item.text}`).join("\n");
}

// Download any text as a .txt file
export function downloadTextFile(text, name = "signbridge-transcript") {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Read all saved transcripts (newest first)
export function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save one transcript. Returns true if it worked.
export function saveTranscript(items, title) {
  if (!items.length) return false;
  try {
    const session = {
      id: makeId(),
      title: title || "Classroom transcript",
      createdAt: new Date().toISOString(),
      items,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...loadHistory()].slice(0, 50)));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

// Delete one transcript and return the new list
export function deleteTranscript(id) {
  const next = loadHistory().filter((session) => session.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

/* ---------- One caption row (also used on the History page) ---------- */
export function CaptionItem({ item, textClass = "text-lg" }) {
  const isSpeech = item.source === "Speech";
  return (
    <div className="border-b border-fog pb-3 last:border-0 last:pb-0 dark:border-white/10">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`chip ${isSpeech ? "chip-speech" : "chip-sign"}`}
        >
          {isSpeech ? "Speech" : "Sign"}
        </span>
        <span className="muted">{item.time}</span>
      </div>
      <p className={`${textClass} leading-relaxed`}>{item.text}</p>
    </div>
  );
}

/* =====================================================================
   The caption panel
   Props:
     items      - list of captions to show
     onClear    - called when Clear is pressed
     title      - heading text
     emptyText  - message when there are no captions
     showSave   - show the "Save" button (saves to History)
   ===================================================================== */
const TEXT_SIZES = ["text-lg", "text-2xl", "text-4xl"];

export default function CaptionBox({
  items = [],
  onClear,
  title = "Live captions",
  emptyText = "Your captions will appear here.",
  showSave = true,
}) {
  const boxRef = useRef(null);
  const [sizeIndex, setSizeIndex] = useState(1); // start with large text
  const [notice, setNotice] = useState("");

  // Always scroll to the newest caption
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [items.length]);

  // Show a short message (like "Copied!") for 2 seconds
  function showNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2000);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(transcriptToText(items));
      showNotice("Copied to clipboard");
    } catch {
      showNotice("Copy failed - please select the text manually");
    }
  }

  function handleSave() {
    showNotice(saveTranscript(items, `${title} - ${new Date().toLocaleDateString()}`) ? "Saved to History" : "Could not save (browser storage unavailable)");
  }

  const hasItems = items.length > 0;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="muted text-sm">{items.length} caption {items.length === 1 ? "entry" : "entries"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded-2xl border border-fog dark:border-white/15" role="group" aria-label="Text size">
            <button
              onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
              disabled={sizeIndex === 0}
              aria-label="Smaller text"
              className="px-3 py-2 text-sm font-bold hover:bg-fog disabled:opacity-40 dark:hover:bg-white/10"
            >
              A-
            </button>
            <button
              onClick={() => setSizeIndex((i) => Math.min(TEXT_SIZES.length - 1, i + 1))}
              disabled={sizeIndex === TEXT_SIZES.length - 1}
              aria-label="Larger text"
              className="border-l border-fog px-3 py-2 text-sm font-bold hover:bg-fog disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/10"
            >
              A+
            </button>
          </div>
          {showSave && (
            <button className="btn-primary btn-sm" onClick={handleSave} disabled={!hasItems}>
              <Save size={15} /> Save
            </button>
          )}
          <button className="btn-secondary btn-sm" onClick={copyText} disabled={!hasItems}>
            <Copy size={15} /> Copy
          </button>
          <button className="btn-secondary btn-sm" onClick={() => downloadTextFile(transcriptToText(items))} disabled={!hasItems}>
            <Download size={15} /> Download
          </button>
          <button className="btn-secondary btn-sm" onClick={onClear} disabled={!hasItems}>
            <Trash2 size={15} /> Clear
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-fog/60 px-3 py-1.5 text-sm font-semibold text-ink dark:bg-fog dark:text-ink">
          <Check size={15} /> {notice}
        </p>
      )}

      <div
        ref={boxRef}
        aria-live="polite"
        className="well mt-4 max-h-[28rem] min-h-48 space-y-3 overflow-y-auto p-4"
      >
        {hasItems ? (
          items.map((item) => <CaptionItem key={item.id} item={item} textClass={TEXT_SIZES[sizeIndex]} />)
        ) : (
          <p className="py-14 text-center text-ink/70 dark:text-fog">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

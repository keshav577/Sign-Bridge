"use client";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import SpeechToText from "../../components/SpeechToText";
import CaptionBox, { makeCaption } from "../../components/CaptionBox";

export default function SpeechPage() {
  const [items, setItems] = useState([]);

  // Called by SpeechToText every time a sentence is finished
  function addSpeech(text) {
    setItems((old) => [...old, makeCaption("Speech", text)]);
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <div className="min-w-0 space-y-6">
        <div>
          <p className="eyebrow">Microphone tool</p>
          <h1 className="mt-1 text-3xl font-extrabold">Speech-to-text</h1>
          <p className="muted mt-2">Convert spoken words into live captions.</p>
        </div>
        <SpeechToText onFinalText={addSpeech} />
        <CaptionBox items={items} onClear={() => setItems([])} title="Speech transcript" emptyText="Captions will appear here after you start recording and speak." />
      </div>
    </main>
  );
}

"use client";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import SignRecognition from "../../components/SignRecognition";
import CaptionBox, { makeCaption } from "../../components/CaptionBox";

export default function SignPage() {
  const [items, setItems] = useState([]);

  // Called by SignRecognition when a gesture is recognised
  function addGesture(text) {
    setItems((old) => [...old, makeCaption("Sign", text)]);
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <div className="min-w-0 space-y-6">
        <div>
          <p className="eyebrow">Webcam tool</p>
          <h1 className="mt-1 text-3xl font-extrabold">Sign recognition</h1>
          <p className="muted mt-2">Show a supported gesture to the camera and it is written as text.</p>
        </div>
        <SignRecognition onRecognized={addGesture} showTrainer />
        <CaptionBox items={items} onClear={() => setItems([])} title="Recognized gestures" emptyText="Recognized gestures will appear here." />
      </div>
    </main>
  );
}

"use client";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import SpeechToText from "../../components/SpeechToText";
import SignRecognition from "../../components/SignRecognition";
import CaptionBox, { makeCaption } from "../../components/CaptionBox";

export default function ClassroomPage() {
  // ONE list holds both speech and sign captions, in the order they happened
  const [items, setItems] = useState([]);

  function addCaption(source, text) {
    setItems((old) => [...old, makeCaption(source, text)]);
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <div className="min-w-0 space-y-6">
        <div>
          <p className="eyebrow">Combined session</p>
          <h1 className="mt-1 text-3xl font-extrabold">Live classroom</h1>
          <p className="muted mt-2">Start the microphone and the camera. Speech and sign results appear together below.</p>
        </div>

        <div className="grid gap-6 2xl:grid-cols-2">
          <SpeechToText onFinalText={(text) => addCaption("Speech", text)} />
          <SignRecognition onRecognized={(text) => addCaption("Sign", text)} />
        </div>

        <CaptionBox
          items={items}
          onClear={() => setItems([])}
          title="Classroom captions"
          emptyText="Speech and sign captions will appear here with their time."
        />
      </div>
    </main>
  );
}

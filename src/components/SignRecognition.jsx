"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CircleAlert, Brain, Trash2, CircleDot, Volume2, VolumeX } from "lucide-react";

/* =====================================================================
   SignRecognition - how it works (in simple words)

   1. The webcam video is read frame by frame.
   2. MediaPipe HandLandmarker finds the hand and gives 21 landmark points
      (wrist, finger joints, finger tips).
   3. Those 21 points are classified in one of two ways:
        a) "Built-in gestures"  - simple geometry rules (is each finger up or down?)
        b) "My trained model"   - a small TensorFlow.js neural network that
                                  YOU train with your own webcam samples.
   4. A gesture must stay the same for a few frames before it is accepted.
      This stops flickering. Then the text is sent to the page (onRecognized).

   Nothing is faked: if no hand is visible, nothing is recognised.

   Props:
     onRecognized(text) - called when a gesture is recognised
     showTrainer        - show the "Train your own gestures" panel
   ===================================================================== */

// MediaPipe files are downloaded from a CDN the first time the camera starts.
// (The WASM version must match the npm package version in package.json.)
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// Names used to save things in the browser (LocalStorage)
const MODEL_KEY = "localstorage://signbridge-gesture-model";
const LABELS_KEY = "signbridge-gesture-labels";
const SAMPLES_KEY = "signbridge-gesture-samples";
const MODE_KEY = "signbridge-sign-mode";
const SPEAK_KEY = "signbridge-speak"; // "off" when the user mutes the voice

const STABLE_FRAMES = 8; // a gesture must last this many frames to be accepted
const MIN_CONFIDENCE = 0.85; // the trained model must be at least 85% sure
const RECORD_COUNT = 40; // samples recorded per button press
const MIN_SAMPLES = 20; // minimum samples per gesture for training
const EPOCHS = 40; // how many times the model studies the data

// The gestures that the built-in (rule based) mode understands
const RULE_GESTURES = [
  { label: "Open palm", emoji: "✋" },
  { label: "Fist", emoji: "✊" },
  { label: "Peace", emoji: "✌️" },
  { label: "Thumbs up", emoji: "👍" },
  { label: "I love you", emoji: "🤟" },
];

/* ---------------------------------------------------------------------
   Hand geometry helpers (plain JavaScript, easy to test)
   --------------------------------------------------------------------- */

// Distance between two landmark points
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

// MediaPipe gives x and y as 0..1 of the picture width / height.
// A wide picture would stretch distances, so we multiply x and z by the
// aspect ratio (width / height). Then all distances are "square".
export function toSquarePoints(landmarks, aspect = 1) {
  return landmarks.map((p) => ({ x: p.x * aspect, y: p.y, z: (p.z || 0) * aspect }));
}

// Rule based classifier. Returns a gesture name, or "" if nothing matches.
// Landmark numbers: 0 wrist, 4 thumb tip, 8 index tip, 12 middle tip,
// 16 ring tip, 20 pinky tip (each finger: tip, DIP, PIP, MCP going down).
export function classifyWithRules(pts) {
  const handSize = dist(pts[0], pts[9]); // wrist to middle-finger base
  if (!handSize) return "";

  // A finger is "up" when its tip is farther from the wrist than its middle joint.
  const isUp = (tip, pip) => dist(pts[tip], pts[0]) > dist(pts[pip], pts[0]);
  const index = isUp(8, 6);
  const middle = isUp(12, 10);
  const ring = isUp(16, 14);
  const pinky = isUp(20, 18);

  // The thumb is "out" when it is away from the palm
  const thumbOut = dist(pts[4], pts[5]) > handSize * 0.6 && dist(pts[4], pts[17]) > dist(pts[3], pts[17]);
  // "Thumb up" = thumb out AND its tip is clearly higher than all four knuckles
  const highestKnuckle = Math.min(pts[5].y, pts[9].y, pts[13].y, pts[17].y);
  const thumbPointsUp = thumbOut && pts[4].y < highestKnuckle - handSize * 0.2;

  if (index && middle && ring && pinky) return "Open palm";
  if (index && pinky && !middle && !ring && thumbOut) return "I love you";
  if (index && middle && !ring && !pinky) return "Peace";
  if (!index && !middle && !ring && !pinky) {
    if (thumbPointsUp) return "Thumbs up";
    if (!thumbOut) return "Fist";
  }
  return "";
}

// Turn the 21 points into 63 numbers for the neural network.
// We move the wrist to (0,0,0) and divide by the hand size, so the numbers
// do not depend on where the hand is or how close it is to the camera.
export function toFeatures(pts) {
  const size = dist(pts[0], pts[9]) || 1;
  const out = [];
  for (const p of pts) {
    out.push((p.x - pts[0].x) / size, (p.y - pts[0].y) / size, (p.z - pts[0].z) / size);
  }
  return out;
}

/* ---------------------------------------------------------------------
   TensorFlow.js: train a small neural network on the recorded samples
   --------------------------------------------------------------------- */
async function trainGestureModel(tf, samples, onEpoch) {
  const labels = Object.keys(samples);

  // Put all samples in one list and shuffle it
  const rows = [];
  labels.forEach((label, index) => samples[label].forEach((features) => rows.push({ features, index })));
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  const xs = tf.tensor2d(rows.map((r) => r.features)); // inputs: 63 numbers per sample
  const ys = tf.oneHot(tf.tensor1d(rows.map((r) => r.index), "int32"), labels.length); // answers

  // A small network: 63 inputs -> 32 -> 16 -> one output per gesture
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [63], units: 32, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: labels.length, activation: "softmax" }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: "categoricalCrossentropy", metrics: ["accuracy"] });

  const history = await model.fit(xs, ys, {
    epochs: EPOCHS,
    batchSize: 16,
    validationSplit: 0.2, // 20% of the samples are used only for checking accuracy
    callbacks: {
      onEpochEnd: async (epoch) => {
        onEpoch(epoch + 1);
        await tf.nextFrame(); // let the page update the progress text
      },
    },
  });
  xs.dispose();
  ys.dispose();

  const valAcc = history.history.val_acc || history.history.val_accuracy || [];
  return { model, accuracy: valAcc.length ? valAcc[valAcc.length - 1] : null };
}

// Read how many samples each gesture has
function countSamples(samples) {
  const counts = {};
  Object.keys(samples).forEach((label) => (counts[label] = samples[label].length));
  return counts;
}

// Translate browser camera errors into friendly messages
function friendlyError(err) {
  const name = err?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera permission was denied. Click the camera icon in the address bar, allow access, then press Start camera again.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is being used by another app. Close that app and try again.";
  return err?.message || "Could not start the camera.";
}

/* =====================================================================
   The component
   ===================================================================== */
export default function SignRecognition({ onRecognized, showTrainer = false }) {
  // ----- refs: values that must survive re-renders but do not need to redraw the page -----
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // the camera stream
  const landmarkerRef = useRef(null); // MediaPipe hand detector
  const drawingRef = useRef(null); // draws the hand skeleton
  const visionRef = useRef(null); // the MediaPipe module
  const tfRef = useRef(null); // the TensorFlow.js module
  const modelRef = useRef(null); // the trained TensorFlow.js model
  const labelsRef = useRef([]); // gesture names of the trained model
  const samplesRef = useRef({}); // recorded training samples
  const recordRef = useRef({ label: "", remaining: 0, tick: 0 });
  const rafRef = useRef(null); // animation frame id
  const sessionRef = useRef(0); // changes every Start/Stop (to cancel old work)
  const lastVideoTimeRef = useRef(-1);
  const candidateRef = useRef(null); // gesture seen in the latest frames
  const countRef = useRef(0); // how many frames in a row we saw it
  const lastSentRef = useRef(""); // last gesture sent to the page
  const confidenceRef = useRef(0);
  const modeRef = useRef("rules");
  const speakOnRef = useRef(true); // speak gestures aloud?
  const onRecognizedRef = useRef(onRecognized);

  // ----- state: values that redraw the page when they change -----
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [display, setDisplay] = useState({ text: "Camera is off", percent: null });
  const [mode, setMode] = useState("rules"); // "rules" or "model"
  const [speakOn, setSpeakOn] = useState(true);
  const [speakSupported, setSpeakSupported] = useState(true);
  const [tfReady, setTfReady] = useState(false);
  const [trainedLabels, setTrainedLabels] = useState([]);
  const [counts, setCounts] = useState({});
  const [labelInput, setLabelInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState("");

  // Always keep the newest callback
  useEffect(() => {
    onRecognizedRef.current = onRecognized;
  });

  // Text-to-speech setup: is the speaker voice available? Was it muted earlier?
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSpeakSupported(false);
      return;
    }
    try {
      if (localStorage.getItem(SPEAK_KEY) === "off") {
        speakOnRef.current = false;
        setSpeakOn(false);
      }
    } catch {}
    return () => window.speechSynthesis.cancel();
  }, []);

  // When the component loads: read saved samples, model names and mode from LocalStorage
  useEffect(() => {
    try {
      const samples = JSON.parse(localStorage.getItem(SAMPLES_KEY) || "{}");
      samplesRef.current = samples;
      setCounts(countSamples(samples));
      const labels = JSON.parse(localStorage.getItem(LABELS_KEY) || "[]");
      labelsRef.current = labels;
      setTrainedLabels(labels);
      if (localStorage.getItem(MODE_KEY) === "model" && labels.length) {
        modeRef.current = "model";
        setMode("model");
      }
    } catch {}

    // When the user leaves the page: stop the camera and free memory
    return () => {
      sessionRef.current += 1;
      releaseCamera();
      modelRef.current?.dispose();
    };
  }, []);

  /* ---------------- start / stop camera ---------------- */

  async function startCamera() {
    setError("");
    setLoading(true);
    setLoadingText("Waiting for camera permission...");
    const session = ++sessionRef.current;

    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("The camera only works on https:// pages or http://localhost.");
      }

      // 1) Ask for the camera (the browser shows the permission pop-up)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop()); // user pressed Stop meanwhile
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 2) Load MediaPipe + TensorFlow.js (only now, so other pages stay fast)
      setLoadingText("Loading hand detection model...");
      await loadLibraries();
      if (session !== sessionRef.current) return;

      // 3) Start the detection loop
      lastVideoTimeRef.current = -1;
      resetStability();
      setDisplay({ text: "No hand detected", percent: null });
      setRunning(true);
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      if (session !== sessionRef.current) return;
      setError(friendlyError(err));
      releaseCamera();
      setRunning(false);
    } finally {
      if (session === sessionRef.current) setLoading(false);
    }
  }

  async function loadLibraries() {
    try {
      if (!visionRef.current) visionRef.current = await import("@mediapipe/tasks-vision");
      if (!tfRef.current) {
        const tf = await import("@tensorflow/tfjs");
        // Our network is tiny, so the CPU is fast enough and starts instantly
        try {
          await tf.setBackend("cpu");
        } catch {}
        await tf.ready();
        tfRef.current = tf;
        setTfReady(true);
      }
      if (!landmarkerRef.current) {
        const { FilesetResolver, HandLandmarker, DrawingUtils } = visionRef.current;
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        const create = (delegate) =>
          HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
            runningMode: "VIDEO",
            numHands: 1,
          });
        try {
          landmarkerRef.current = await create("GPU");
        } catch {
          landmarkerRef.current = await create("CPU"); // some computers have no GPU support
        }
        drawingRef.current = new DrawingUtils(canvasRef.current.getContext("2d"));
      }
    } catch (err) {
      console.error("SignBridge: could not load MediaPipe / TensorFlow.js", err);
      throw new Error("Could not load the hand-detection model. Please check your internet connection (it is downloaded once from a CDN) and try again.");
    }

    // Load the model the user trained earlier (if there is one)
    if (!modelRef.current && labelsRef.current.length) {
      try {
        modelRef.current = await tfRef.current.loadLayersModel(MODEL_KEY);
      } catch {
        modelRef.current = null;
      }
    }
  }

  // Stop the camera and free everything the camera was using
  function releaseCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    try {
      landmarkerRef.current?.close();
    } catch {}
    landmarkerRef.current = null;
    drawingRef.current = null;
    recordRef.current = { label: "", remaining: 0, tick: 0 };
  }

  function stopCamera() {
    sessionRef.current += 1; // cancels a start that is still loading
    window.speechSynthesis?.cancel();
    releaseCamera();
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    resetStability();
    setRunning(false);
    setLoading(false);
    setRecording(false);
    setDisplay({ text: "Camera is off", percent: null });
  }

  /* ---------------- speak the gesture aloud (speaker) ---------------- */

  // Uses the browser's SpeechSynthesis (text-to-speech) to read the text out loud.
  function speak(text) {
    if (!speakOnRef.current || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // stop an older sentence so the newest gesture is spoken at once
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    // Remember when we stopped talking, so the microphone does not caption our own voice
    utterance.onend = utterance.onerror = () => {
      window.signbridgeLastSpoken = Date.now();
    };
    synth.speak(utterance);
  }

  function toggleSpeak() {
    const next = !speakOnRef.current;
    speakOnRef.current = next;
    setSpeakOn(next);
    try {
      localStorage.setItem(SPEAK_KEY, next ? "on" : "off");
    } catch {}
    if (next) speak("Voice on"); // also proves the speaker works
    else window.speechSynthesis?.cancel();
  }

  function resetStability() {
    candidateRef.current = null;
    countRef.current = 0;
    lastSentRef.current = "";
  }

  /* ---------------- the detection loop (runs for every video frame) ---------------- */

  function detectLoop() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) return;

    // Only work when the camera has produced a NEW frame
    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      try {
        const result = landmarker.detectForVideo(video, performance.now());
        drawHand(result);
        processResult(result, video);
      } catch (err) {
        console.error("SignBridge: detection stopped", err);
        setError("Hand detection stopped unexpectedly. Please press Start camera again.");
        stopCamera();
        return;
      }
    }
    rafRef.current = requestAnimationFrame(detectLoop);
  }

  // Draw the hand skeleton on top of the video
  function drawHand(result) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const drawing = drawingRef.current;
    if (!canvas || !drawing) return;
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    for (const hand of result.landmarks || []) {
      drawing.drawConnectors(hand, visionRef.current.HandLandmarker.HAND_CONNECTIONS, { color: "#BDA9E8", lineWidth: 4 });
      drawing.drawLandmarks(hand, { color: "#FFFFFF", radius: 4 });
    }
  }

  // Decide which gesture (if any) the current frame shows
  function processResult(result, video) {
    const hand = result.landmarks?.[0];
    if (!hand) {
      handleLabel("", false);
      return;
    }
    const pts = toSquarePoints(hand, video.videoWidth / video.videoHeight);

    if (recordRef.current.remaining > 0) collectSample(pts); // training mode

    let label = "";
    confidenceRef.current = 0;
    const tf = tfRef.current;
    if (modeRef.current === "model" && modelRef.current && tf) {
      // ---- TensorFlow.js classification ----
      const input = tf.tensor2d([toFeatures(pts)]);
      const output = modelRef.current.predict(input);
      const probabilities = output.dataSync();
      input.dispose();
      output.dispose();
      let best = 0;
      probabilities.forEach((p, i) => {
        if (p > probabilities[best]) best = i;
      });
      if (probabilities[best] >= MIN_CONFIDENCE) {
        label = labelsRef.current[best] || "";
        confidenceRef.current = probabilities[best];
      }
    } else {
      // ---- rule based classification ----
      label = classifyWithRules(pts);
    }
    handleLabel(label, true);
  }

  // A gesture must be seen for several frames in a row before we accept it
  function handleLabel(label, handVisible) {
    if (label !== candidateRef.current) {
      candidateRef.current = label;
      countRef.current = 1;
      return;
    }
    countRef.current += 1;
    if (countRef.current < STABLE_FRAMES) return;

    const percent = confidenceRef.current ? Math.round((confidenceRef.current * 100) / 5) * 5 : null;
    const text = label || (handVisible ? "Hand detected - gesture not recognised" : "No hand detected");
    setDisplay((old) => (old.text === text && old.percent === percent ? old : { text, percent }));

    if (label && label !== lastSentRef.current) {
      lastSentRef.current = label;
      onRecognizedRef.current?.(label); // send the text to the page
      speak(label); // and say it out loud
    }
    if (!label) lastSentRef.current = ""; // hand lowered: the same gesture can be sent again
  }

  /* ---------------- training your own gestures ---------------- */

  function saveSamples() {
    try {
      localStorage.setItem(SAMPLES_KEY, JSON.stringify(samplesRef.current));
    } catch {
      setTrainMessage("Browser storage is full - samples were not saved.");
    }
  }

  // Called for frames while recording. Takes one sample every 3rd frame.
  function collectSample(pts) {
    const rec = recordRef.current;
    rec.tick += 1;
    if (rec.tick % 3 !== 0) return;
    const sample = toFeatures(pts).map((n) => Math.round(n * 10000) / 10000);
    samplesRef.current[rec.label] = [...(samplesRef.current[rec.label] || []), sample];
    rec.remaining -= 1;
    setCounts(countSamples(samplesRef.current));
    if (rec.remaining === 0) {
      saveSamples();
      setRecording(false);
      setTrainMessage(`Recorded "${rec.label}". Add more gestures, then press Train model.`);
    }
  }

  function startRecording() {
    const label = labelInput.trim();
    if (!label) return setTrainMessage("Type a gesture name first, for example: Hello");
    if (!running) return setTrainMessage("Start the camera first.");
    recordRef.current = { label, remaining: RECORD_COUNT, tick: 0 };
    setRecording(true);
    setTrainMessage(`Recording "${label}" - slowly move and turn your hand a little...`);
  }

  function removeGesture(label) {
    delete samplesRef.current[label];
    saveSamples();
    setCounts(countSamples(samplesRef.current));
  }

  async function trainNow() {
    const tf = tfRef.current;
    if (!tf) return setTrainMessage("Press Start camera once so TensorFlow.js can load.");
    const labels = Object.keys(samplesRef.current).filter((l) => samplesRef.current[l].length >= MIN_SAMPLES);
    if (labels.length < 2) return setTrainMessage(`Record at least 2 different gestures with ${MIN_SAMPLES}+ samples each.`);

    setTraining(true);
    try {
      const data = {};
      labels.forEach((l) => (data[l] = samplesRef.current[l]));
      const { model, accuracy } = await trainGestureModel(tf, data, (e) => setTrainMessage(`Training... step ${e} of ${EPOCHS}`));
      await model.save(MODEL_KEY); // saves the model in LocalStorage
      localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
      modelRef.current?.dispose();
      modelRef.current = model;
      labelsRef.current = labels;
      setTrainedLabels(labels);
      changeMode("model");
      const accText = accuracy === null ? "" : ` Test accuracy: ${Math.round(accuracy * 100)}%.`;
      setTrainMessage(`Done! The model now knows ${labels.length} gestures.${accText}`);
    } catch (err) {
      setTrainMessage("Training failed: " + (err?.message || "unknown error"));
    } finally {
      setTraining(false);
    }
  }

  function deleteEverything() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("tensorflowjs_models/signbridge-gesture-model"))
      .forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(LABELS_KEY);
    localStorage.removeItem(SAMPLES_KEY);
    modelRef.current?.dispose();
    modelRef.current = null;
    labelsRef.current = [];
    samplesRef.current = {};
    setTrainedLabels([]);
    setCounts({});
    changeMode("rules");
    setTrainMessage("Trained model and samples deleted.");
  }

  function changeMode(next) {
    modeRef.current = next;
    setMode(next);
    resetStability();
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {}
  }

  /* ---------------- what the user sees ---------------- */

  const hasModel = trainedLabels.length > 0;
  const recognised = display.text !== "Camera is off" && !display.text.startsWith("No hand") && !display.text.startsWith("Hand detected");
  const trainableCount = Object.values(counts).filter((n) => n >= MIN_SAMPLES).length;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Sign gesture recognition</h2>
          <p className="muted text-sm">Webcam + MediaPipe hand tracking + TensorFlow.js.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={startCamera} disabled={running || loading} className="btn-primary">
            <Camera size={17} /> {loading ? "Starting..." : "Start camera"}
          </button>
          <button onClick={stopCamera} disabled={!running && !loading} className="btn-secondary">
            <CameraOff size={17} /> Stop camera
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="error-box mt-4">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Webcam preview with the hand drawn on top (mirrored like a mirror) */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          {!running && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/85 p-4 text-center text-sm text-fog">
              {loading ? loadingText : "Camera preview appears here"}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="well flex flex-col justify-center p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/70 dark:text-fog">Detected gesture</p>
          <p
            aria-live="polite"
            className={`mt-2 font-extrabold ${recognised ? "font-display text-4xl text-ink dark:text-white" : "text-xl text-ink/70 dark:text-fog"}`}
          >
            {display.text}
          </p>
          {display.percent !== null && recognised && <p className="muted mt-1 text-sm">Model confidence: about {display.percent}%</p>}

          {speakSupported ? (
            <button
              onClick={toggleSpeak}
              aria-pressed={speakOn}
              className={`mt-4 inline-flex w-fit items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold ${speakOn ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-white text-ink dark:bg-ink-soft dark:text-fog"}`}
            >
              {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {speakOn ? "Speaking gestures aloud" : "Voice is off"}
            </button>
          ) : (
            <p className="muted mt-4 text-xs">Speaking aloud is not supported in this browser.</p>
          )}

          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink/70 dark:text-fog">Recognition method</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Recognition method">
            <button
              onClick={() => changeMode("rules")}
              aria-pressed={mode === "rules"}
              className="toggle"
            >
              Built-in gestures
            </button>
            <button
              onClick={() => changeMode("model")}
              disabled={!hasModel}
              aria-pressed={mode === "model"}
              className="toggle"
            >
              My trained model
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-ink dark:text-fog">
            {mode === "model" && hasModel ? (
              <>Using your TensorFlow.js model. It knows: <strong>{trainedLabels.join(", ")}</strong>.</>
            ) : (
              <>Supported gestures:</>
            )}
          </p>
          {mode === "rules" && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {RULE_GESTURES.map((g) => (
                <li key={g.label} className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium dark:bg-ink-soft">
                  <span aria-hidden="true">{g.emoji}</span> {g.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ---------- Trainer ---------- */}
      {showTrainer && (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-fog p-4 dark:border-fog">
          <h3 className="flex items-center gap-2 font-bold">
            <Brain size={18} className="text-ink/70 dark:text-fog" /> Train your own gestures (TensorFlow.js)
          </h3>
          <p className="muted mt-1 text-sm leading-6">
            1) Start the camera. 2) Type a gesture name, show it to the camera and press Record. 3) Record at least two different gestures. 4) Press Train model.
            Everything stays in your browser.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Gesture name, e.g. Hello"
              aria-label="Gesture name"
              maxLength={30}
              className="field !w-auto min-w-0 flex-1 sm:max-w-xs"
            />
            <button onClick={startRecording} disabled={!running || recording || training} className="btn-secondary">
              <CircleDot size={17} className={recording ? "animate-pulse text-red-500" : "text-red-500"} />
              {recording ? "Recording..." : `Record ${RECORD_COUNT} samples`}
            </button>
            <button onClick={trainNow} disabled={!tfReady || training || recording || trainableCount < 2} className="btn-primary">
              <Brain size={17} /> {training ? "Training..." : "Train model"}
            </button>
          </div>

          {Object.keys(counts).length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {Object.entries(counts).map(([label, n]) => (
                <li key={label} className="flex items-center gap-2 rounded-xl bg-fog px-3 py-1.5 text-sm dark:bg-ink">
                  <span className="font-semibold">{label}</span>
                  <span className={n >= MIN_SAMPLES ? "font-semibold text-ink/70 dark:text-fog" : "text-amber-700 dark:text-amber-300"}>{n} samples</span>
                  <button onClick={() => removeGesture(label)} aria-label={`Remove ${label}`} className="text-ink/70 dark:text-fog hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {trainMessage && (
            <p role="status" className="mt-3 text-sm font-semibold text-ink/70 dark:text-fog">
              {trainMessage}
            </p>
          )}
          {(hasModel || Object.keys(counts).length > 0) && (
            <button onClick={deleteEverything} disabled={training} className="mt-3 text-sm font-semibold text-red-600 hover:underline">
              Delete trained model and samples
            </button>
          )}
        </div>
      )}

      <p className="muted mt-4 text-xs leading-5">
        This is a gesture-recognition prototype, not a full sign-language translator. Real sign languages use movement, facial expression and grammar that a few hand shapes cannot capture.
      </p>
    </section>
  );
}

# SignBridge – Sign Language & Speech-to-Text Classroom Assistant

SignBridge helps deaf and hard-of-hearing students follow a lecture.

- **Speech-to-Text:** the teacher speaks, and live captions appear on the screen.
- **Sign recognition:** the webcam finds the hand and recognizes a few supported gestures, which are written as text.
- **Live Classroom:** speech and sign results appear together in one caption panel, with timestamps.

Designed with a calm black, white and grey palette (see section 3b). Built with **Next.js, React, JavaScript, Tailwind CSS, Web Speech API, MediaPipe, TensorFlow.js and LocalStorage**.

---

## 1. What you need

| Item | Details |
|------|---------|
| Node.js | Version 18.18 or newer (20 LTS is best). Download from https://nodejs.org |
| Browser | **Google Chrome** or **Microsoft Edge** (needed for speech recognition) |
| Hardware | A microphone and a webcam |
| Internet | Needed for `npm install`, for the speech service, and once for the MediaPipe hand model |

## 2. Install and run

Open a terminal inside the `signbridge` folder and run:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in Chrome or Edge.
When the browser asks for **microphone** or **camera** permission, click **Allow**.

> The microphone and camera only work on `http://localhost` or on an `https://` website.
> If you open the app with a network address like `http://192.168.x.x:3000`, the browser will block them.

Build the final version (optional):

```bash
npm run build
npm start
```

## 3. Project structure

```text
signbridge/
├── public/
│   └── logo.png               App logo
├── src/
│   ├── app/                   Pages (each folder = one web address)
│   │   ├── layout.js          Wraps every page (navbar, theme)
│   │   ├── globals.css        Palette, buttons, cards, chips (all the custom CSS)
│   │   ├── page.js            Home page          →  /
│   │   ├── dashboard/page.js  Dashboard          →  /dashboard
│   │   ├── speech/page.js     Speech-to-Text     →  /speech
│   │   ├── sign/page.js       Sign Recognition   →  /sign
│   │   ├── classroom/page.js  Live Classroom     →  /classroom
│   │   └── history/page.js    Saved transcripts  →  /history
│   └── components/            Reusable building blocks
│       ├── Navbar.jsx         Top bar, logo, dark/light switch, mobile menu
│       ├── Sidebar.jsx        Dashboard navigation
│       ├── FeatureCard.jsx    Rounded feature card
│       ├── SpeechToText.jsx   Microphone + Web Speech API
│       ├── SignRecognition.jsx  Webcam + MediaPipe + TensorFlow.js
│       └── CaptionBox.jsx     Caption panel + LocalStorage helper functions
├── package.json               Libraries and commands
├── next.config.mjs            Next.js settings
├── tailwind.config.js         Palette colours, fonts, dark mode = "class"
└── postcss.config.mjs         Needed by Tailwind
```

## 3b. Colour palette and design

The site uses three colours, following a 70 / 20 / 10 rule.

| Colour | Hex | Tailwind name | Share | Used for |
|--------|-----|---------------|-------|----------|
| White | `#FFFFFF` | `white` | 70% | Page backgrounds and cards |
| Grey | `#D1D5DB` | `fog` | 20% | Borders, panels and secondary sections |
| Black | `#171717` | `ink` | 10% | Headings, buttons and navigation |

Dark mode flips the same colours: black backgrounds with white and grey text.

Small human touches: warm serif headings (Fraunces), chunky buttons that press down,
slightly tilted cards, a hand-drawn underline on the home page and a soft dotted paper background.
To change a colour, edit it once in `tailwind.config.js` (and the matching hex values in `globals.css`).

## 4. How to use it

1. **Home** – read about the project and press **Get Started**.
2. **Dashboard** – use the three buttons: Start Classroom, Speech-to-Text, Sign Recognition. Your recent transcripts are listed below.
3. **Speech-to-Text** – press **Start recording** and speak. Words appear live; each finished sentence is added to the transcript. Use **A- / A+** to change text size, then **Save**, **Copy**, **Download** or **Clear**.
4. **Sign Recognition** – press **Start camera**, keep one hand in view, and show a gesture.
5. **Live Classroom** – start both the microphone and the camera. Speech (blue label) and sign (purple label) captions share one list with timestamps. Press **Save** to keep the session.
6. **History** – **View**, **Download** or **Delete** saved transcripts. They are stored in your browser (LocalStorage), so no server or login is needed.

## 5. How sign recognition works (simple explanation)

1. The webcam video is read frame by frame.
2. **MediaPipe HandLandmarker** finds the hand and returns **21 points** (wrist, finger joints, finger tips). You can see them drawn on the video.
3. The 21 points are classified in one of two ways. Use the **Recognition method** switch to choose:
   - **Built-in gestures** – simple rules, for example "is each finger up or down?". Supported gestures: ✋ Open palm, ✊ Fist, ✌️ Peace, 👍 Thumbs up, 🤟 I love you.
   - **My trained model** – a small **TensorFlow.js neural network** that you train yourself (see below).
4. A gesture must stay the same for about 8 frames before it is accepted. This stops flickering.
5. The accepted gesture is added to the captions as text **and spoken aloud** through your speaker (browser SpeechSynthesis). Use the green **Speaking gestures aloud** button to turn the voice on or off. Your choice is remembered.

   In the Live Classroom the microphone ignores the app's own voice, so spoken gestures are not captioned twice. For the best result use headphones or keep the volume moderate.

If no hand is visible, nothing is shown. The app never makes up results.

### Train your own gestures with TensorFlow.js

On the **Sign Recognition** page, scroll to **Train your own gestures**:

1. Press **Start camera**.
2. Type a gesture name (for example `Hello`), show the gesture and press **Record 40 samples**. Move and turn your hand slightly while it records.
3. Repeat for at least **two** different gestures (20+ samples each; more is better).
4. Press **Train model**. It takes a few seconds, and the app shows the test accuracy.
5. The app switches to **My trained model** automatically. The model is saved in your browser, so it is still there after you refresh.

The neural network has 63 inputs (21 points × x, y, z), two small hidden layers (32 and 16 neurons) and one output per gesture.

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| "Permission denied" for microphone or camera | Click the lock icon in the address bar → allow → press Start again. |
| Speech recognition not supported | Use Google Chrome or Microsoft Edge. Firefox does not support it. |
| "Cannot reach the speech service" | Check your internet. Chrome sends audio to Google for recognition. |
| "Could not load the hand-detection model" | Check your internet. The MediaPipe model is downloaded once when you first press Start camera. |
| No sound when a gesture is detected | Check the green voice button is on, your speaker volume is up, and the tab is not muted. Use Chrome or Edge. |
| Gesture is not recognized | Use good light, keep one hand fully in view, face the palm to the camera, and keep fingers clearly apart or clearly closed. Or train your own model. |
| Camera or mic blocked on a phone | Use `https://` (for example after deploying) or `localhost`. |

## 7. Test checklist (before your presentation)

- [ ] All links work: Home, Dashboard, Speech, Sign, Classroom, History.
- [ ] Speech: Start → speak → text appears → Copy / Download / Clear work.
- [ ] Sign: Start camera → hand skeleton is drawn → gesture text appears.
- [ ] Classroom: speech and sign captions appear in one list with times.
- [ ] Save a transcript → it shows on Dashboard and History → View and Delete work.
- [ ] Deny the microphone / camera permission once → a clear error message appears.
- [ ] Dark mode switch works; the page looks good at phone width.

## 8. Important limits (be honest in your presentation)

- SignBridge recognizes a **small set of hand shapes**. It is **not** a complete sign-language translator. Real sign languages also use movement, facial expression and grammar.
- The built-in rules were designed for one hand, shown upright to the camera. Accuracy depends on light and camera quality.
- Speech recognition is provided by the browser and usually needs internet. Accuracy depends on the microphone, accent and noise.
- LocalStorage is limited (about 5 MB) and only exists in one browser on one device.

## 9. Ideas for future work

- Add movement-based signs by classifying sequences of frames (for example with an LSTM).
- Train a model on a public sign-language dataset such as ISL or ASL alphabets.
- Add speaker names, translation to other languages, or a teacher / student login.
#   S i g n - B r i d g e  
 
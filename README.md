# ⚡️ TIVE | Adaptive Strength Pro

> **The Progressive Overload Operating System.**

TIVE is a premium, high-performance workout logger designed for serious strength athletes who value data precision and aesthetic excellence. It combines advanced analytics with a distinct **"Tech-Brutalist"** interface, emphasizing focus, efficiency, and mechanical precision.

---

## 🚀 Vision
To become the definitive "Operating System" for strength training—where every rep is logged, every metric is analyzed, and the user experience is as disciplined as the athlete themselves.

## ✨ Key Features

### 🛠 Workout Management (The "Engine")
- **Intelligent Routine Creator:** Build complex workouts with support for supersets, dropsets, and custom groupings.
- **Distraction-Free Player:** Execute sessions with integrated rest timers, RPE logging, and historical context per set.
- **Plate Calculator:** Instant loading visualization for Olympic bars.
- **Immutable History:** A comprehensive, searchable log of every session ever performed.

### 🧪 Performance Lab (Analytics Suite)
- **Volume Load Tracking:** Dynamic visualization of training volume (7D, 30D, 90D) to ensure progressive overload.
- **Muscle Readiness Mapping:** Algorithm-driven recovery scores based on recent volume frequency per muscle group.
- **Volume Distribution:** Radar charts visualizing the balance between Push, Pull, and Leg movements.

### 📸 Progression Tracking
- **Secure Photo Vault:** Private gallery for physique updates stored locally via IndexedDB.
- **Side-by-Side Comparison:** Visual tool to compare progress over time.
- **Biometrics:** Track body weight and key measurements (Chest, Biceps, Waist).

---

## 🏗 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 18](https://reactjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Persistence** | LocalStorage & [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |

---

## 🎨 Design Philosophy: "Tech-Brutalism"
TIVE rejects the "softness" of modern app design in favor of structural clarity and futuristic utility.
- **Palette:** High-contrast Dark Mode (Pure Black #000000, Zinc #09090b).
- **Typography:** Outfit (Headings), Inter (Body), and JetBrains Mono (Data/Tech).
- **Mechanical UX:** Tactile haptic-style transitions, sharp [4px] corners, and grid-based layouts.

---

## 📂 Project Architecture

```bash
src/
├── components/
│   ├── active-session/ # Workout player & Plate calculator
│   ├── analytics/      # Data visualization components
│   ├── dashboard/      # Main entry point & Metrics strip
│   ├── exercise/       # Exercise cards & Picker logic
│   ├── history/        # History logs & Session cards
│   ├── plan-manager/   # Routine management
│   └── ui/             # Atomic design tokens (Buttons, Cards)
├── hooks/              # Custom logic (Physiology, Stopwatches)
├── store/              # Zustand global state slices
├── types/              # Strict TypeScript definitions
└── utils/              # Pure functions (Volume engine, Analytics)
```

---

## 🛠 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/tive.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (configured for Port 5500):
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## 🛡 Security & Privacy
- **Local-First:** Your training data belongs to you. All logs and photos are stored strictly on your device.
- **Offline Capable:** Log your sessions anywhere, regardless of internet connectivity.
- **Private by Design:** No tracking, no unwanted cloud uploads.

---
*Created with focus and precision. Stay Strong.*

# DigitMath 🔢

A fun math equation-building game for elementary and middle school kids. Each round, players are given N single-digit numbers and must arrange them with arithmetic operators to form a valid equation (e.g. `7 − 4 = 6 ÷ 2`).

**Supports:** Single Player · Local Multiplayer · Easy / Medium / Hard · Android · iOS

---

## Running the App

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

---

### Option 1: Run in the Browser (Quickest)

```bash
# 1. Navigate to the project folder
cd digitmath

# 2. Install dependencies (first time only)
npm install

# 3. Start the development server
npm run dev
```

Open your browser and go to **http://localhost:5173**.

To test on your phone over Wi-Fi (phone and computer on the same network):
```bash
npm run dev -- --host
```
Then open the **Network** URL shown (e.g. `http://192.168.1.x:5173`) on your phone's browser. You can also tap **"Add to Home screen"** in Chrome to install it like an app.

---

### Option 2: Build and Install on Android (via Android Studio)

> **Prerequisite:** Install [Android Studio](https://developer.android.com/studio) on your machine.

```bash
# 1. Build the production web bundle and sync to Android
npm run build
npx cap sync
```

Then:
1. Open **Android Studio** and select **Open Project → digitmath/android/**
2. Click **Sync Now** when prompted (or the Gradle sync elephant icon)
3. Enable **USB Debugging** on your Android phone:
   - *Settings → About Phone → tap Build Number 7 times*
   - *Settings → System → Developer Options → USB Debugging: ON*
4. Connect your phone via USB and allow the debug prompt on your phone
5. Select your phone in the device dropdown in Android Studio
6. Click the green **Play ▶** button

Android Studio will build, install, and launch the app on your phone automatically.

> **WSL users:** If Android Studio cannot write to the WSL filesystem, copy the entire `digitmath` folder to your Windows drive (e.g. `C:\Users\You\Documents\digitmath`) and open that copy in Android Studio.

#### Troubleshooting: Duplicate Kotlin class error

If you see `Duplicate class kotlin.collections.jdk8...` errors, add this to the `allprojects {}` block in `android/build.gradle`:

```gradle
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
    }
}
```

Then click **Sync Now** in Android Studio and rebuild.

---

### Option 3: Build for iOS (via Xcode, macOS only)

```bash
npm run build
npx cap sync
npx cap open ios
```

Xcode will open the project. Select your device and click **Run ▶**.

---

## Game Rules

### Single Player
- 10 rounds per session
- **+10 points** for each correct equation
- **Time penalty** at the end: `floor(total seconds / 10)` subtracted from your score
- You can **Skip** any round (no penalty, no points)

### Multiplayer (2–4 players)
- 10 rounds per player per session (players alternate; total rounds = 10 × players)
- Players take hot-seat turns on the same device
- **+10 × multiplier** points per correct answer
- If a player **Skips**, the same puzzle passes to the next player with **doubled points** (2×, 4×, ...)
- **Time penalty tracked individually** — the penalty ticker shows only the current player's accumulated time during their turn
- Each player's penalty = `floor(their total turn seconds / 10)`, deducted from their score at the end
- Leaderboard shows base score, penalty, and **net score** per player

### Difficulty
| Level | Numbers given |
|-------|--------------|
| Easy | 4 numbers |
| Medium | 5 numbers |
| Hard | 6 numbers |

---

## Development

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build production bundle to dist/
npx cap sync       # Sync built web assets to Android & iOS
npx cap open android   # Open Android Studio
npx cap open ios       # Open Xcode (macOS only)
```

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for full technical details.

---

## Repository

**GitHub:** https://github.com/tantatkee/digitmath

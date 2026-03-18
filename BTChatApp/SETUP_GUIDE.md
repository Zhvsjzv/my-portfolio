# BT Chat — Complete Setup & APK Build Guide

> **Framework:** React Native (Bare CLI) + `react-native-bluetooth-classic`
> **Target:** Android (Bluetooth Classic / SPP Profile)
> **Works on:** Vivo V30, any Android 6.0+ phone

---

## Prerequisites (install once)

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 LTS+ | https://nodejs.org |
| JDK | 17 (Temurin) | https://adoptium.net |
| Android Studio | Latest | https://developer.android.com/studio |
| React Native CLI | Latest | `npm install -g react-native-cli` |

---

## Step 1 — Android Studio Setup

1. Open Android Studio → **SDK Manager**
2. Install **Android SDK Platform 34**
3. Install **Android SDK Build-Tools 34.0.0**
4. Install **NDK 25.1.8937393** (SDK Manager → SDK Tools → NDK side by side)
5. Set environment variables in your system:
   ```
   ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
   Path += %ANDROID_HOME%\platform-tools
   Path += %ANDROID_HOME%\tools
   ```

---

## Step 2 — Install Dependencies

```bash
# Navigate to project folder
cd "BTChatApp"

# Install all npm packages
npm install

# Link native modules (React Native 0.73 uses autolinking — no manual link needed)
# Just verify by running:
npx react-native doctor
```

---

## Step 3 — Run on Physical Device (USB Debug)

> **Do NOT use an emulator** — emulators don't have real Bluetooth hardware.

```bash
# 1. Enable Developer Options on your Vivo V30:
#    Settings → About Phone → tap "Build Number" 7 times
#    Settings → Developer Options → Enable USB Debugging

# 2. Connect phone via USB, verify it appears:
adb devices

# 3. Start Metro bundler in one terminal:
npx react-native start

# 4. In another terminal, build & install debug APK:
npx react-native run-android
```

---

## Step 4 — Build a Standalone APK (to share / install without USB)

```bash
cd android

# Build release APK (uses debug keystore — fine for testing)
./gradlew assembleRelease

# --- On Windows, use: ---
gradlew.bat assembleRelease
```

APK location: `android\app\build\outputs\apk\release\app-release.apk`

Copy this file to BOTH phones and install it (enable "Install from unknown sources").

---

## Step 5 — First-Time Bluetooth Pairing (before using the app)

This only needs to be done ONCE per pair of phones:

1. On **Phone A** → Android Settings → Bluetooth → Turn ON → **Make Visible**
2. On **Phone B** → Android Settings → Bluetooth → Scan → Select Phone A → **Pair**
3. Accept pairing code on both phones

After pairing, launch the app:
- **Phone A** taps **"Be Host"** (waits for connection)
- **Phone B** taps **"Scan"** → selects Phone A → **connects**
- Chat begins!

---

## How the App Works

```
Phone A (Host/Server)          Phone B (Client)
      │                               │
      │  [Be Host] → acceptConnection │
      │                               │  [Scan] → find devices
      │                               │  [Tap Device A] → connectToDevice
      │◄─────── BT Classic SPP ──────►│
      │                               │
      │  Send/Receive messages        │  Send/Receive messages
      │  (no internet, no server)     │  (no internet, no server)
```

---

## Project File Structure

```
BTChatApp/
├── index.js                    # App entry point
├── app.json                    # App name config
├── package.json                # Dependencies
├── babel.config.js
├── tsconfig.json
├── android/
│   ├── build.gradle            # Root Gradle config
│   └── app/
│       ├── build.gradle        # App-level Gradle config
│       └── src/main/
│           └── AndroidManifest.xml  # BT permissions
└── src/
    ├── App.tsx                 # Root component
    ├── theme/
    │   └── colors.ts           # Design tokens (glassmorphism)
    ├── navigation/
    │   └── AppNavigator.tsx    # Stack navigation
    ├── services/
    │   └── BluetoothService.ts # All BT logic (singleton)
    └── screens/
        ├── HomeScreen.tsx      # Landing / splash
        ├── ScanScreen.tsx      # Device discovery
        └── ChatScreen.tsx      # P2P chat UI
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `adb devices` shows nothing | Enable USB Debugging, try another cable |
| Build fails: SDK not found | Set ANDROID_HOME env variable |
| `react-native doctor` errors | Follow each doctor recommendation |
| Can't find devices in scan | Ensure Location is ON (Android <12 requirement for BT scan) |
| Connection refused | Make sure one phone is in "Be Host" mode first |
| APK won't install | Enable "Install from unknown sources" in phone security settings |
| Keyboard hides input | Already handled with `KeyboardAvoidingView` + `adjustResize` |

---

## Notes

- **Bluetooth Classic (SPP)** is used — better range and speed than BLE for chat.
- Messages use `\n` as delimiter — reliable framing over the serial stream.
- The app works completely offline; zero data leaves the phones.
- Tested design: dark glassmorphism with purple/cyan accent (Vivo V30 AMOLED looks great).

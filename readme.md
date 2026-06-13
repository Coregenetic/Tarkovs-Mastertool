# Tarkov Mastertool

<p align="center">
  <img src="assets/icon.png" width="80" alt="Tarkov Mastertool">
</p>

<p align="center">
  <strong>Your all-in-one Escape from Tarkov companion app</strong><br>
  Track Flea Market sales, raids, quests, hideout progress and more — locally, without any account.
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/Coregenetic/Tarkovs-Mastertool?style=flat-square&color=e91e8c" alt="Release">
  <img src="https://img.shields.io/github/downloads/Coregenetic/Tarkovs-Mastertool/total?style=flat-square&color=7c5cfc" alt="Downloads">
  <img src="https://img.shields.io/badge/platform-Windows-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/EFT-PvE%20%7C%20PvP-green?style=flat-square" alt="Game Mode">
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| 💰 **Flea Market** | Automatic sale tracking from EFT logs. Live area chart, daily stats, streak counter, item thumbnails. |
| ⚔️ **Raid Tracker** | Detects raid start/end from logs. Map tracking, survival rate ring, status modal (Survived/KIA/Run Through/MIA). |
| 📋 **Quest Tracker** | 490+ quests from tarkov.dev with Kappa & Lightkeeper filters. Auto-resolve prerequisites. Locally saved. |
| 🏠 **Hideout** | Track all hideout stations with level buttons. Progress cached from tarkov.dev. |
| 📊 **Stats** | Combined view of Flea, Raid and Quest stats. Manual initial values supported. |
| 🎯 **Overview** | Daily dashboard with 2×2 grid — Flea mini-chart, survival ring, quest progress, hideout status. |

---

## Installation

1. Go to the [Releases](https://github.com/Coregenetic/Tarkovs-Mastertool/releases/latest) page
2. Download `Tarkov.Mastertool.Setup.exe`
3. Run the installer
4. Launch **Tarkov Mastertool** from your desktop

> **Note:** Windows may show a SmartScreen warning since the app is not code-signed. Click "More info" → "Run anyway".

---

## Setup

On first launch, the **Onboarding Wizard** will guide you through:

1. **Language** — English or Deutsch
2. **Character Name** — your in-game PMC name
3. **Game Mode** — PvE / PvP / Arena
4. **EFT Log Path** — auto-detected or enter manually
5. **Accent Color** — choose your style

### Log Path

The app reads your EFT log files to track sales and raids. Default locations:

```
C:\Battlestate Games\Escape from Tarkov\Logs
D:\Battlestate Games\Escape from Tarkov\Logs
```

Use **Auto-Detect** in Settings or the Onboarding Wizard.

---

## How it works

### Flea Market
The app watches `push-notifications_000.log` for `RagfairSoldItem` events in real time. Item names and thumbnails are fetched from [tarkov.dev](https://tarkov.dev).

### Raid Tracking
The app watches `application.log` for:
- **Raid Start:** `TRACE-NetworkGameCreate ... Location: <map>`
- **Raid End:** `SelectProfile` after leaving a raid

After each raid, a modal appears asking for the outcome (Survived / KIA / Run Through / MIA).

### Data Storage
All data is stored **locally** on your PC:
```
%APPDATA%\tarkov-mastertool\data\
├── flea_sales_data.json
├── quest_manual.json
├── quest_cache.json
├── hideout_progress.json
├── hideout_cache.json
└── raid_data.json
```

---

## Settings

| Setting | Description |
|---------|-------------|
| Character Name | Displayed in Overview and Stats |
| Game Mode | PvE / PvP / Arena — affects tarkov.dev API queries |
| Log Path | Path to your EFT Logs folder |
| Manual Stats | Enter your existing Level, Kills, Play Time, Raids |
| Accent Color | 6 presets + free color picker |
| Language | English / Deutsch |
| Cloud Sync | Optional GitHub Gist backup for quest progress |

---

## Auto-Update

The app checks for updates on launch. When an update is available, a notification appears in the status bar. Click to install — no manual download needed.

---


## Credits

- [tarkov.dev](https://tarkov.dev) — Free community API for items, quests and hideout data
- [TarkovMonitor](https://github.com/the-hideout/TarkovMonitor) — Log parsing reference
- [Tabler Icons](https://tabler.io/icons) — UI icons

---

## License

MIT — made by [Coregenetic](https://github.com/Coregenetic)

> *This project is not affiliated with Battlestate Games.*
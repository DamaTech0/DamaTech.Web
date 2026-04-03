# DamaTech Web — User Manual

Frontend for the DamaTech Digital Signage platform. Built with React 18, TypeScript, and Vite.

---

## Running locally (with the API)

You need **three things** running at the same time: the API, Azurite (blob storage), and the web app.

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- Azurite installed: `npm install -g azurite`

---

### Step 1 — Start Azurite (blob storage emulator)

Open a terminal and run:

```bash
azurite
```

Leave it running. It listens on ports 10000–10002.

---

### Step 2 — Start the API

Open a second terminal, from the **DamaTech.API** repo:

```bash
cd /path/to/DamaTech.API
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/DamaTech.API
```

The API will be available at `http://localhost:5000`.

> The `ASPNETCORE_ENVIRONMENT=Development` flag enables Swagger UI at `http://localhost:5000/swagger`.

---

### Step 3 — Start the web app

Open a third terminal, from **this repo**:

```bash
npm install       # first time only
npm run dev
```

Open your browser at: **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to `http://localhost:5000` automatically — no CORS issues.

---

## Pages

### Login / Register (`/`)

- Enter your email and password and click **Sign in** or **Create account**.
- Your session is stored in localStorage (token survives page refresh).
- Click the tab at the top of the form to switch between login and register.

---

### Dashboard (`/dashboard`)

An overview of your signage network:

- **Total Devices** — how many screens are paired to your account
- **Media Files** — total count and storage used
- **Schedules** — total count and how many are currently active
- **Online Now** — screens that sent a heartbeat in the last 10 minutes

Click any stat card to navigate to that section. The two panels below show your most recent devices and media files.

---

### Devices (`/devices`)

Manage your physical screens.

**Adding a device:**
1. Click **＋ Add device**
2. A 6-digit pairing code appears — it's valid for 15 minutes
3. On your player device, enter this code when prompted
4. The device appears in your list once paired

**Device card shows:**
- Name and UUID (truncated)
- Online / Offline / Awaiting pair status
- Last heartbeat time

**Actions:**
- ✏️ — Rename the device
- 🗑️ — Delete the device (also deletes all its schedules)

---

### Media (`/media`)

Upload and manage your content files.

**Uploading:**
- Click **↑ Upload** or drag & drop files onto the upload zone
- Supported formats: **JPG**, **PNG**, **MP4**
- Max file size: **100 MB** per file
- Multiple files can be uploaded at once

**Media cards show:**
- File name, type badge (Image / Video), file size
- Duration (for videos)

**Actions:**
- 🗑️ — Delete the file. This will fail if the file is used in an active schedule — remove it from the schedule first.

---

### Schedules (`/schedules`)

Control what content plays on each device and when.

**Creating a schedule:**
1. Click **＋ New schedule**
2. Fill in the schedule name and select a paired device
3. Choose a timezone (the player uses this for time-based playback)
4. Toggle **Active** on to make it live immediately
5. Click **＋ Add item** to add content:
   - **Media file** — pick from your uploaded files
   - **Start time / End time** — time window during the day when this item plays
   - **Duration (sec)** — how many seconds to display this item per rotation
6. Add as many items as needed, then click **Create schedule**

**Schedule row shows:**
- Name, device, timezone, item count, last updated date
- Active / Inactive badge

**Actions:**
- **View** — see schedule details and all items
- **Edit** — modify name, device, items, or status
- **Delete** — permanently removes the schedule and all its items

---

## Signing out

Click the **↩** button at the bottom of the sidebar to sign out. Your token is cleared from localStorage.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| White screen / API errors on login | Make sure the API is running: `ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/DamaTech.API` |
| Media upload fails | Make sure Azurite is running: `azurite` in a separate terminal |
| Device not showing as online | The player must send a heartbeat within the last 10 minutes |
| Can't delete media | Remove it from any active schedule first |
| Pairing code expired | Go to Devices → Add device to generate a new code |

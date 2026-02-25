# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8b18c13a-37a6-4d27-b4de-2da567bf6270

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8b18c13a-37a6-4d27-b4de-2da567bf6270) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Firebase Setup (Motor Monitoring)

The dashboard connects to Firebase Realtime Database for live motor data.

1. **Create `.env`** in `motor-vibe-dashboard/` (copy from `.env.example`):
   ```sh
   cp .env.example .env
   ```

2. **Add your Firebase Web config** to `.env`:
   - Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps
   - Add a Web app or copy the existing config
   - Fill in `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, etc.

3. **Populate data**: Run the Python backend in `motor_backend/` to populate `motor01/logs`. See `FIREBASE_SCHEMA.md` in the project root for the data structure.

4. **Real-time updates (every 20 sec)**: The dashboard only updates when you run the live updater:
   ```bash
   cd motor_backend
   pip install firebase-admin    # if not installed
   python live_updater.py
   ```
   **Keep this terminal open** while viewing the dashboard. It writes to Firebase every 10 seconds.

**Firebase not updating?**
- Run `python motor_backend/test_firebase.py` to verify the connection
- Ensure `live_updater.py` is running (you should see "Updated at ..." every 20 sec in the terminal)
- In [Firebase Console](https://console.firebase.google.com) → Realtime Database, check that `motor01/live_reading` exists and updates
- Database rules: Admin SDK bypasses rules; if using client writes, ensure rules allow read/write

5. **Optional**: Add `motor01/predictive_maintenance` for AI-driven component status.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- Firebase (Realtime Database)
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy on Vercel (frontend + backend on one project)

This repo is set up so **both the dashboard and the Firebase updater** run on Vercel.

1. **Push to GitHub** and import the repo in [Vercel](https://vercel.com) → Add New → Project.

2. **Root Directory**: Set to **`motor-vibe-dashboard`** (or the folder that contains `package.json`, `api/`, and `vercel.json`). If your repo root is the parent of `digtal_twin_final-main`, use **`digtal_twin_final-main/motor-vibe-dashboard`**.

3. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   **Frontend (Firebase client):**
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

   **Backend (serverless API that writes to Firebase):**
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — paste the **entire** contents of your Firebase service account JSON file (one line, no line breaks).
   - `FIREBASE_DATABASE_URL` — e.g. `https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app`

   To get the service account JSON: Firebase Console → Project Settings → Service accounts → Generate new private key. Copy the whole JSON and paste it as the value of `FIREBASE_SERVICE_ACCOUNT_JSON`.

4. **Deploy**. The dashboard is served from the root; the updater runs as **Vercel Cron** every minute (`/api/update-motor`).  
   **Note:** Cron is available on Vercel Pro/Enterprise. On the Hobby plan, use an external cron (e.g. [cron-job.org](https://cron-job.org)) to call `GET https://your-app.vercel.app/api/update-motor` every minute.

5. **Manual trigger:** Open `https://your-app.vercel.app/api/update-motor` in a browser or `curl` to push one update to Firebase.

---

Simply open [Lovable](https://lovable.dev/projects/8b18c13a-37a6-4d27-b4de-2da567bf6270) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

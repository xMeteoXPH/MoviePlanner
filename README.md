# 🎬 Movie Planner

A couples movie & series tracker — built as a static web app, no backend needed.

## Features

- Add movies and series with poster, genre, description, director/studio, and release year
- Track status: **To Watch**, **Currently Watching**, **Watched**
- Log who watched it (Together, solo) and start/finish dates
- 1–5 star ratings and written reviews — one per person, shown side by side
- Sidebar with Quick Stats, Random Pick, Next Up queue, Recently Watched, and Still Waiting reminders
- Two user profiles with custom display names
- Stats page with genre breakdown, rating distributions, and monthly timeline
- Dark mode with muted green accents
- All data stored in `localStorage` — fully offline, no account needed

## How to Use

### Run locally
Just open `index.html` in your browser — no build step, no server needed.

### Deploy to GitHub Pages
1. Push this folder's contents to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main → / (root)**
4. Your site will be live at `https://yourusername.github.io/your-repo-name`

## Switching Users
Click your avatar in the top nav to switch between the two user profiles. Set display names from the Profile page.

## Notes
- Poster images are stored as base64 in `localStorage` — keep images reasonable in size
- Data is per-browser — both users need to use the same browser/device, or export/import manually

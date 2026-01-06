# Chit Chat — Local Discord-like Web App

Small, client-side Discord-like chat UI that stores data in the browser's `localStorage` and uses a JSON seed file (`data/servers.json`). Handy for prototyping and local demos.

Link: https://justanormalcomputer-guy.github.io/

Features
- Signup / Login (stored in `localStorage`)
- Servers with channels (create servers, channels, star servers)
- Chat with messages (messages stored per-channel)
- Delete your own messages
- Server deletion (only server creator)
- Site owner (first signup) can ban/delete accounts
- Friends list with online/offline indicator and remove friend
- Recommendations, notifications, profile view, and a simple settings placeholder
- Left sidebar shows servers with name/description; bottom navigation expands on hover

Important files
- `index.html` — main UI
- `app.js` — application logic (stored in root)
- `pages/css/index.css` — main styling
- `pages/html/` — additional pages: `login.html`, `signup.html`, `create_server.html`, `profile.html`, `recommendations.html`, `notifications.html`, `settings.html`
- `data/servers.json` — seed server data used on first load

Run locally
1. Start a simple HTTP server in the project root:

```bash
python3 -m http.server 8000
```

2. Open your browser at `http://localhost:8000`.

Usage notes
- All data is stored locally in the browser using `localStorage`. There is no backend — changes are visible only in the browser (and across tabs via polling).
- The first user who signs up becomes the site owner and can ban (delete) other accounts.
- Server creation is limited (per-user) to 5 servers.

Security & limitations
- This is a demo/prototype. Passwords and accounts are stored in plain `localStorage` — do NOT use real credentials.
- No authentication, no server-side persistence, and no input sanitization — intended for local testing only.

Next steps (suggestions)
- Replace prompt-based flows with modal forms
- Add a small backend (Node/Express) to persist data across users and provide real authentication
- Improve UI/UX for confirmation dialogs and notifications

Questions or changes? Tell me what you'd like next (modal forms, backend prototype, nicer notifications).

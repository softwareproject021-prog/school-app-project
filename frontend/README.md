# Campus1Cloud Frontend (Angular)

School management web app for the Campus1Cloud platform. Backend (Quarkus + MySQL): [school-project-backend](https://github.com/softwareproject021-prog/school-project-backend).

Four logins, each with its own screens:

| Role | Screens |
|---|---|
| Main Admin | Schools (search bar and dropdown filters, suspend, view as school), data explorer, add school |
| Principal | Dashboard, attendance, leave and substitutes, classes, teachers, students, timetable, marks, homework, fees, stationery store, events with photos, sports, transport, notifications |
| Teacher | Today, attendance and marks for own classes, homework, own timetable, leave requests, messages |
| Parent | Child's home, marks, fees (pay online), homework, timetable, events, school bus, messages |

## Run
Requires Node 20+ and the backend running on port 8080.

```bash
npm install
npm start          # http://localhost:4200, /api is proxied to http://localhost:8080 (proxy.conf.json)
```

Build for production: `npm run build` (output in `dist/school-project/browser`).
Docker: `docker build -t campus1cloud-web .` then `docker run -p 80:80 -e BACKEND=http://host:8080 campus1cloud-web`.

## Pages
`/` is the public landing page (with a Sign in button), `/login` is the sign in page, `/join/<token>` opens an invite. Everything else needs a login. Change the demo-request address in `src/app/pages/landing.component.ts` (`mail`).

## How people sign in
There is no public sign up and no demo login on the login page. The only default login is the Main Admin (set by the backend; see its README).

1. Main Admin: **Add school** enters the principal's name and email and gets a one-time invite link to send.
2. Principal: opens the link (`/join/<token>`), sets a password, then invites teachers from **Teachers**.
3. Teacher: opens the link, sets a password, then adds students and invites their parents from **My students**.
4. Parent: opens the link and sets a password.

**Invites** (left menu) lists every invite with Copy link and Cancel.

## Session security
- The API uses a short-lived (15 minute) bearer token that is kept in memory only, never in localStorage.
- A rotating httpOnly cookie renews it silently, so a page reload keeps you signed in and logout ends it on the server.
- In production serve the app and `/api` from the same site (the Docker/nginx image proxies `/api`, or use a Vercel/Netlify rewrite) so the cookie stays `SameSite=Strict`. Set `COOKIE_SECURE=true` on the backend over https.

## Structure
`src/app/core` API client, auth, interceptor (adds the bearer token, refreshes it when it expires, and X-School-Id for Main Admin "view as"), route guards.
`src/app/layout` role-based shell and menu. `src/app/pages` one standalone component per screen (platform, org, teacher, parent, shared).

## Your domain: campus1cloud.com
Suggested layout (all one site, so the secure session cookie works):
| Address | What |
|---|---|
| `https://campus1cloud.com` (or `app.campus1cloud.com`) | Angular frontend |
| `/api` on the same address | Forwarded to the Quarkus backend (Vercel/Netlify rewrite, or the nginx image) |

Backend settings for production: `PUBLIC_URL=https://campus1cloud.com`, `CORS_ORIGINS=https://campus1cloud.com`, `COOKIE_SECURE=true`, `ADMIN_LOGIN=admin@campus1cloud.com`, a strong `ADMIN_PASSWORD`. Invite links then look like `https://campus1cloud.com/join/<token>`.
In your domain's DNS add the records your host asks for (usually an A/ALIAS record for the root and a CNAME for `www`).

## Vercel
`vercel.json` forwards `/api/*` to the backend on Render (`school-project-backend-n6ne.onrender.com`) and sends every other path to `index.html` so refreshing `/login` or `/join/<token>` works. If the backend address changes, edit the `destination` there.

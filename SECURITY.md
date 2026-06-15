# Security Documentation — El Nadjah DC System

## What Was Fixed

### Authentication
- **Refresh token system** — Short-lived access tokens (8h staff / 1h students) + long-lived refresh tokens (7d staff / 30d students) stored in `httpOnly`, `SameSite=Strict` cookies. Refresh endpoints: `POST /api/auth/refresh`, `POST /api/student-auth/refresh`.
- **Separate JWT secrets** — Staff tokens use `JWT_STAFF_SECRET`; student tokens use `JWT_STUDENT_SECRET`. A student token cannot authenticate on a staff endpoint.
- **Token storage** — Access tokens stored in memory only (React state). Never in `localStorage`. Refresh token cookie is `httpOnly` — inaccessible to JavaScript.
- **Token expiry** — Reduced from 7d (staff) / 30d (students) to 8h / 1h. Refresh token extends session transparently.
- **Student token type check** — `decoded.type !== 'student'` guard prevents cross-use of token types.

### Passwords
- bcrypt with 12 salt rounds (unchanged — already correct).
- `password` field has `select: false` on both `User` and `StudentAccount` models — never returned in any query unless explicitly selected with `+password`.
- Minimum password length raised from 6 to 8 characters.
- Auto-generated student passwords: generated, shown once to the DC agent, hashed on save — never retrievable again.

### HTTP Security Headers (Helmet)
Added globally via `helmet`:
- `Content-Security-Policy` — restricts scripts/styles/connections to `'self'`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS) — enforced by nginx in production

### NoSQL Injection
- `express-mongo-sanitize` applied globally — strips `$` and `.` from user input before it reaches MongoDB queries.

### CORS
- Strict origin whitelist: only `CLIENT_URL` and `STUDENT_APP_URL` from env, plus localhost in development.
- `credentials: true` for cookie support.
- Restricted methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Restricted headers: Content-Type, Authorization.

### Rate Limiting
- **Global**: 100 req / 15 min per IP on all `/api/*` routes.
- **Auth endpoints** (`/login`): 10 req / 15 min per IP.
- **Refresh endpoint**: 20 req / 15 min per IP.
- Returns `429 Too Many Requests` with `Retry-After` header.

### Request Size Limits
- JSON body: 10kb max.
- URL-encoded body: 10kb max.
- Oversized requests return `413` before processing.

### Error Handling
- In production: generic `"Something went wrong"` returned to client.
- Full error with stack trace logged server-side only.
- `unhandledRejection` and `uncaughtException` handlers log and exit cleanly.

### RBAC (Role-Based Access Control)
- DC agents: all student queries include `assignedTo: req.user._id` filter at the database level — not just frontend filtering.
- Founders: full access.
- Students: access their own data only via `protectStudent` middleware.
- Student token type (`decoded.type === 'student'`) verified on every request to prevent staff tokens from accessing student endpoints.

### Environment Variables
- `validateEnv()` called on startup — crashes with clear error if required secrets are missing.
- `.env.example` updated to reflect all required variables (real credentials removed).

### Logging (Winston)
- Structured logs via Winston.
- Production: rotates daily, keeps 30 days, never logs passwords or tokens.
- Security events logged: login (success/fail), logout, auth failures.

---

## Required Environment Variables

```
NODE_ENV=production
PORT=5000
MONGODB_URI=                        # MongoDB Atlas connection string
JWT_STAFF_SECRET=                   # 64+ random chars
JWT_STUDENT_SECRET=                 # 64+ random chars (or STUDENT_JWT_SECRET)
JWT_REFRESH_STAFF_SECRET=           # 64+ random chars
JWT_REFRESH_STUDENT_SECRET=         # 64+ random chars
CLIENT_URL=                         # Main app URL
STUDENT_APP_URL=                    # Student PWA URL
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## VPS Deployment Security Checklist

### Before going live
- [ ] Replace ALL placeholder secrets in `.env` with 64+ character random strings
- [ ] Set `NODE_ENV=production` in VPS environment
- [ ] Verify `.env` is in `.gitignore` and has never been committed
- [ ] MongoDB Atlas: whitelist VPS IP address only (remove 0.0.0.0/0)
- [ ] MongoDB Atlas: use a dedicated user with read/write on app database only — no admin role

### HTTPS
- [ ] Install certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Obtain SSL: `sudo certbot --nginx -d yourdomain.com`
- [ ] Auto-renew: `sudo certbot renew --dry-run`

### Nginx
- [ ] Copy `nginx.conf.template`, fill in DOMAIN, SSL paths, build paths
- [ ] `sudo nginx -t && sudo systemctl reload nginx`
- [ ] Nginx never exposes Node.js directly on port 80/443

### Firewall (UFW)
```bash
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP (redirects to HTTPS)
sudo ufw allow 443    # HTTPS
sudo ufw deny 5000    # Block direct Node.js access
sudo ufw enable
```

### SSH Hardening
- [ ] Change default SSH port in `/etc/ssh/sshd_config`
- [ ] Disable password SSH login: `PasswordAuthentication no`
- [ ] Use SSH key only
- [ ] Install fail2ban: `sudo apt install fail2ban`

### Process Management (PM2)
```bash
npm install -g pm2
cd /var/www/elnadjah
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Build & Deploy
```bash
# Backend
cd backend && npm install --production

# Main app
cd frontend && npm run build

# Student PWA
cd student-app && npm run build
```

### Monitoring
- [ ] Set up PM2 log rotation: `pm2 install pm2-logrotate`
- [ ] MongoDB Atlas: enable automated daily backups
- [ ] Set up uptime monitoring (e.g., UptimeRobot free tier)

---

## Security Test Checklist

- [ ] Login with wrong password — must return 401, never 200
- [ ] Access `/api/students` with student JWT — must return 401
- [ ] Access `/api/students/:id` as DC agent for another agent's student — must return 403
- [ ] Send `{"$gt": ""}` as login credentials — must be blocked (sanitized to empty string)
- [ ] Exceed login rate limit (11 requests) — must return 429
- [ ] Access token expires after 8h (staff) / 1h (student) — refresh must work
- [ ] Clear cookies + access token, call refresh — must return 401
- [ ] Call `/api/auth/logout`, then `/api/auth/refresh` — must return 401
- [ ] `npm audit --audit-level=high` — must show 0 high/critical vulnerabilities

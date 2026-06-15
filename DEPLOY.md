# El Nadjah DC System — Deployment Guide (Hostinger VPS)

## Prerequisites
- Hostinger VPS running Ubuntu 22.04 LTS
- A domain name (optional but recommended)
- MongoDB Atlas account (free tier M0 works fine)

---

## Step 1: MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new project: "El Nadjah"
3. Build a free cluster (M0 Sandbox)
4. Under Security → Database Access: create a user with read/write access
5. Under Security → Network Access: add your VPS IP address (or 0.0.0.0/0 for any IP)
6. Under Databases → Connect → Connect your application: copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
   - Add your database name: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/elnadjah`

---

## Step 2: Prepare VPS

SSH into your VPS, then run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

---

## Step 3: Upload the project

Option A — Upload via SFTP (FileZilla):
- Connect to your VPS with SFTP
- Upload the entire `el-nadjah/` folder to `/var/www/el-nadjah/`

Option B — Git (if you push to GitHub):
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/el-nadjah.git
```

---

## Step 4: Configure backend

```bash
cd /var/www/el-nadjah/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

Paste this into the .env file (replace values with yours):
```
PORT=5000
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/elnadjah?retryWrites=true&w=majority
JWT_SECRET=make_this_very_long_and_random_at_least_32_chars
JWT_EXPIRES_IN=7d
STUDENT_JWT_SECRET=different_long_random_secret_for_students_only
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
STUDENT_APP_URL=https://app.yourdomain.com
```

Save with Ctrl+X, Y, Enter.

```bash
# Run the database seed (creates founders + Lithuania destination)
npm run seed

# Start backend with PM2
pm2 start server.js --name "elnadjah-api"
pm2 save
pm2 startup
```

---

## Step 5: Build frontends

```bash
# Main app (founders + DC agents)
cd /var/www/el-nadjah/frontend
npm install
npm run build
# Built files → frontend/dist/

# Student PWA
cd /var/www/el-nadjah/student-app
npm install
npm run build
# Built files → student-app/dist/
```

---

## Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/elnadjah
```

Paste this configuration (two server blocks — main app + student app):
```nginx
# Main app — founders and DC agents
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/el-nadjah/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Student PWA — subdomain app.yourdomain.com
server {
    listen 80;
    server_name app.yourdomain.com;

    root /var/www/el-nadjah/student-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/elnadjah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 7: HTTPS with Let's Encrypt (free SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will auto-configure HTTPS.

---

## Step 8: Verify everything works

1. Visit `https://yourdomain.com` → should see the login page
2. Login with `haithem@elnadjah.com` / `elnadjah2024`
3. **Immediately change your password** after login

---

## Useful PM2 commands

```bash
pm2 list                    # Show running processes
pm2 logs elnadjah-api       # View backend logs
pm2 restart elnadjah-api    # Restart backend
pm2 stop elnadjah-api       # Stop backend
```

---

## Updating the app

```bash
# Backend update
cd /var/www/el-nadjah/backend
# (upload new files or git pull)
pm2 restart elnadjah-api

# Frontend update
cd /var/www/el-nadjah/frontend
# (upload new files or git pull)
npm run build
# Nginx serves the new dist/ automatically — no restart needed
```

---

## Handoff Form URL

The handoff form for sales agents is accessible at:
`https://yourdomain.com/handoff`

No login required. Sales agents can bookmark this URL and use it directly.

---

## Backup MongoDB Atlas

MongoDB Atlas M0 free tier includes automated backups for paid tiers.
For free tier: export manually from Atlas → Data Explorer → Export Collection.
Or use `mongodump` from the VPS.

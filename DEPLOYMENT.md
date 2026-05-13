# 🚀 Datalazo Deployment Guide

Because this project runs on a 2GB DigitalOcean droplet alongside **n8n**, the build process requires special attention to memory management.

## ⚠️ MANDATORY DEPLOYMENT STEP
**Before every deployment, you must temporarily stop n8n to free up RAM.**

1.  **Stop n8n**: In Easypanel, stop the `n8n` service.
2.  **Deploy Website**: Click **"Deploy"** on the website service.
3.  **Start n8n**: Once the website is live, start the `n8n` service again.

## Build Optimization
- **Install Command**: Always use `npm ci` in Easypanel settings.
- **Node Version**: The project is optimized for Node 22+.
- **Memory Limit**: `nixpacks.toml` is configured to limit Node's memory usage to `1536MB`.

## Domains
- **Production**: https://datalazo.net
- **SSL**: Managed automatically by Easypanel (Let's Encrypt).

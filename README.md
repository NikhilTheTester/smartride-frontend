# Smart Ride - Frontend (React + Vite)

## Run in VS Code
1. Install Node.js 18 or newer.
2. Open this folder in VS Code (File -> Open Folder).
3. Open the terminal (Ctrl + `) and run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:5173 in Chrome.
5. Start the Spring Boot backend first (port 8080). If your backend uses another URL, change `VITE_API_URL` in `.env`.

## Demo logins
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartride.com | admin123 |
| Driver | driver1@smartride.com | driver123 |
| Employee | emp1@smartride.com | emp123 |

Maps use OpenStreetMap + Leaflet (free, no API key, internet needed to load map tiles).

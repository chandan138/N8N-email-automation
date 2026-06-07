# MailFast AI MERN

MailFast AI is a dynamic AI email automation web app using:

- React.js + TypeScript
- Node.js + Express.js
- MongoDB + Mongoose
- TailwindCSS
- Google Gemini or OpenAI API
- Gmail API integration placeholders
- n8n workflow integration

## Run In VS Code / Visual Studio

1. Extract the zip.
2. Open `mailfast-ai-mern` in VS Code or Visual Studio.
3. Install Node.js and MongoDB Community Server, or run MongoDB locally with Docker.
4. Copy `server/.env.example` to `server/.env`.
5. Update `server/.env` if needed.
6. Install dependencies:

```bash
npm run install:all
```

7. Start MongoDB.
8. Run the app:

```bash
npm run dev
```

Do not use Yarn workspace commands for this project. It is split into `client` and `server`, and the root npm scripts run both.

9. Open the React frontend:

```text
http://localhost:5173
```

If `5173` is busy, Vite will automatically print the next available URL, such as `http://localhost:5174`.

Backend API runs at:

```text
http://localhost:5000
```

## Demo Login

The server creates or corrects this demo account every time it starts.

```text
Email: admin@mailfast.local
Password: demo123
```

If login still fails, make sure MongoDB is running first, then stop and restart `npm run dev`.

## n8n

Import:

```text
workflows/mailfast.workflow.json
```

Set `MAILFAST_APP_URL=http://localhost:5000` in n8n so the workflow can call:

```text
POST /api/n8n/incoming
```

For multiple clients, create one workflow copy per Gmail credential, or set `N8N_API_KEY` so the backend can create client-specific workflow copies.

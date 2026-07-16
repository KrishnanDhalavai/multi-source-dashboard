# Multi-Source API Dashboard

A robust, full-stack, promise-oriented web application that concurrently aggregates data from three distinct external public API providers (Weather, Currency, and Advice Slip) through an Express proxy backend, serving it to a responsive React frontend.

This project is built around **native JavaScript Promises** to demonstrate concurrent execution, non-blocking I/O routing, asynchronous state transitions, and partial failure resiliency using the `Promise.allSettled()` API.

---

## Technical Stack & Architecture

### Backend (Node.js + Express)
- **Aggregator Proxy**: Acts as a gateway to bundle multiple cross-origin requests into a single network roundtrip for the client browser.
- **Resilient Promise Architecture**: Utilizes `Promise.allSettled()` to process outgoing network fetches in parallel. If any external endpoint crashes or times out, the backend maps the failure to an inline `success: false` payload, preventing the entire request from failing.
- **Simulation Harness**: Supports a query argument `?fail=[weather|currency|advice]` allowing the frontend to trigger artificial downstream errors for testing.
- **Dynamic Queries**: Accepts a `?location=xyz` parameter to fetch location-specific weather reports dynamically.

### Frontend (React)
- **Functional Components & Hooks**: Uses standard state hooks (`useState`, `useEffect`) to reactively manage API cycles.
- **Promise State Lifecycles**:
  - **PENDING**: Displays a flat animated load spinner.
  - **FULFILLED**: Updates widgets once resolution callbacks fire.
  - **REJECTED**: Handles global backend failures with a full-screen retry layout.
- **Inline Offline States**: If an individual service returns `success: false`, only that specific widget transitions to an offline warning box; the rest of the application remains online and functional.
- **Styling**: Built on a custom-tailored, minimal Vanilla CSS design system. It uses a clean, flat dark-slate template (`#0f172a`), system-ui typography, and a single electric blue accent (`#3b82f6`) without gradients or glassmorphism.

---

## Full-Stack Asynchronous Flow

```mermaid
sequenceDiagram
    participant User as Client Browser
    participant Loop as Node.js Event Loop
    participant OS as OS Network Stack
    participant APIs as wttr.in / er-api.com / adviceslip.com

    User->>Loop: Fetch /api/dashboard?location=Paris
    Note over Loop: Initiates 3 outgoing HTTP requests
    Loop->>OS: Request 1 (Weather for Paris)
    Loop->>OS: Request 2 (Currency USD rates)
    Loop->>OS: Request 3 (Advice Slip)
    Note over Loop: Event Loop is instantly FREE<br/>to serve other clients!
    
    OS->>APIs: Fires concurrent network sockets
    APIs-->>OS: Sends responses (non-blocking)
    
    OS-->>Loop: Resolves Request 3 -> Queue Callback
    OS-->>Loop: Resolves Request 1 -> Queue Callback
    OS-->>Loop: Resolves Request 2 -> Queue Callback
    
    Note over Loop: Microtask queue executes callbacks
    Note over Loop: Promise.allSettled resolves
    Loop->>User: Responds with aggregated JSON payload
```

---

## Project Structure

```text
multi_source_dashboard/
├── backend/
│   ├── package.json
│   └── server.js          # Express Aggregator Server
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx        # Dashboard Logic & Layout
│   │   ├── index.css      # Solid Dark-Slate UI Theme
│   │   └── main.jsx
│   └── .gitignore
└── .gitignore             # Root Workspace Gitignore
```

---

## Installation & Running

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) installed.

### 1. Set Up and Run the Backend
Open a terminal in the root directory:
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the Express server (starts on port 5000)
npm start
```

### 2. Set Up and Run the Frontend
Open a second terminal window in the root directory:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (starts on port 5173)
npm run dev
```

Open your browser and navigate to **`http://localhost:5173/`**.

---

## Interactive Resiliency Harness

You can test the application's fail-safe behavior directly through the control buttons placed at the top of the dashboard:
1. **All Services Online**: Requests standard aggregated data (Weather defaults to London).
2. **Search Input**: Type a custom city or country name (e.g., `Tokyo`, `Paris`, `France`) and click **Search** to refetch the report for that region.
3. **Simulate Service Offline**: Clicking any of the simulation triggers prompts the backend to reject that specific API's promise. The associated UI card immediately falls back to displaying a red `offline` badge and an inline warning message, while the remaining widgets remain online and interactable.
4. **Invalid Search Query**: Enter a gibberish location (e.g. `xyzqwe123`) and click **Search**. The Weather card transitions to `offline` displaying the error status, while the currency rates and advice modules remain online.

# PGCPAITL Next.js Frontend

This is the revamped frontend for the PGCPAITL application using Next.js, React Query, and Zod.

## Getting Started

1.  Navigate to this directory:
    ```bash
    cd web
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or run install_deps.bat if on Windows
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Backend Integration

This frontend proxies API requests to `http://localhost:5000`. 
Please ensure the backend server (express) is running on port 5000 via:
```bash
node server.js
```
(from the root directory)

## Technologies Used

-   **Next.js 15+** (App Router)
-   **Zod** (Validation)
-   **React Hook Form** (Form Management)
-   **TanStack Query** (API State Management)
-   **Axios** (HTTP Client)
-   **Handwritten CSS** (in `globals.css`)

## Admin Panel Architecture Overview

### Purpose
Admin SPA to manage the e‑commerce catalog and orders:
- Authenticate as admin
- Create products with images
- List/remove products
- View all customer orders and update order status

### Tech stack
- React 19 with Vite 7
- React Router 7 for client routing
- Tailwind CSS 3.4 for styling
- Axios for HTTP requests
- React Toastify for notifications

Environment variable:
- `VITE_BACKEND_URL` → base URL for the backend API (defaults to `http://localhost:4000`)

### Project layout
- `src/App.jsx` — App shell and routing; token gate that shows `Login` when unauthenticated
- `src/main.jsx` — Mounts the app and wraps with `BrowserRouter`
- `src/components/`
  - `Login.jsx` — Admin login screen
  - `NavBar.jsx` — Top bar with brand logo and logout
  - `SideBar.jsx` — Left navigation with links to Add/List/Orders
- `src/pages/`
  - `add.jsx` — Product creation form with image uploads
  - `list.jsx` — Product listing with delete action
  - `orders.jsx` — All orders view with status update control
- `src/assets/` — Icons and images for admin UI
- `tailwind.config.js`, `postcss.config.js`, `index.css` — Styling configuration and utilities

### App bootstrap and routing
- `App.jsx` manages `token` state (from `localStorage`) and exposes it to pages via props.
- When `token` is empty, the app renders `Login`. After login it renders the main layout: `NavBar` + `SideBar` + content area.
- React Router routes:
  - `/` → redirects to `/add`
  - `/add` → product creation
  - `/list` → product list
  - `/orders` → order management

### Authentication flow
- `Login.jsx` posts credentials to `POST /api/user/admin/login`.
- On success, the returned JWT token is stored in `localStorage` (key: `token`) and in `App` state.
- Authenticated API requests send the token in the `token` header as required by backend middleware.
- `NavBar` logout clears the token and returns to the login screen.

### State management
- No global state library; local `useState` is used per component/page.
- `App.jsx` holds the `token` and persists it to `localStorage`.
- Pages (`add`, `list`, `orders`) maintain their own UI/data state and receive `token` via props.

### Styling & UI structure
- Tailwind utility classes for layout and spacing.
- `SideBar` uses `NavLink` with a custom `.active` style (defined in `src/index.css`).
- Pages are simple container components composed of basic form and table layouts.

### API communication
- Base URL: `backendUrl` from `VITE_BACKEND_URL` (trimmed of trailing slash).
- All admin APIs include `{ headers: { token } }` for authorization.
- Endpoints used:
  - Auth: `POST /api/user/admin/login`
  - Products:
    - `POST /api/product/add` — multipart form with fields `name, description, price, category, subCategory, bestseller, sizes`, and up to 4 images (`image1..image4`)
    - `GET  /api/product/list` — list all products
    - `POST /api/product/remove` — remove product by `{ id }`
  - Orders:
    - `POST /api/order/list` — list all orders (admin)
    - `PUT  /api/order/status` — update status (admin)

### Pages and component responsibilities
- `Login.jsx`
  - Collects admin credentials and calls the admin login endpoint
  - On success, sets token (via `setToken`) and shows a toast on failure
- `NavBar.jsx`
  - Displays logo and a logout button that clears token
- `SideBar.jsx`
  - Static links to `/add`, `/list`, `/orders`; indicates the active route
- `add.jsx`
  - Controlled form for product fields and sizes
  - Handles local image selection and previews
  - Submits a `FormData` payload to `/api/product/add`
  - Resets form and shows toast based on response
- `list.jsx`
  - Fetches products via `/api/product/list` on mount
  - Renders a table-like list; allows deleting products via `/api/product/remove`
- `orders.jsx`
  - Loads orders with `POST /api/order/list`
  - Renders each order with items, shipping address, payment info, and date
  - Allows updating order `status` using a `<select>` input calling the status API

### Data flow examples
- Login
  1. Admin submits email/password → `POST /api/user/admin/login`
  2. On success, `token` saved to `localStorage` and App state → routes to `/add`
- Add product
  1. Admin fills form and selects images → `FormData` built in `add.jsx`
  2. Submit → `POST /api/product/add` with `{ headers: { token } }`
  3. On success, form resets and success toast shows
- Manage orders
  1. `orders.jsx` loads orders via `POST /api/order/list`
  2. Changing the status select triggers a request to update status

### Design patterns and conventions
- Simple container/page components + small presentational components
- Route-driven layout (NavBar + SideBar + content)
- Imperative data fetching via `useEffect` and Axios
- Environment-based configuration for backend URL

### Known issues and improvement opportunities
- Token key `localStorage.getItem('token')` collides with the storefront app; prefer a distinct key like `adminToken`.
- Status update endpoint: backend exposes `PUT /api/order/status` but the UI uses `POST /api/order/updateStatus`; align method and path to backend.
- Consider centralizing Axios configuration and adding response interceptors for 401/403 to auto-logout.
- Add form validation for product creation (required fields, numeric price) and file size/type checks.
- Improve error handling with user-friendly toasts and retry prompts.
- Extract a small API client module to avoid duplicating `backendUrl` and headers.

### How to run locally
1. `cd admin`
2. `npm install`
3. (Optional) Create `.env` with `VITE_BACKEND_URL=http://localhost:4000`
4. `npm run dev` (default dev server on port 5174)

### Extending the admin (high level)
- Add product editing and bulk operations
- Add pagination/sorting to product list
- Add order search and filtering; implement detailed order view
- Implement admin profile management and role-based permissions



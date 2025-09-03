## Frontend architecture overview

This repository contains two React + Vite applications:
- Storefront app in `Frontend/` (public shopping experience)
- Admin app in `admin/` (catalog and order management)

Both apps use Tailwind CSS for styling, React Router for client-side routing, Axios for HTTP, and React Toastify for notifications. The Storefront shares state via a centralized context (`ShopContext`).

### Tech stack
- Storefront: React 18, Vite 4, React Router 6, Tailwind 3, Axios, React Toastify
- Admin: React 19, Vite 7, React Router 7, Tailwind 3.4, Axios, React Toastify

Environment variables (both apps):
- `VITE_BACKEND_URL` → base URL to the backend API (e.g., `http://localhost:4000`)

### Directory structure (high level)
- `Frontend/`
  - `src/App.jsx` → layout and route configuration (NavBar, SearchBar, Routes, Footer)
  - `src/main.jsx` → mounts app with `BrowserRouter` and `ShopContextProvider`
  - `src/context/ShopContext.jsx` → global store: products, cart, auth token, search, API config
  - `src/components/` → global UI (NavBar, SearchBar, Hero, lists, Footer, etc.)
  - `src/pages/` → route pages (home, collection, product, cart, place-order, orders, login, verify)
  - `src/assets/` → images and static product placeholders

- `admin/`
  - `src/App.jsx` → token gate + layout (NavBar, SideBar, Routes)
  - `src/components/` → Login, NavBar, SideBar
  - `src/pages/` → add (create product), list (products), orders (admin order management)
  - `src/assets/` → admin UI images/icons

### Storefront app: state management
- `ShopContext` provides:
  - **Catalog**: `products` fetched from backend `GET /api/product/list` on mount
  - **Cart**: `cartItems` map `{ [productId]: { [size]: quantity } }`, with helpers:
    - `addToCart(itemId, size, qty)` (persists locally; when authenticated, also POSTs to `/api/cart/add`)
    - `removeFromCart`, `setItemQuantity`, derived `cartCount`, `cartSubtotal`
    - Local persistence via `localStorage` (`cart-v1`)
  - **Auth**: `token` (JWT) and `setToken`; `Login` page writes token to `localStorage`
  - **UI**: `search`, `showSearch`, `navigate`
  - **Config**: `backendUrl`, `currency`, `delivery_fee`

### Storefront app: routing and pages
- Routing is defined in `src/App.jsx` using React Router v6 `Routes/Route`:
  - `/` → `home.jsx`
  - `/collection` → `collection.jsx` (filters + sort + global search)
  - `/product/:productID` → `product.jsx` (gallery, size, quantity, add-to-cart, related)
  - `/cart` → `Cart.jsx`
  - `/place-order` → `PlaceOder.jsx`
  - `/orders` → `Orders.jsx`
  - `/login` → `Login.jsx`
  - `/verify` → `verify.jsx` (Stripe verification callback)

### Storefront app: UI components
- `NavBar` (navigation, active link underline, search toggle, account menu, cart badge)
- `SearchBar` (shown only on collection route when toggled)
- `ProductItem`, `RelatedProduct` (catalog building blocks)
- Home building blocks: `Hero`, `LatestCollection`, `BestSeller`, `OurPolicy`, `NewsLetterBox`, `Footer`, `Title`

### Admin app: overview
- Token-gated shell in `admin/src/App.jsx`:
  - Shows `Login` if no token; on success stores token in `localStorage`
  - When authenticated, renders `NavBar`, `SideBar`, and routes: `/add`, `/list`, `/orders`
- API configuration exported as `backendUrl` from `App.jsx`
- Pages:
  - `add.jsx` → multipart form + Cloudinary-backed uploads via backend `POST /api/product/add` (admin auth header)
  - `list.jsx` → fetches `GET /api/product/list`, can `POST /api/product/remove`
  - `orders.jsx` → loads all orders `POST /api/order/list`, updates status via `PUT /api/order/status`

### API communication (shared patterns)
- Axios is used throughout; base URL is `backendUrl`
- Authenticated requests pass `{ headers: { token } }`
- Key endpoints used by the Storefront:
  - `GET /api/product/list` (load catalog)
  - `POST /api/cart/add` (sync add-to-cart when logged in)
  - `POST /api/user/login` and `POST /api/user/register` (auth)
  - `POST /api/order/stripe` → returns Stripe Checkout `session_url` (flow continues on `/verify`)
  - `POST /api/order/verifyStripe` (finalizes order after Stripe redirect)
- Key endpoints used by Admin:
  - `POST /api/user/admin/login` (admin auth)
  - `POST /api/product/add`, `POST /api/product/remove`, `GET /api/product/list`
  - `POST /api/order/list`, `PUT /api/order/status`

### Data flow (storefront)
1. App start → `ShopContext` fetches products and hydrates `cartItems` from `localStorage`.
2. User navigates and filters in `collection` → list is derived from `products` and UI filters.
3. On PDP → user selects size/qty → `addToCart` updates context (and server if logged in).
4. Cart totals are derived (`cartSubtotal`, `delivery_fee`).
5. Checkout (`PlaceOder`) captures address and payment selection; current implementation uses context `placeOrder` for local orders, with Stripe flow wired to backend endpoints and `/verify` page to confirm.

### Key functionalities
- Storefront:
  - Product browsing with filters/sorting and global search
  - Product detail with image gallery and size selection
  - Cart with quantity steppers, remove, and totals
  - Checkout form with payment method selection and Stripe verification page
  - User auth (login/register) and token persistence
- Admin:
  - Admin authentication and token gate
  - Create product with image uploads (Cloudinary via backend)
  - List and remove products
  - View and update order statuses

### Design patterns and conventions
- Component composition with page-level containers and reusable atoms/molecules
- Global state via React Context (`ShopContext`) instead of Redux
- Environment-based configuration for backend base URL
- Tailwind utility-first styling

### Known issues and improvement opportunities
- Storefront `ShopContext` already fetches products from backend; the docs and some components still reference static `assets.products` in places. Prefer backend data only.
- Storefront `App.jsx` references `<Verify />` but lacks an import; ensure `import Verify from './pages/verify'` and consistent casing of page imports (some imports use lowercase names).
- `verify.jsx` uses `backendUrl` without import; import it from context or recompute from `import.meta.env`.
- Checkout page contains two flows (`onPlaceOrder` using context and `onSubmitHandler` with direct API) — consolidate to one consistent flow and fix endpoint names (`/api/order/*` vs `/api/orders/*`).
- Orders page code has inconsistencies (missing imports, unused variables). Align with backend endpoints (`/api/order/user-orders`) and context/state.
- Admin uses `react-router-dom` v7 while Storefront uses v6; upgrade/downgrade to align if possible.
- Token key naming differs across apps; consider using `adminToken` for admin for clarity and to avoid collisions.

### How to run locally
- Storefront:
  - `cd Frontend && npm install`
  - set `VITE_BACKEND_URL` in `Frontend/.env` (optional; defaults to `http://localhost:4000`)
  - `npm run dev`
- Admin:
  - `cd admin && npm install`
  - set `VITE_BACKEND_URL` in `admin/.env` (optional)
  - `npm run dev`


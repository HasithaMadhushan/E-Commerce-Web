## Backend Architecture Overview

### Purpose
An e‑commerce backend that provides user authentication, product catalog management with image uploads, shopping cart persistence, order placement, and payment integration (Stripe; Razorpay stub). It exposes RESTful JSON APIs consumed by the web frontends (`Frontend/` and `admin/`).

### Tech Stack and External Services
- **Runtime/Framework**: Node.js, Express 5.x (ES modules)
- **Database/ORM**: MongoDB with Mongoose 8.x
- **Auth**: JWT (jsonwebtoken), bcrypt for password hashing, validator for input checks
- **File uploads & media**: Multer (multipart parsing), Cloudinary (image hosting)
- **Payments**: Stripe (Checkout Sessions). Razorpay dependency present; implementation stubbed
- **Infra/Misc**: cors, dotenv, nodemon (dev)

### Directory Layout (backend-only)
```
Backend/
  Server.js                 # Express app bootstrap
  config/
    cloudinary.js          # Cloudinary SDK configuration
    mongodb.js             # Mongoose connection and event hooks
  controllers/
    cartController.js      # Add/update/get cart APIs
    orderController.js     # COD and Stripe order placement, admin orders, status updates
    productController.js   # CRUD for products (admin); Cloudinary uploads
    userController.js      # Login/register for users; admin login
  middleware/
    adminAuth.js           # Admin JWT verification
    auth.js                # User JWT verification
    multer.js              # Multer disk storage config
  models/
    orderModel.js          # Order schema/model
    productModel.js        # Product schema/model
    userModel.js           # User schema/model (with cartData)
  routes/
    cartRoute.js           # /api/cart/*
    orderRoute.js          # /api/order/*
    productRoutes.js       # /api/product/*
    userRoutes.js          # /api/user/*
  package.json             # Scripts and dependencies
```

### Application Startup Lifecycle
1. `Server.js` loads env via dotenv, creates Express app, registers global middleware (`cors`, `express.json`).
2. Connects to MongoDB (`config/mongodb.js`) and configures Cloudinary (`config/cloudinary.js`).
3. Registers feature routers under `/api/*`: users, products, cart, and orders.
4. Starts HTTP server on `PORT` (default 4000).

### Modules and Responsibilities
- **Config**
  - `config/mongodb.js`: Connects to MongoDB using `process.env.MONGODB_URI`; logs when connected.
  - `config/cloudinary.js`: Initializes Cloudinary with env credentials.

- **Middleware**
  - `middleware/auth.js` (`authUser`): Verifies a user JWT and attaches `userId` to `req.body`. Expected header: `token`.
  - `middleware/adminAuth.js` (`adminAuth`): Verifies an admin token (JWT payload equals `ADMIN_EMAIL + ADMIN_PASSWORD`). Expected header: `token`.
  - `middleware/multer.js`: Configures Multer disk storage for incoming image files.

- **Models (Mongoose)**
  - `userModel.js`: `{ name, email(unique), password, cartData(Object, default {}), minimize:false }`.
  - `productModel.js`: `{ name, description, price, image(Array), category, subCategory, sizes(Array), date(Number), bestseller(Boolean) }`.
  - `orderModel.js`: `{ userId, items(Array), amount(Number), address(Object), status(default 'Order Placed'), paymentMethod, payment(Boolean), date(Number) }`.

- **Controllers**
  - `userController.js`
    - `loginUser`: Email/password check, bcrypt compare, returns JWT (`{ id }`, 1d expiry).
    - `registerUser`: Validates email/password, hashes password, creates user, returns JWT.
    - `loginAdmin`: Validates against `ADMIN_EMAIL`/`ADMIN_PASSWORD`, signs a token.
  - `productController.js`
    - `addProduct` (admin): Accepts up to 4 images via Multer field names `image1..image4`, uploads to Cloudinary, persists product.
    - `listProducts`: Returns all products.
    - `removeProduct` (admin): Deletes by id.
    - `singleProduct`: Returns one by `productId`.
  - `cartController.js`
    - `addToCart` (auth): Increments quantity by `itemId` and `size` in `user.cartData`.
    - `updateCart` (auth): Sets quantity for `itemId`/`size`.
    - `getUserCart` (auth): Returns `cartData` for authenticated user.
  - `orderController.js`
    - `placeOrder` (auth, COD): Creates order with `payment:false`; empties user cart.
    - `placeOrderStripe` (auth): Creates order, builds Stripe Checkout `line_items` (includes delivery fee), creates session, returns `session_url`.
    - `verifyStripe` (auth): On `success === "true"`, marks payment true and clears cart; otherwise deletes the order.
    - `allOrders` (admin): Lists all orders.
    - `userOrders` (auth): Lists orders for authenticated user.
    - `updateStatus` (admin): Updates order `status`.

- **Routes**
  - `userRoutes.js` → mounted at `/api/user`
    - `POST /login`, `POST /register`, `POST /admin/login`.
  - `productRoutes.js` → mounted at `/api/product`
    - `POST /add` (admin), `GET /list`, `POST /remove` (admin), `POST /single`.
  - `cartRoute.js` → mounted at `/api/cart` (all require auth)
    - `POST /get`, `POST /add`, `POST /update`.
  - `orderRoute.js` → mounted at `/api/order`
    - Admin: `POST /list`, `PUT /status`.
    - User: `POST /place` (COD), `POST /stripe` (Stripe).
    - User: `GET /user-orders` (returns orders for authenticated user).
    - Verify: `POST /verifyStripe`.

### Authentication and Authorization
- **User auth**: Clients send `token` header containing a JWT signed with `JWT_SECRET`. `authUser` verifies and injects `userId` into `req.body` for downstream handlers.
- **Admin auth**: Clients send `token` header containing a special admin JWT (payload equals `ADMIN_EMAIL + ADMIN_PASSWORD`). `adminAuth` verifies equality after decoding.

### Data Models (at a glance)
- `User`:
  - `name:String`, `email:String(unique)`, `password:String(hash)`, `cartData:Object` (nested `{ [itemId]: { [size]: quantity } }`).
- `Product`:
  - `name, description, price:Number, image:String[], category, subCategory, sizes:String[], date:Number, bestseller:Boolean`.
- `Order`:
  - `userId:String, items:Array, amount:Number, address:Object, status:String('Order Placed' default), paymentMethod:String('COD'|'Stripe'|...), payment:Boolean, date:Number`.

### Payments (Stripe Checkout)
1. Client calls `POST /api/order/stripe` with `{ userId, items, address, amount }` (auth required).
2. Server persists an order and composes `line_items` from `items` plus a fixed delivery fee.
3. Server creates a Stripe Checkout Session and returns `session_url`.
4. After redirect/return, client calls `POST /api/order/verifyStripe` with `{ orderId, success, userId }`.
5. On success, server marks `payment:true` and clears the user cart; on failure, it deletes the order.

Note: Flow uses a client-driven verification call rather than Stripe webhooks.

### Typical Data Flows
- **Add to cart**
  - `authUser` extracts `userId` → `cartController.addToCart` updates `User.cartData` for `[itemId][size]`.
- **Place COD order**
  - `authUser` injects `userId` → `orderController.placeOrder` persists order with `payment:false` → clears `User.cartData`.
- **Place Stripe order**
  - `orderController.placeOrderStripe` persists order → creates Stripe session → client pays → `verifyStripe` finalizes payment and clears cart (or deletes order).

### Configuration and Environment Variables
Create a `.env` file in `Backend/` with:
```
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret

# Admin credentials used for admin login
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strongpassword

# Cloudinary
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_or_test_key
```

### Error Handling and Responses
- Controllers wrap logic in `try/catch` and respond with JSON shape `{ success: boolean, ... }`.
- HTTP status codes are not explicitly set; clients should check the `success` flag and optional `message`.

### Interactions Between Modules (high-level)
- `Server.js` wires routers → routers apply `authUser`/`adminAuth` middleware → controllers execute business logic → models persist/read data → external SDKs (Cloudinary/Stripe) are invoked as needed.

### Design Patterns and Conventions
- **Layered/MVC-ish** separation: routes → middleware → controllers → models → services (external SDKs).
- **Environment-based configuration** for secrets and external services.
- **DTO-lite**: Controllers accept/emit plain JSON; no explicit validation library (beyond simple checks).
- **Idempotent-ish updates** for cart quantities by direct overwrite.

### Notable Quirks, Assumptions, and Potential Improvements
- In `middleware/auth.js`, `const token = req.headers;` likely should read `req.headers.token`. As written, `jwt.verify` receives the whole headers object, which will fail.
- In `models/orderModel.js`, model caching uses `mongoose.model.order` (lowercase, non-standard). It should likely be `mongoose.models.Order` to avoid model overwrite errors during reloads.
- `orderController.placeOrderStripe` sets `payment:true` when creating the order, before verification. Consider creating with `payment:false` and updating only after verification/webhook.
- `orderRoute.js` exposes `GET /user-orders` but `userOrders` reads `userId` from the request body; this works because middleware writes to `req.body`, but it’s unconventional for GET requests.
- No Stripe webhooks: payment confirmation relies on a client-provided `success` flag. Prefer server-side verification via webhooks.
- `package.json` scripts reference `server.js` (lowercase) while the file is `Server.js`. This can break on case-sensitive filesystems.
- Minor inconsistencies: currency constant is `LKR`, but delivery fee comment mentions `$10`.
- Some unused/extra imports (e.g., `{ connect }` imported in `Server.js`, `{ json }` imported in `userController.js`).
- Controllers respond with 200 for errors; consider proper HTTP status codes and centralized error handling.
- Security: Admin auth is based on static env credentials; consider a proper admin user model and role-based access control.

### How to Run Locally
1. `cd Backend`
2. `npm install`
3. Create `.env` with the variables above
4. Dev: `npm run server` (nodemon). Prod: `npm start`.

### Extending the System (high-level)
- Add a feature by creating a controller function, adding a route in the appropriate router, and (optionally) adding a Mongoose model or fields.
- Protect routes with `authUser` for user actions or `adminAuth` for admin-only actions.
- For file uploads, add Multer field definitions in the route and process them in the controller; upload to Cloudinary as needed.
- For payments, encapsulate provider-specific logic in dedicated controller functions; prefer webhook-based verification.



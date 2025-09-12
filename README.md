# 🛒 E-Commerce Platform

A full-stack modern e-commerce platform built with React, Node.js, Express, and MongoDB. Features a customer-facing storefront, comprehensive admin dashboard, and robust backend API with advanced security and performance optimizations.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node Version](https://img.shields.io/badge/Node-18%2B-green)

## 🏗️ Project Architecture

### Frontend Applications
- **Customer Store** (`Frontend/`) - React + Vite customer-facing e-commerce application
- **Admin Dashboard** (`admin/`) - React + Vite admin panel for store management

### Backend Services  
- **API Server** (`Backend/`) - Node.js/Express REST API with MongoDB integration
- **Authentication** - JWT-based authentication system
- **Payment Processing** - Stripe integration for secure payments
- **Image Management** - Cloudinary integration for optimized image storage

## ✨ Key Features

### 🛍️ Customer Features
- **User Authentication** - Secure registration, login, and profile management
- **Product Catalog** - Browse products with advanced filtering and search
- **Shopping Cart** - Add, remove, and manage cart items with real-time updates
- **Secure Checkout** - Stripe integration for payment processing
- **Order Management** - View order history and track order status
- **Product Reviews** - Rate and review products
- **Wishlist** - Save favorite products for later
- **Coupon System** - Apply discount codes during checkout
- **Responsive Design** - Mobile-first design with Tailwind CSS

### 👨‍💼 Admin Features
- **Analytics Dashboard** - Comprehensive sales and performance analytics
- **Product Management** - Add, edit, and manage product inventory
- **Order Management** - Process and track customer orders
- **User Management** - View and manage customer accounts
- **Coupon Management** - Create and manage discount codes
- **Review Moderation** - Monitor and manage product reviews
- **Sales Reports** - Generate detailed sales analytics

### 🔧 Technical Features
- **Security** - JWT authentication, rate limiting, input validation, XSS protection
- **Performance** - Response compression, caching, optimized database queries
- **Testing** - Comprehensive test suite with Jest and Supertest
- **API Documentation** - Well-documented RESTful APIs
- **Error Handling** - Centralized error handling and logging
- **Deployment Ready** - Configured for Vercel deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- Cloudinary account (for image storage)
- Stripe account (for payment processing)

### 1. Clone Repository
```bash
git clone https://github.com/HasithaMadhushan/E-Commerce-Web.git
cd E-Commerce-Web
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies  
cd ../Frontend
npm install

# Install admin dependencies
cd ../admin
npm install
```

### 3. Environment Setup

#### Backend Configuration
```bash
cd Backend
cp .env.example .env
```

Edit `Backend/.env` with your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

#### Frontend Configuration
```bash
cd Frontend
cp .env.example .env
```

Edit `Frontend/.env`:
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

#### Admin Configuration
```bash
cd admin
cp .env.example .env
```

Edit `admin/.env`:
```env
VITE_BACKEND_URL=http://localhost:4000
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend API (http://localhost:4000)
cd Backend
npm run dev

# Terminal 2 - Customer Frontend (http://localhost:5173)
cd Frontend
npm run dev

# Terminal 3 - Admin Dashboard (http://localhost:5174)
cd admin
npm run dev
```

## 📁 Project Structure

```
E-Commerce-Web/
├── Backend/                 # Node.js API Server
│   ├── config/             # Database and service configurations
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── tests/             # Test suites
│   └── Server.js          # Entry point
├── Frontend/               # Customer React App
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── assets/        # Static assets
│   └── dist/             # Build output
├── admin/                  # Admin React App
│   ├── src/
│   │   ├── components/    # Admin UI components
│   │   ├── pages/         # Admin pages
│   │   └── assets/        # Admin assets
│   └── dist/             # Build output
└── docs/                  # Documentation files
```

## 🧪 Testing

```bash
# Run backend tests
cd Backend
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `POST /api/user/admin` - Admin login

### Product Endpoints
- `GET /api/product/list` - Get all products
- `POST /api/product/add` - Add new product (Admin)
- `PUT /api/product/update` - Update product (Admin)
- `DELETE /api/product/remove` - Remove product (Admin)

### Order Endpoints
- `POST /api/order/place` - Place new order
- `GET /api/order/userorders` - Get user orders
- `GET /api/order/list` - Get all orders (Admin)
- `PUT /api/order/status` - Update order status (Admin)

### Cart Endpoints
- `POST /api/cart/get` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item

### Review Endpoints
- `POST /api/review/add` - Add product review
- `GET /api/review/product/:id` - Get product reviews
- `DELETE /api/review/delete` - Delete review

## 🌍 Deployment

### Vercel Deployment (Recommended)

1. **Deploy Backend**
   ```bash
   # Connect your repository to Vercel
   # Deploy from Backend/ directory
   # Set environment variables in Vercel dashboard
   ```

2. **Deploy Frontend & Admin**
   ```bash
   # Create separate Vercel projects for Frontend and admin
   # Update environment variables with production backend URL
   ```

### Manual Deployment

1. **Backend Setup**
   ```bash
   # Build and start the backend
   cd Backend
   npm start
   ```

2. **Frontend Build**
   ```bash
   # Build customer frontend
   cd Frontend
   npm run build
   
   # Build admin dashboard
   cd ../admin
   npm run build
   ```

For detailed deployment instructions, see [deployment-guide.md](./deployment-guide.md).

## 🔒 Security Features

- **Authentication** - JWT-based secure authentication
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Comprehensive input validation and sanitization
- **XSS Protection** - Cross-site scripting prevention
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **Helmet Security** - Security headers implementation
- **Environment Variables** - Secure credential management

## 🚀 Performance Optimizations

- **Response Compression** - Gzip compression for faster loading
- **Image Optimization** - Cloudinary integration for optimized images
- **Caching** - Strategic caching implementation
- **Code Splitting** - Optimized bundle splitting
- **Database Indexing** - Optimized MongoDB queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💡 Support

If you have any questions or need help with setup, please open an issue in the GitHub repository.

## 🎯 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-vendor marketplace support
- [ ] International shipping options
- [ ] Advanced SEO optimizations

---

**Built with ❤️ by [Hasitha Madhushan](https://github.com/HasithaMadhushan)**

# E-Commerce Platform Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Cloudinary account for image storage
- Stripe account for payments
- Email service (Gmail with app password or SendGrid)

## Environment Setup

### 1. Backend Configuration

Copy and configure environment variables:
```bash
cd Backend
cp .env.example .env
```

Update `.env` with your actual values:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Strong random string for JWT signing
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `CLOUDINARY_*`: Your Cloudinary credentials
- `SMTP_*`: Your email service credentials

### 2. Frontend Configuration

```bash
cd Frontend
cp .env.example .env
```

Update with:
- `VITE_BACKEND_URL`: Your backend API URL
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key

### 3. Admin Panel Configuration

```bash
cd admin
cp .env.example .env
```

Update with:
- `VITE_BACKEND_URL`: Your backend API URL

## Local Development

### 1. Install Dependencies

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install

# Admin Panel
cd ../admin
npm install
```

### 2. Start Services

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev

# Terminal 3 - Admin Panel
cd admin
npm run dev
```

### 3. Run Tests

```bash
cd Backend
npm test
```

## Production Deployment

### Option 1: Vercel (Recommended)

#### Backend Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy from `Backend` directory

#### Frontend Deployment
1. Connect repository to Vercel
2. Set environment variables
3. Deploy from `Frontend` directory
4. Update `VITE_BACKEND_URL` to production backend URL

#### Admin Panel Deployment
1. Connect repository to Vercel
2. Set environment variables
3. Deploy from `admin` directory

### Option 2: Traditional VPS

#### Backend Setup
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone <your-repo>
cd Backend
npm install --production
cp .env.example .env
# Configure .env with production values

# Start with PM2
pm2 start Server.js --name "ecommerce-backend"
pm2 startup
pm2 save
```

#### Frontend Setup
```bash
cd Frontend
npm install
npm run build

# Serve with nginx or Apache
sudo cp -r dist/* /var/www/html/
```

### Option 3: Docker

#### Create Dockerfile for Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4000
CMD ["node", "Server.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./Backend
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/ecommerce
    depends_on:
      - mongo
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## Database Setup

### MongoDB Atlas (Cloud)
1. Create cluster at mongodb.com
2. Create database user
3. Whitelist IP addresses
4. Get connection string

### Local MongoDB
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start service
sudo systemctl start mongodb
```

## SSL/HTTPS Setup

### Using Cloudflare (Free)
1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption

### Using Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Monitoring and Logging

### Backend Monitoring
```bash
# Install monitoring tools
npm install --save winston morgan helmet

# PM2 monitoring
pm2 monit
pm2 logs
```

### Error Tracking
- Integrate Sentry for error tracking
- Set up log aggregation (ELK stack or similar)
- Monitor API response times

## Performance Optimization

### Backend
- Enable compression middleware
- Implement Redis caching
- Optimize database queries
- Use CDN for static assets

### Frontend
- Enable code splitting
- Optimize images (WebP format)
- Implement lazy loading
- Use service workers for caching

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] Security headers configured
- [ ] Regular dependency updates

## Backup Strategy

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/ecommerce" --out=/backup/

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backup/mongo_$DATE"
```

### File Backup
- Backup uploaded images (Cloudinary handles this)
- Backup configuration files
- Version control for code

## Scaling Considerations

### Horizontal Scaling
- Load balancer (nginx, HAProxy)
- Multiple backend instances
- Database replication
- CDN for static content

### Vertical Scaling
- Increase server resources
- Optimize database performance
- Implement caching layers

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN in backend .env
   - Verify frontend URL matches

2. **Database Connection**
   - Verify MongoDB URI
   - Check network connectivity
   - Validate credentials

3. **Payment Issues**
   - Verify Stripe keys
   - Check webhook endpoints
   - Test in Stripe dashboard

4. **Email Not Sending**
   - Verify SMTP credentials
   - Check spam folders
   - Test email service

### Debug Commands
```bash
# Check backend logs
pm2 logs ecommerce-backend

# Test database connection
mongo "mongodb://localhost:27017/ecommerce"

# Check API endpoints
curl -X GET http://localhost:4000/api/product/list

# Test email service
node -e "require('./services/emailService.js').sendEmail('test@example.com', 'Test', 'Hello')"
```

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor error logs daily
- Backup database weekly
- Security audit quarterly
- Performance review monthly

### Update Process
```bash
# Update dependencies
npm update
npm audit fix

# Test updates
npm test

# Deploy updates
git push origin main
```

This deployment guide ensures a smooth transition from development to production with proper security, monitoring, and maintenance procedures.
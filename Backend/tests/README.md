# E-Commerce Backend Testing Suite

This directory contains comprehensive tests for the e-commerce backend API.

## Test Structure

- `setup.js` - Test database setup and teardown utilities
- `auth.test.js` - Authentication and user management tests
- `product.test.js` - Product search, filtering, and management tests
- `order.test.js` - Order placement and management tests
- `coupon.test.js` - Coupon validation and application tests
- `integration.test.js` - End-to-end integration tests

## Running Tests

### Install Test Dependencies
```bash
npm install --save-dev jest mongodb-memory-server supertest
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- auth.test.js
```

## Test Coverage

The test suite covers:

### Authentication & User Management
- User registration with validation
- User login with credentials
- Password strength validation
- Duplicate email prevention
- Profile management
- Wishlist functionality

### Product Management
- Product listing and search
- Advanced filtering (category, price, rating, etc.)
- Sorting options
- Stock management
- Filter options API

### Order Management
- COD order placement
- Stripe payment flow
- Stock validation and decrement
- Order status tracking
- User order history

### Coupon System
- Coupon validation
- Discount calculations (percentage and fixed)
- Usage limits and expiration
- Minimum order amount validation
- Maximum discount caps

### Integration Tests
- Complete user journey from registration to order
- Wishlist add/remove flow
- Search and filtering combinations
- Multi-product scenarios

## Test Database

Tests use MongoDB Memory Server for isolated testing:
- Each test suite gets a fresh database
- No interference with development/production data
- Fast test execution
- Automatic cleanup

## Environment Variables

Tests use mock values for external services:
- Stripe payments are mocked
- Email service is mocked
- Cloudinary uploads are mocked

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: Database is cleared between tests
3. **Mocking**: External services are properly mocked
4. **Coverage**: Aim for >80% code coverage
5. **Performance**: Tests should complete within 30 seconds

## Adding New Tests

When adding new features:

1. Create unit tests for individual functions
2. Add integration tests for complete workflows
3. Mock external dependencies
4. Test both success and error scenarios
5. Validate input sanitization and security

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Deterministic results
- Proper exit codes
- Coverage reporting
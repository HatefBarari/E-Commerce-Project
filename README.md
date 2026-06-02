# Code1Sprint — Online Shop API

REST backend for an online shop, developed as part of the **code1sprint** project. This service provides user management, products, shopping cart, payment (Zarinpal), orders, and role-based access (user, seller, admin) using Node.js and Express.

## Features

- **OTP authentication**: Send and verify one-time codes (Redis), JWT issuance, `/api/v1/auth/me` endpoint
- **Users and addresses**: Manage shipping addresses, ban users (admin)
- **Categories**: Categories and subcategories with icon upload (admin)
- **Products**: Product CRUD, multi-image upload, seller listings per product
- **Sellers**: Seller profiles, seller registration requests (admin approval)
- **Shopping cart**: Add, remove, and view cart items (authenticated user)
- **Checkout and payment**: Create checkout from cart, **Zarinpal** gateway, payment verification
- **Orders**: List orders, update status (admin)
- **Comments**: Product reviews, replies, admin moderation
- **Notes**: Personal user notes on products
- **Locations**: City list (province/city JSON files)
- **Product short links**: `GET /p/:shortIdentifier` redirects to the product
- **Swagger UI**: Interactive API docs at `/apis`

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | HTTP framework |
| MongoDB + Mongoose | Database |
| Redis (ioredis) | OTP storage and TTL |
| JWT + bcrypt | Tokens and OTP hashing |
| Multer | Image uploads |
| Yup | Input validation |
| Zarinpal (axios) | Payment gateway |
| swagger-jsdoc + swagger-ui-express | API documentation |

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB running
- Redis running

## Environment Variables

Create a `.env` file at the project root. **Do not commit real values**; variable names only:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default in code: 4000 if unset) |
| `NODE_ENV` | `production` or development (`dotenv` is not used in production) |
| `MONGO_URI` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/shop` |
| `JWT_SECRET` | JWT signing secret |
| `REDIS_URI` | Redis connection string, e.g. `redis://localhost:6379/` |
| `SMS_UNAME` | SMS panel username |
| `SMS_PASSWORD` | SMS panel password |
| `SMS_FROM` | SMS sender number/line |
| `VERIFY_PATTERN_CODE` | OTP pattern code in the SMS panel |
| `ZARINPAL_API_BASE_URL` | Zarinpal API base URL |
| `ZARINPAL_MERCHANT_ID` | Merchant ID |
| `ZARINPAL_PAYMENT_CALLBACK_URL` | Callback URL after payment |
| `ZARINPAL_PAYMENT_BASE_URL` | Base URL for redirecting users to the gateway |

> **Note:** The `services/otp.js` service currently stubs SMS delivery (`sendSms` is a no-op). Implement the SMS panel integration for real OTP delivery.

## Install and Run

```bash
git clone <repository-url>
cd E-Commerce-Project
npm install
```

Fill in `.env` with the variables above, then:

```bash
# Development (nodemon)
npm run dev

# Production
npm start
```

The server listens on `PORT` after connecting to MongoDB.

## API Documentation (Swagger)

After starting the server:

- **Swagger UI:** `http://localhost:<PORT>/apis`

Base definition lives in `utils/swagger.js`; YAML route files under `docs/` are merged into the spec when present.

## Project Structure (Summary)

```
├── app.js                 # Express app, route mounts, Swagger, static files
├── server.js              # MongoDB connection and server start
├── redis.js               # Redis client
├── routes/v1/             # API v1 routes
├── controllers/v1/        # Request handlers
├── models/                # Mongoose schemas
├── middlewares/           # auth, roleGuard, headers, errorHandler
├── validators/            # Yup schemas
├── services/              # OTP, Zarinpal
├── helpers/               # Standard response helpers
├── utils/                 # Swagger, Multer
├── public/images/         # Uploaded files
└── cities/                # provinces.json, cities.json
```

### API Prefix

All main endpoints are under `/api/v1/`, except the short link `/p/:shortIdentifier`.

| Route | Topic |
|-------|-------|
| `/api/v1/auth` | OTP and profile |
| `/api/v1/users` | Users and addresses |
| `/api/v1/categories` | Categories and subcategories |
| `/api/v1/products` | Products |
| `/api/v1/sellers` | Sellers |
| `/api/v1/seller-requests` | Seller registration requests |
| `/api/v1/cart` | Shopping cart |
| `/api/v1/checkout` | Payment |
| `/api/v1/orders` | Orders |
| `/api/v1/comments` | Comments |
| `/api/v1/notes` | Notes |
| `/api/v1/locations` | Cities |

## License

This project is released under the **MIT License**. See [LICENSE](./LICENSE) at the repository root.

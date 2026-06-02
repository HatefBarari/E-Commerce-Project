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
| `PORT` | Server port (example `.env`: 3000; code default: 4000 if unset) |
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

## API Reference

All examples use base URL **`http://localhost:3000`** (match your `.env` `PORT`; code falls back to **4000** if `PORT` is unset). Replace placeholder IDs with real MongoDB ObjectIds from your database.

### Authentication

Protected routes expect:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Roles are stored on the user document: `USER`, `SELLER`, `ADMIN`. `roleGuard` checks for an exact role string (e.g. `ADMIN`).

**OTP flow:** call **send OTP** → receive SMS (stubbed in dev; OTP is hardcoded to `1111` in code) → call **verify OTP** → use the returned `token` as `YOUR_JWT_TOKEN`. The first registered user receives the `ADMIN` role. Set `"isSeller": true` on verify to register with `USER` + `SELLER` roles.

---

### Auth (`/api/v1/auth`)

#### `POST /api/v1/auth/send` — Send OTP to phone

```bash
curl -X POST http://localhost:3000/api/v1/auth/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "09123456789"}'
```

#### `POST /api/v1/auth/verify` — Verify OTP and get JWT

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09123456789",
    "otp": "1111",
    "isSeller": false
  }'
```

| Field | Type | Notes |
|-------|------|-------|
| `phone` | string | Required |
| `otp` | string | Numeric OTP |
| `isSeller` | boolean | Required; `true` adds `SELLER` role on new users |

#### `GET /api/v1/auth/me` — Current user profile

Requires authentication.

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Users (`/api/v1/users`)

#### `GET /api/v1/users` — List users (admin)

Query: `page` (default `1`), `limit` (default `10`). Requires `ADMIN`.

```bash
curl "http://localhost:3000/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `POST /api/v1/users/ban/:userId` — Ban user (admin)

Deletes the user and blocks their phone. Requires `ADMIN`.

```bash
curl -X POST http://localhost:3000/api/v1/users/ban/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `POST /api/v1/users/me/addresses` — Add shipping address

```bash
curl -X POST http://localhost:3000/api/v1/users/me/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home",
    "postalCode": "1234567890",
    "address": "123 Main Street, Tehran",
    "location": { "lat": 35.6892, "lng": 51.3890 },
    "cityId": 1
  }'
```

#### `PATCH /api/v1/users/me/addresses/:addressId` — Update address (partial)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/me/addresses/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Office", "postalCode": "0987654321"}'
```

#### `DELETE /api/v1/users/me/addresses/:addressId` — Remove address

```bash
curl -X DELETE http://localhost:3000/api/v1/users/me/addresses/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Locations (`/api/v1/locations`)

#### `GET /api/v1/locations` — Provinces and cities

Public.

```bash
curl http://localhost:3000/api/v1/locations
```

---

### Categories (`/api/v1/categories`)

#### `GET /api/v1/categories` — Category tree (with subcategories)

Public.

```bash
curl http://localhost:3000/api/v1/categories
```

#### `POST /api/v1/categories` — Create category (admin, multipart)

Requires `ADMIN`. Fields: `title`, `slug`, optional `parent`, `description`, `filters` (JSON string), optional file `icon`.

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Electronics" \
  -F "slug=electronics" \
  -F "description=Electronic devices" \
  -F 'filters=[{"name":"Brand","slug":"brand","type":"selectbox","required":true,"options":["Sony","Samsung"]}]' \
  -F "icon=@./icon.png"
```

#### `PUT /api/v1/categories/:categoryId` — Update category (admin, multipart)

Requires `ADMIN`. Same fields as create (all optional on edit).

```bash
curl -X PUT http://localhost:3000/api/v1/categories/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Electronics & Gadgets" \
  -F "slug=electronics-gadgets"
```

#### `DELETE /api/v1/categories/:categoryId` — Delete category (admin)

```bash
curl -X DELETE http://localhost:3000/api/v1/categories/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `GET /api/v1/categories/sub` — List all subcategories

Public.

```bash
curl http://localhost:3000/api/v1/categories/sub
```

#### `POST /api/v1/categories/sub` — Create subcategory (admin)

Requires `ADMIN`. JSON body.

```bash
curl -X POST http://localhost:3000/api/v1/categories/sub \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smartphones",
    "slug": "smartphones",
    "parent": "507f1f77bcf86cd799439011",
    "description": "Mobile phones",
    "filters": []
  }'
```

#### `GET /api/v1/categories/sub/:categoryId` — Get one subcategory

Public. `:categoryId` is the subcategory document ID.

```bash
curl http://localhost:3000/api/v1/categories/sub/507f1f77bcf86cd799439012
```

#### `PUT /api/v1/categories/sub/:categoryId` — Update subcategory (admin)

```bash
curl -X PUT http://localhost:3000/api/v1/categories/sub/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Phones & Tablets", "slug": "phones-tablets"}'
```

#### `DELETE /api/v1/categories/sub/:categoryId` — Delete subcategory (admin)

```bash
curl -X DELETE http://localhost:3000/api/v1/categories/sub/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Products (`/api/v1/products`)

#### `GET /api/v1/products` — List / filter products

Public. Query parameters:

| Param | Description |
|-------|-------------|
| `name` | Case-insensitive name search |
| `subCategory` | Subcategory ObjectId |
| `minPrice` / `maxPrice` | Price range on seller offers |
| `sellerId` | Filter by seller ObjectId |
| `filterValues` | URL-encoded JSON object, e.g. `{"brand":"Sony"}` |
| `page` / `limit` | Pagination (defaults `1` / `10`) |

```bash
curl "http://localhost:3000/api/v1/products?name=phone&page=1&limit=10"
```

```bash
curl "http://localhost:3000/api/v1/products?filterValues=%7B%22brand%22%3A%22Sony%22%7D"
```

#### `GET /api/v1/products/:id` — Product details

Public.

```bash
curl http://localhost:3000/api/v1/products/507f1f77bcf86cd799439013
```

#### `POST /api/v1/products` — Create product (admin, multipart)

Requires `ADMIN`. Up to 10 images field `images`. JSON fields are sent as **strings** in multipart form: `sellers`, `filterValues`, `customFilters`.

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Wireless Headphones" \
  -F "slug=wireless-headphones" \
  -F "description=Noise-cancelling over-ear headphones" \
  -F "subCategory=507f1f77bcf86cd799439012" \
  -F 'sellers=[{"id":"507f1f77bcf86cd799439014","price":2500000,"stock":50}]' \
  -F 'filterValues={"brand":"Sony"}' \
  -F 'customFilters={"color":"black"}' \
  -F "images=@./product1.webp" \
  -F "images=@./product2.webp"
```

#### `PATCH /api/v1/products/:id` — Update product (admin, multipart)

Requires `ADMIN`. Optional fields: `name`, `slug`, `description`, `subCategory`, `filterValues`, `customFilters`, `images` (replaces images when provided).

```bash
curl -X PATCH http://localhost:3000/api/v1/products/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Wireless Headphones Pro" \
  -F 'filterValues={"brand":"Sony","warranty":"2y"}'
```

#### `DELETE /api/v1/products/:id` — Delete product (admin)

```bash
curl -X DELETE http://localhost:3000/api/v1/products/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Sellers (`/api/v1/sellers`)

All routes require authentication and `SELLER` role (seller profile must exist except on first `POST` create).

#### `POST /api/v1/sellers` — Create seller profile

```bash
curl -X POST http://localhost:3000/api/v1/sellers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Store",
    "contactDetails": { "phone": "09121111111" },
    "cityId": 1
  }'
```

#### `GET /api/v1/sellers` — Get own seller profile

```bash
curl http://localhost:3000/api/v1/sellers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `PATCH /api/v1/sellers` — Update seller profile

```bash
curl -X PATCH http://localhost:3000/api/v1/sellers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Tech Store Plus", "cityId": 2}'
```

#### `DELETE /api/v1/sellers` — Delete seller profile

```bash
curl -X DELETE http://localhost:3000/api/v1/sellers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Seller requests (`/api/v1/seller-requests`)

#### `GET /api/v1/seller-requests` — List own requests (seller)

Requires `SELLER`. Query: `status` (default `pending`), `page`, `limit`.

```bash
curl "http://localhost:3000/api/v1/seller-requests?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `POST /api/v1/seller-requests` — Request to sell a product (seller)

Requires `SELLER`.

```bash
curl -X POST http://localhost:3000/api/v1/seller-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439013",
    "price": 2400000,
    "stock": 25
  }'
```

#### `PATCH /api/v1/seller-requests/:id` — Approve or reject (admin)

Requires `ADMIN`. `status`: `"accept"` or `"reject"`.

```bash
curl -X PATCH http://localhost:3000/api/v1/seller-requests/507f1f77bcf86cd799439015 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accept",
    "adminComments": "Approved for listing"
  }'
```

#### `DELETE /api/v1/seller-requests/:id` — Cancel own request (seller)

Requires `SELLER`.

```bash
curl -X DELETE http://localhost:3000/api/v1/seller-requests/507f1f77bcf86cd799439015 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Cart (`/api/v1/cart`)

All routes require authentication.

#### `GET /api/v1/cart` — Get current cart

```bash
curl http://localhost:3000/api/v1/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `POST /api/v1/cart/add` — Add item to cart

```bash
curl -X POST http://localhost:3000/api/v1/cart/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439013",
    "sellerId": "507f1f77bcf86cd799439014",
    "quantity": 2
  }'
```

#### `DELETE /api/v1/cart/remove` — Remove item from cart

Request body required on DELETE.

```bash
curl -X DELETE http://localhost:3000/api/v1/cart/remove \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439013",
    "sellerId": "507f1f77bcf86cd799439014"
  }'
```

---

### Checkout (`/api/v1/checkout`)

#### `POST /api/v1/checkout` — Create checkout and Zarinpal payment URL

Requires authentication. Cart must not be empty.

```bash
curl -X POST http://localhost:3000/api/v1/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "address": "123 Main Street, Tehran",
      "location": { "lat": 35.6892, "lng": 51.3890 },
      "cityId": 1
    }
  }'
```

Response includes `paymentUrl` — redirect the user to Zarinpal. Callback hits verify with query params from the gateway.

#### `GET /api/v1/checkout/verify` — Verify payment (Zarinpal callback)

Public. Called by Zarinpal redirect with query `Status` and `Authority` (case as returned by gateway).

```bash
curl "http://localhost:3000/api/v1/checkout/verify?Status=OK&Authority=A000000000000000000000000000000000"
```

---

### Orders (`/api/v1/orders`)

#### `GET /api/v1/orders` — List orders

Requires authentication. **Users** see only their orders; **admins** see all. Query: `page`, `limit`.

```bash
curl "http://localhost:3000/api/v1/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `PATCH /api/v1/orders/:id` — Update order status (admin)

Requires `ADMIN`. `status`: `PROCESSING`, `SHIPPED`, or `DELIVERED`.

```bash
curl -X PATCH http://localhost:3000/api/v1/orders/507f1f77bcf86cd799439016 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SHIPPED",
    "postTrackingCode": "IR1234567890"
  }'
```

---

### Comments (`/api/v1/comments`)

#### `GET /api/v1/comments` — Comments for a product

Public. **Required** query: `productId`.

```bash
curl "http://localhost:3000/api/v1/comments?productId=507f1f77bcf86cd799439013"
```

#### `POST /api/v1/comments` — Create review

Requires authentication.

```bash
curl -X POST http://localhost:3000/api/v1/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439013",
    "rating": 5,
    "content": "Great product, fast delivery."
  }'
```

#### `GET /api/v1/comments/all` — All comments (admin)

Requires `ADMIN`. Query: `page`, `limit`.

```bash
curl "http://localhost:3000/api/v1/comments/all?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `PATCH /api/v1/comments/:commentId` — Update own comment

Requires authentication (comment owner).

```bash
curl -X PATCH http://localhost:3000/api/v1/comments/507f1f77bcf86cd799439017 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "content": "Updated review after more use."}'
```

#### `DELETE /api/v1/comments/:commentId` — Delete comment (admin)

Requires `ADMIN`.

```bash
curl -X DELETE http://localhost:3000/api/v1/comments/507f1f77bcf86cd799439017 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `POST /api/v1/comments/:commentId/reply` — Add reply

Requires authentication.

```bash
curl -X POST http://localhost:3000/api/v1/comments/507f1f77bcf86cd799439017/reply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Thanks for your feedback!"}'
```

#### `PATCH /api/v1/comments/:commentId/reply/:replyId` — Update reply

Requires authentication.

```bash
curl -X PATCH http://localhost:3000/api/v1/comments/507f1f77bcf86cd799439017/reply/507f1f77bcf86cd799439018 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated reply text."}'
```

#### `DELETE /api/v1/comments/:commentId/reply/:replyId` — Delete reply

Requires authentication.

```bash
curl -X DELETE http://localhost:3000/api/v1/comments/507f1f77bcf86cd799439017/reply/507f1f77bcf86cd799439018 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Notes (`/api/v1/notes`)

Personal product notes for the authenticated user.

#### `GET /api/v1/notes` — List notes

Query: `page`, `limit`.

```bash
curl "http://localhost:3000/api/v1/notes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `POST /api/v1/notes` — Add note on a product

```bash
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439013",
    "content": "Compare with model X before buying."
  }'
```

#### `GET /api/v1/notes/:noteId` — Get one note

```bash
curl http://localhost:3000/api/v1/notes/507f1f77bcf86cd799439019 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### `PUT /api/v1/notes/:noteId` — Update note

```bash
curl -X PUT http://localhost:3000/api/v1/notes/507f1f77bcf86cd799439019 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Wait for sale — target price 2M."}'
```

#### `DELETE /api/v1/notes/:noteId` — Delete note

```bash
curl -X DELETE http://localhost:3000/api/v1/notes/507f1f77bcf86cd799439019 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Short links

#### `GET /p/:shortIdentifier` — Redirect to product API

Public. Redirects to `GET /api/v1/products/:id` when the short code exists.

```bash
curl -L http://localhost:3000/p/abc123
```

---

### Endpoint summary

| Group | Count |
|-------|------:|
| Auth | 3 |
| Users | 5 |
| Locations | 1 |
| Categories | 9 |
| Products | 5 |
| Sellers | 4 |
| Seller requests | 4 |
| Cart | 3 |
| Checkout | 2 |
| Orders | 2 |
| Comments | 8 |
| Notes | 5 |
| Short links | 1 |
| **Total** | **52** |

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

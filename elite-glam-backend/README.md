# Elite Glam Backend API

Node.js/Express backend API for the Elite Glam Mobile App, with MongoDB database integration.

## Features

- **Authentication**: User registration, login, and profile management
- **Services API**: CRUD operations for beauty services
- **Bookings API**: Appointment scheduling and management
- **Products API**: Beauty product catalog
- **MongoDB Integration**: Data persistence with Mongoose ODM

## Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB installation)

## Installation

1. Clone the repository (if not already done)
2. Navigate to the backend directory:
   ```bash
   cd elite-glam-backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root of the backend directory with the following variables:

```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Replace `your_mongodb_connection_string` with your actual MongoDB connection string and `your_jwt_secret_key` with a secure random string.

## MongoDB Connection

To verify your MongoDB connection and IP whitelist status:

```bash
node whitelist-ip.js
```

This script will:
1. Check if your MongoDB connection string is valid
2. Display your current public IP address
3. Test the connection to MongoDB
4. Provide instructions if IP whitelisting is needed

## Running the Server

Start the development server:

```bash
npm start
```

Or with nodemon for auto-reloading:

```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 3001).

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (requires authentication)
- `PUT /auth/profile` - Update user profile (requires authentication)

### Services

- `GET /services` - List all services
- `GET /services/:id` - Get a specific service
- `POST /services` - Create a new service (requires authentication)
- `PUT /services/:id` - Update a service (requires authentication)
- `DELETE /services/:id` - Delete a service (requires authentication)

### Bookings

- `GET /bookings` - List all bookings for the authenticated user
- `GET /bookings/:id` - Get a specific booking
- `POST /bookings` - Create a new booking
- `PUT /bookings/:id` - Update a booking
- `DELETE /bookings/:id` - Cancel a booking

### Products

- `GET /products` - List all products
- `GET /products/:id` - Get a specific product
- `POST /products` - Add a new product (requires authentication)
- `PUT /products/:id` - Update a product (requires authentication)
- `DELETE /products/:id` - Delete a product (requires authentication)

## Error Handling

The API uses a consistent error response format:

```json
{
  "message": "Error message",
  "error": "Detailed error information (development mode only)"
}
```

## License

This project is licensed under the MIT License. 
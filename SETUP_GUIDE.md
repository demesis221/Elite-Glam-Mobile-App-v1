# Elite Glam App Setup Guide

## 1. Database Setup
1. **Set up MongoDB:**
   - **Option 1 (Recommended):** Create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
   - **Option 2:** Install MongoDB locally from [mongodb.com/try/download](https://www.mongodb.com/try/download/community)

2. **Get your connection string:**
   - For Atlas: Copy the connection string from your cluster
   - For local: Use `mongodb://localhost:27017/eliteglam`

3. **Create a .env file in the backend directory:**
   ```
   cd elite-glam-backend
   ```

   Create a file named `.env` with the following content:
   ```
   PORT=3001
   MONGODB_URI=mongodb+srv://ernestojrbeltran16:tTxfdDv2DMvtoAp9@cluster0.sxensbd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=elite_glam_secret_key_for_jwt_token
   NODE_ENV=development
   ```
   
   Replace `your_connection_string_here` with your actual MongoDB connection string.

4. **Database connection is already set up:**
   - The line `connectDB();` has been uncommented in `elite-glam-backend/server.js`

## 2. Starting the System
1. **Start backend:**
   ```
   cd elite-glam-backend
   npm install
   npm run dev
   ```

2. **Start frontend:**
   ```
   cd elite-glam-frontend
   npm install
   npm start
   ```

   For mobile development:
   - Install Expo Go app on your device
   - Scan the QR code displayed in the terminal
   - Or use an emulator/simulator

## 3. Testing the System
1. **Register a user:**
   - Test endpoint: POST http://localhost:3001/auth/register
   - Required fields: username, email, password
   - Example using curl:
     ```
     curl -X POST http://localhost:3001/auth/register \
       -H "Content-Type: application/json" \
       -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
     ```

2. **Create test products:**
   - Test endpoint: POST http://localhost:3001/products
   - Required fields: name, description, price, category, size, image, location
   - Example using curl:
     ```
     curl -X POST http://localhost:3001/products \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer YOUR_TOKEN_HERE" \
       -d '{"name":"Test Product","description":"Product description","price":99.99,"category":"makeup","size":"medium","image":"https://example.com/image.jpg","location":"New York"}'
     ```

3. **API Configuration:**
   - The frontend is already configured to connect to the backend
   - For mobile development, you may need to set your local IP:
     - In the app, navigate to settings and enter your local network IP

## 4. Common Issues & Solutions
- **CORS errors:** Backend is already configured with CORS
- **Connection errors:** Ensure MongoDB is running and connection string is correct
- **Authentication errors:** Check JWT secret in .env matches what's used in code
- **Mobile connection issues:** Make sure your device is on the same network as your development machine

## 5. Next Steps for Production
- Set up proper error logging
- Add input validation
- Improve security measures
- Deploy to hosting service (Render, Heroku, etc.)

## 6. API Documentation
The backend provides the following endpoints:

### Auth
- POST `/auth/register` - Register a new user
- POST `/auth/login` - Login a user
- GET `/auth/profile` - Get user profile (requires authentication)

### Products
- GET `/products` - Get all products
- GET `/products/:id` - Get a specific product
- POST `/products` - Create a new product (requires authentication)
- PUT `/products/:id` - Update a product (requires authentication)
- DELETE `/products/:id` - Delete a product (requires authentication)

### Bookings
- GET `/bookings` - Get all bookings
- GET `/bookings/:id` - Get a specific booking
- POST `/bookings` - Create a new booking (requires authentication)
- PUT `/bookings/:id` - Update a booking (requires authentication)
- DELETE `/bookings/:id` - Delete a booking (requires authentication)

### Services
- GET `/services` - Get all services
- GET `/services/:id` - Get a specific service
- POST `/services` - Create a new service (requires authentication)
- PUT `/services/:id` - Update a service (requires authentication)
- DELETE `/services/:id` - Delete a service (requires authentication) 
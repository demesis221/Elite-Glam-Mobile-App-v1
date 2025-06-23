# Project Handoff: Elite Glam Mobile App

## 1. Project Summary

*   **Application Purpose**: Elite Glam is a mobile marketplace for renting high-end clothing and accessories. It connects individuals looking to rent items (**Renters**) with those who supply them (**Freelancers**). The app features distinct interfaces and functionality tailored to each user role.
*   **Tech Stack**:
    *   **Frontend**: React Native, Expo, TypeScript
    *   **Navigation**: Expo Router (File-based routing)
    *   **State Management**: React Context API (`AuthContext`, `CartContext`, etc.)
    *   **Local Storage**: AsyncStorage
    *   **Backend**: Node.js with Express.js
    *   **Database**: MongoDB
*   **Target Platform**: Mobile (iOS & Android)

## 2. Project Structure

The project follows a standard Expo project structure with some key conventions.

```
/
├── app/                # Expo Router screens and layouts. The core of the app's navigation.
│   ├── (auth)/         # Authentication screens (login, register).
│   ├── (renter)/       # Screens and layout for the "Renter" user role.
│   ├── (freelancer)/   # Screens and layout for the "Freelancer" user role.
│   └── _layout.tsx     # Root layout of the entire application.
├── assets/             # Static assets like images and fonts.
├── components/         # Reusable React components used across multiple screens.
├── contexts/           # Global state management using React Context API.
├── services/           # API layer to communicate with the backend.
├── oldui/              # IMPORTANT: A reference copy of a previous stable UI. Used as a blueprint for recent fixes.
├── .env                # Environment variables (e.g., API URL).
└── package.json        # Project dependencies and scripts.
```

*   **Important Files**:
    *   `app/_layout.tsx`: The root entry point for the app's UI. It wraps the entire application in necessary context providers.
    *   `contexts/AuthContext.tsx`: The single source of truth for authentication state and role-based navigation logic. **This is a critical file.**
    *   `services/api.ts`: The Axios instance and service functions for communicating with the backend API.

## 3. Authentication and Authorization

*   **Auth Method**: The app uses a custom JWT-based authentication system. On successful login, a token and user data are retrieved from the backend and stored locally in `AsyncStorage`.
*   **User Roles**:
    *   `renter`: A standard user who can browse and rent items.
    *   `freelancer`: A user who can list and manage items for rent.
    *   `admin`: (Defined, but not fully implemented).
    *   `user`: An alias for the `renter` role.
*   **Role-Based Access Control**:
    *   RBAC is implemented centrally within `contexts/AuthContext.tsx`.
    *   A `useEffect` hook monitors the authentication state and user role, automatically redirecting the user to the correct route group (`/(renter)` or `/(freelancer)`). This prevents race conditions and ensures that users can only access sections of the app they are authorized for.

    ```typescript
    // Snippet from contexts/AuthContext.tsx
    const redirectBasedOnRole = (role: string) => {
      switch (role) {
        case 'user':
        case 'renter':
          router.replace('/(renter)' as any);
          break;
        case 'freelancer':
          router.replace('/(freelancer)' as any);
          break;
        default:
          router.replace('/(renter)' as any);
          break;
      }
    };
    ```

## 4. Main Features Completed

*   **Authentication Flow**: Full login, registration, and logout functionality is implemented and stable.
*   **Role-Based Navigation**: Users are correctly redirected to their respective dashboards after login. The navigation structure is stable.
*   **Renter UI**:
    *   **Tab Navigation**: The renter has a stable tab bar with "Home," "Cart," and "Profile" sections.
    *   **Home Screen**: The home screen has been rebuilt to match the reference UI. It features a welcome dashboard, quick actions, and a product list with category filters.
*   **API Service Layer**: A robust set of services in the `services/` directory handles all communication with the backend for products, authentication, and ratings.
*   **Bug Fixes**: Critical bugs related to navigation race conditions and infinite render loops have been resolved.

## 5. Features In Progress / Not Yet Done

*   **Full Data Integration**: The renter home screen UI is complete, but it still uses some mock data for `userStats` and `recentBookings`. These need to be connected to live backend endpoints.
*   **Freelancer Module**: The `(freelancer)` route group and layout exist, but the UI and functionality are placeholders and need to be built out.
*   **Cart & Booking Flow**: The screens for the cart (`rent-later`) and booking process exist, but the end-to-end functionality is not fully implemented or tested.
*   **Profile Management**: The profile and edit-profile screens are present but require full implementation.

## 6. Backend/API

*   **API Provider**: A custom backend Node.js/Express server.
*   **API URL**: The backend is configured to run on the local network. The URL is stored in an `.env` file (`EXPO_PUBLIC_API_URL=http://192.168.101.3:3001`).
*   **Main Endpoints**:
    *   `/auth/login`, `/auth/register`: User authentication.
    *   `/products/page`: Fetch products with pagination.
    *   `/products/search`: Search for products.
    *   `/ratings/:productId`: Get ratings for a specific product.
*   **Known Integration Issues**: The `/ratings/:productId` endpoint returns a 404 error if a product has no ratings. This is expected, and the frontend now handles it gracefully by returning an empty array and silencing the console error.

## 7. Known Issues / Bugs

*   **Typed Routes Workaround**: Expo Router's typed routes are not fully configured, requiring the use of `as any` for some `router.replace()` calls in `AuthContext.tsx`. This is a known workaround to avoid TypeScript errors.
*   **Incomplete UI Logic**: As mentioned, several components rely on mock data. This is not a bug but is the most immediate piece of unfinished work.

## 8. Special Instructions or Gotchas

*   **`oldui` Directory**: This directory is not part of the running app. It is a snapshot of a previous, stable version of the UI and was used as a blueprint to fix navigation and UI issues. It is an invaluable reference for the intended design and functionality.
*   **Centralized Navigation**: **Do not add navigation logic inside individual components.** All role-based redirection is handled exclusively in `AuthContext.tsx` to maintain stability. This is a critical architectural pattern for this project.
*   **Expo Router Conventions**: The project relies heavily on Expo Router's file-based conventions. New screens should be created by adding files to the appropriate directory within `app/`. Route groups `(...)` are used to create separate navigation stacks without affecting the URL.

## 9. Next Steps

1.  **Priority 1: Connect Home Screen to Backend**: Replace all mock data in the renter home screen (`app/(renter)/index.tsx`) with live data from the backend API. This includes user stats and recent bookings.
2.  **Priority 2: Implement Freelancer UI**: Build out the UI and functionality for the freelancer dashboard and associated screens within the `app/(freelancer)/` directory.
3.  **Priority 3: Complete Core Features**: Finish the implementation of the Cart (`rent-later.tsx`), the end-to-end booking flow, and profile management.
4.  **Priority 4: Refine Typed Routes**: Investigate and properly implement Expo Router's typed routes to remove the `as any` casts and improve type safety.

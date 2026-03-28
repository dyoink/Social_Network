# Project Analysis: Social Network Prototype

## Overview
This project is a modern, high-fidelity social network application prototype. It features a rich user interface with smooth animations, responsive design, and several core social media functionalities.

## Technology Stack

### Frontend
- **Framework:** React 19 (using the latest features and patterns)
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4 (utilizing the new `@tailwindcss/vite` plugin)
- **Animations:** Motion (formerly Framer Motion) for fluid UI transitions
- **Icons:** Lucide React
- **Language:** TypeScript
- **AI Integration:** Configured to use Google Gemini (`@google/genai`)

### Backend (Infrastructure Ready)
- **Runtime:** Node.js
- **Framework:** Express.js (dependencies installed, implementation pending)

## Project Structure

### Frontend (`/frontend`)
- `src/components/layout`: Global UI elements (TopNav, Sidebar, RightSidebar).
- `src/components/views`: Core application pages (Newsfeed, Profile, Messenger, Search, Notifications, Auth).
- `src/components/feed`: Post-related components (PostCard, CreatePostModal, CommentSidebar).
- `src/data`: Mock data for development and prototyping.
- `src/types.ts`: Centralized TypeScript definitions for Users, Posts, and UI states.

### Backend (`/backend`)
- Currently an empty directory, but the root `package.json` includes Express and relevant types, indicating future development.

## Key Features
1. **Authentication:** A dedicated `AuthView` for user login/registration (currently mocked).
2. **Newsfeed:** Dynamic feed displaying posts with support for images, reactions, comments, and sharing.
3. **User Profiles:** Detailed profile views showing user stats (followers, following, posts), bio, and user-specific feed.
4. **Messenger:** A chat interface for direct messaging.
5. **Search:** Discovery tool for finding other users.
6. **Notifications:** System for tracking user interactions.
7. **Responsive Design:** Optimized for both desktop (sidebars) and mobile (bottom navigation bar).

## Architectural Patterns
- **State-Driven Navigation:** The application uses a centralized `currentView` state in `App.tsx` to handle navigation instead of a traditional router, which is common for single-page application prototypes.
- **Component-Based UI:** High degree of modularity with shared components for consistent design.
- **Mock Data Layer:** Decoupled data layer using `mockData.ts`, allowing for frontend development independent of the backend.

## Future Recommendations
1. **Backend Implementation:** Build out the Express.js server to replace mock data with a real database (e.g., MongoDB or PostgreSQL).
2. **AI Features:** Leverage the integrated Google Gemini API for features like automated content moderation, post suggestions, or intelligent search.
3. **State Management:** As the app grows, consider moving from local state to a state management library like Zustand or Redux Toolkit.
4. **Routing:** Transition to `react-router-dom` if complex URL-based navigation and deep linking are required.

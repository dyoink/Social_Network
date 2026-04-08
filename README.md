## Overview
- A modern social networking application built with a Client-Server architecture, using **ASP.NET Core** for the backend and **React (Vite)** for the frontend.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| **Backend** | ASP.NET Core (.NET 10), Entity Framework Core, PostgreSQL |
| **Frontend** | React 19, TypeScript, Vite , TailwindCSS, Zustand, Motion |
| **Auth** | JWT Bearer Token (7 ngày) |
| **API Docs** | Scalar UI (auto-gen OpenAPI) |
| **Infrastructure** | Docker (PostgreSQL container) |


## MAIN FUNCTIONALITIES
**Authentication** — Register and log in with JWT
- **Newsfeed** — View posts from people you follow, infinite scroll, skeleton loading
- **Posts** — Create, edit, and delete posts; attach and upload images
- **Reactions** — Like and unlike posts
- **Comments** — Comment and reply to nested comments
- **Profile** — View and edit profile, avatar, and cover photo
- **Follow System** — Follow and unfollow users; suggest followers
- **Search** — Search for users and posts
- **Messenger** — Send private real-time messages
- **Notifications** — Receive notifications for likes, comments, and follows
- **Admin Panel** — Dashboard with charts (area, bar, pie), user management (ban, change role, reset password, view details), posts (view details, photos), comments, and reports
- **Report System** — Report violating users/posts; admin deletes reports
- **Dark Mode** — Switch dark/light mode, anti-flash, save preferences
- **Health Check** — Endpoint `/health` for monitoring


## 1. User Regitration 
- Users can sign up with username, email, and password.
- Validation and error handling for user-friendly experience.

<img width="1907" height="938" alt="Image" src="https://github.com/user-attachments/assets/b9949045-3593-4581-aca2-2499349c374c" />

<img width="1896" height="940" alt="Image" src="https://github.com/user-attachments/assets/5a608661-c22f-48ba-b381-52cdb3a531fa" />

## 2. User Login
- Secure login with JWT authentication.
- Redirects to Newfeed  upon successful login.

<img width="1907" height="938" alt="Image" src="https://github.com/user-attachments/assets/b9949045-3593-4581-aca2-2499349c374c" />

<img width="1896" height="940" alt="Image" src="https://github.com/user-attachments/assets/5a608661-c22f-48ba-b381-52cdb3a531fa" />

## 3. Newfeed
- View posts from followed users
- Scroll to load more posts (infinite scrolling)
- View post content including text and images
- Like and unlike posts
- View like counts
- Comment on posts
- View and reply to comments (nested comments)
- Navigate to user profiles
- View post timestamps
- Discover trending posts based on engagement (hagtag)

<img width="1887" height="942" alt="Image" src="https://github.com/user-attachments/assets/6c0badfc-e6a3-49da-8146-92093ff19f28" />

<img width="943" height="415" alt="Image" src="https://github.com/user-attachments/assets/269eb9cd-4f34-4ff8-b1c5-7687478187b8" />

<img width="1882" height="908" alt="Image" src="https://github.com/user-attachments/assets/aeb503f5-dffd-4bf9-a33e-66a6cf1abd59" />

## 4. Post
- Create new posts with text content
- Upload and attach images, videos, position to posts
- Edit existing posts
- Delete posts

<img width="1893" height="944" alt="Image" src="https://github.com/user-attachments/assets/02ce3e09-bf02-4e70-927c-c80472478ac5" />

# 5. Profile
- Cover Photo: Displaying and updating the header banner.

- Profile Picture (Avatar): Displaying and updating the user's representative image.

- User Information: Displaying the display name, user bio, and badges (e.g., "Blogger").

- Social Counters: Tracking the number of Following, Followers, and Posts.

- Edit Profile: A button to modify personal information and settings.

- Follow : Displaying the list of followers , following

- Posts: Timeline of shared content.

- Content Navigation Tabs: Media , About, Badges

- Intro Widget: A sidebar summary showing Role, Location, and Social Links.


<img width="1887" height="935" alt="Image" src="https://github.com/user-attachments/assets/d280acd7-5330-44cb-acbd-4ad059783ee5" />

## 5.1 Media
- Gallery for photos and videos.

<img width="1889" height="945" alt="Image" src="https://github.com/user-attachments/assets/de64be60-4286-4705-9f00-60245386e1df" />

## 5.2 About
- Detailed personal background (education, work, location).

<img width="1886" height="939" alt="Image" src="https://github.com/user-attachments/assets/411a2d5e-fbcd-43e2-85b2-59ee36b6fcfd" />

## 5.3 Badges
- Displaying earned achievements or titles.

<img width="1884" height="935" alt="Image" src="https://github.com/user-attachments/assets/a0fcbb41-4549-4f9a-b78b-4059716e6359" />

## 5.4 Follow
- Displaying the list of followers , following

<img width="1886" height="932" alt="Image" src="https://github.com/user-attachments/assets/bd99b008-0dcf-40b2-88b9-1ab26fa4fb22" />

## 6. Messenger
- Real-time text messaging in chathub

<img width="1883" height="937" alt="Image" src="https://github.com/user-attachments/assets/f29f9e96-7ddb-426d-9593-e4293a846012" />

## 7. Notification
- Receive notifications for user interactions (likes, comments)
- Mark notifications as read/unread
- View timestamps of notifications

<img width="1886" height="941" alt="Image" src="https://github.com/user-attachments/assets/bc8ba4ff-a231-4727-bd81-efea8aaaf9ce" />

## 8. Search
- Search Category Filters: All, Users, Posts, Images, Videos, Groups, Trending,...

<img width="1884" height="936" alt="Image" src="https://github.com/user-attachments/assets/453300ca-944e-45d8-95f9-5583dfe43afd" />

## 9. Reel
- View short-form videos (reels) in a vertical scrolling feed
- Like, comment, share reels

<img width="1884" height="944" alt="Image" src="https://github.com/user-attachments/assets/b0167996-4f02-406d-aab5-f5037007b5c4" />

## 10. Setting
- Interface setting (light and dark themes)
- Password Management
- Privacy Settings
- AI Writting Assistant
- Notification Preferences
- Bug Reporting
- Log out

<img width="1893" height="944" alt="Image" src="https://github.com/user-attachments/assets/415ed460-316b-47ca-a298-c5f7d1007362" />

<img width="1893" height="941" alt="Image" src="https://github.com/user-attachments/assets/fa23038f-2876-4d7a-9d5e-c03c750e04af" /> 

## 11. Admin Panel
## 11.1. Overview
- Display total user,post,comment,messenge,follow,report,new user / day, new post/day,...
- Daily Activity Analytics
- Content Distribution
- Engagement Rates, Growth & Retention, Moderation Metrics
- Activity Leaderboard

<img width="1889" height="941" alt="Image" src="https://github.com/user-attachments/assets/2feec1f2-bb0e-4ee8-a8d7-61f62134aee5" /> 

<img width="1888" height="938" alt="Image" src="https://github.com/user-attachments/assets/6493b883-bacf-4fa4-a6aa-f9a98436bdab" /> 


## 11.2. User
- Displaying all users (username, email, role, status, numbers of post, followers,...)
- Ban user , Remove user, Change Password user
- Search user 

<img width="1892" height="940" alt="Image" src="https://github.com/user-attachments/assets/760c5e5e-65dd-40f9-8679-5a6de03da348" />


## 11.3. Post
- Displaying all posts (author,content,interact,..)
- Redirect to post, Remove post
- Search post

<img width="1885" height="955" alt="Image" src="https://github.com/user-attachments/assets/30727c41-ff09-42e3-9d60-d12b088d3c00" /> 


## 11.4. Comment
- Displaying all comments (author, content,post,type,time)
- Remove comment
- Search comment

<img width="1889" height="939" alt="Image" src="https://github.com/user-attachments/assets/a2eb20cf-443e-4085-a780-ec76ceba6226" /> 

## 11.5. Violation Report
- Report Filtering (Pending,Processed, All)
- Display all report (author, the reported person,reason, content,status)

<img width="1900" height="939" alt="Image" src="https://github.com/user-attachments/assets/7acef79f-e347-49c2-b461-dca47eb1512d" />

## 11.6. Badges Management
- Displaying all badges (Name badges, condition to active, number of owners)
- Creat a new badge ,Update badge, Remove badges

<img width="1885" height="938" alt="Image" src="https://github.com/user-attachments/assets/f666d57c-979a-4c46-bdfd-e547ec4cfcfd" />

## 11.7. Seed Data
- Generate dozens/hundreds of random users, posts, comments, reactions, follows, messages, and storie
- Help test pagination, trending hashtags, leaderboards, and newsfeeds without manual input

<img width="1902" height="934" alt="Image" src="https://github.com/user-attachments/assets/978d5dae-dfab-456c-87be-7a36797fa597" />

## 12. Health Check
-
<img width="1895" height="910" alt="Image" src="https://github.com/user-attachments/assets/898ba3d5-c2f8-4262-875f-8d627ddfee7a" />
<img width="1023" height="344" alt="Image" src="https://github.com/user-attachments/assets/f22e93f2-8231-49e3-9673-d051b214e888" />


## DEVELOPER INF0
- Author : Trần Chí Đức








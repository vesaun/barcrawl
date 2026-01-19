# BarCrawl 🍺

A social app similar to Strava, but for tracking bar crawls! Track your route, count your drinks, and share your night with friends.

## Features

### 🏠 Feed Page
- Chronological feed of friends' bar crawls
- Auto-titled posts (e.g., "[City] Bar Crawl")
- Interactive route maps with highlighted paths
- Media carousel showing photos from the crawl
- Stats display: drinks count, bars hit, miles walked
- "Cheers" (like) functionality
- Comments on posts
- Click on user names or posts to view profiles

### 📸 Camera Tab
- **Start Crawl**: Begin tracking your bar crawl adventure
- **Dual Camera View**: Switch between front and back cameras
- **Quick Drink Buttons**: 
  - Shot 🥃
  - Beer 🍺
  - Cocktail 🍸
  - Wine 🍷
  - Seltzer 💧
- **Live Photo Capture**: Take photos and add them to your crawl
- **Tap Out**: End your crawl when you're done
- **Auto-terminate**: Crawls automatically end after 2 hours of inactivity

### 👤 Profile Page
- View all your bar crawls
- **Drinks Counter**: Track drinks by day, week, month, year, or lifetime
- Profile stats: followers and friends count
- **Night Recap**: Slideshow feature with auto-generated captions
- Each crawl shows:
  - Route map
  - Media gallery
  - Stats (drinks, bars, miles)

### 🗺️ Explore Bars
- Interactive map showing all bars
- Visited bars highlighted in green
- Gamified visualization of your bar crawl progress
- Dark themed map for better visibility

### 📍 Location Tracking
- Real-time GPS tracking during active crawls
- Automatic route mapping
- Bar detection when you're near a bar
- Distance calculation (miles walked)

## Tech Stack

- **React Native** with **Expo**
- **Expo Router** for navigation
- **Expo Camera** for photo capture
- **Expo Location** for GPS tracking
- **React Native Maps** for map visualization
- **TypeScript** for type safety
- **Context API** for state management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
barcrawl/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Feed screen
│   │   ├── camera.tsx          # Camera/Crawl screen
│   │   ├── explore.tsx         # Explore Bars map
│   │   └── profile.tsx         # User profile
│   ├── crawl-review.tsx        # Crawl review modal
│   ├── user/[userId].tsx      # User profile page
│   └── _layout.tsx            # Root layout
├── context/
│   └── AppContext.tsx         # Global app state
├── types/
│   └── index.ts               # TypeScript types
└── components/                # Reusable components
```

## MVP Features

### ✅ Implemented
- [x] User profile with crawls list
- [x] Drinks counter (day/week/month/year/lifetime)
- [x] Feed page with posts from friends
- [x] Camera tab with start crawl functionality
- [x] Dual camera view with drink buttons
- [x] Location tracking and route mapping
- [x] Bar detection and counting
- [x] Distance calculation (miles walked)
- [x] Night recap slideshow with auto-generated captions
- [x] Cheers (like) and comments on posts
- [x] Explore bars map with visited bars highlighted
- [x] Auto-terminate crawl after 2 hours of inactivity
- [x] Crawl review modal with title, caption, and media selection

### 🔄 Future Enhancements
- Backend integration (Supabase/Firebase)
- User authentication
- Friend system
- Real bar/restaurant API integration
- Push notifications
- Social sharing
- Advanced analytics
- Leaderboards
- Badges and achievements

## Permissions

The app requires the following permissions:
- **Camera**: To take photos during bar crawls
- **Location**: To track your route and detect nearby bars

## Notes

- This is an MVP version with mock data
- Bar detection uses simplified distance calculations
- In production, integrate with a real bars/restaurants API
- Location tracking works best with high accuracy GPS enabled
- Auto-terminate feature helps prevent forgotten active crawls

## License

MIT

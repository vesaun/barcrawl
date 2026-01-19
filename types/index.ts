export type DrinkType = 'shot' | 'beer' | 'cocktail' | 'wine' | 'seltzer';

export interface Drink {
  type: DrinkType;
  timestamp: number;
}

export interface CrawlUpdate {
  id: string;
  photoUri: string;
  drinkType?: DrinkType;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Bar {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  visited: boolean;
  visitTimestamp?: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface Crawl {
  id: string;
  userId: string;
  title: string;
  caption?: string;
  city?: string;
  startTime: number;
  endTime?: number;
  route: RoutePoint[];
  updates: CrawlUpdate[];
  drinks: Drink[];
  barsHit: Bar[];
  milesWalked: number;
  drinksCount: number;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  profilePicture?: string;
  followersCount: number;
  friendsCount: number;
  crawls: Crawl[];
}

export interface Post {
  id: string;
  crawl: Crawl;
  user: User;
  cheersCount: number;
  cheeredBy: string[];
  comments: Comment[];
  createdAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  text: string;
  timestamp: number;
}

export interface ActiveCrawl {
  id: string;
  startTime: number;
  route: RoutePoint[];
  updates: CrawlUpdate[];
  drinks: Drink[];
  barsHit: Bar[];
  lastActivityTime: number;
}

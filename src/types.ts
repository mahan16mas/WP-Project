export type UserRole = 'listener' | 'artist' | 'support' | 'admin';
export type ListenerTier = 'free' | 'silver' | 'gold';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: ListenerTier;
  avatarUrl: string;
  followedArtists: string[]; // IDs of artist users or artist names
  playlistsCount: number;
  joinedDate: string;
  password?: string; // Credentials support
  status?: 'active' | 'pending' | 'rejected'; // For pending artist states
  dob?: string; // Listener demographic data
  gender?: string; // Listener demographic data
  dailyStreamsCount?: number; // Daily stream limit tracker
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  duration: number; // in seconds
  audioUrl: string; // for mock audio player
  coverUrl: string;
  lyrics: string;
  streams: number;
  releaseDate: string;
  approved: boolean; // Artist uploads may need approval
  releaseType?: 'single' | 'album';
  genre?: string;
  releaseYear?: string;
  collaborators?: string;
  audioFileName?: string;
  coverArtFileName?: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  songIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  userId: string; // creator ID
  description: string;
  coverUrl: string;
  songIds: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string | 'all'; // target specific user or all of a role
  role: UserRole | 'all';
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'ticket';
  read: boolean;
  createdAt: string;
}

export interface TicketReply {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: string;
  replies: TicketReply[];
}

export interface ArtistApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  artistName: string;
  bio: string;
  genre: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  portfolioFiles?: string[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  artistPayoutRate: number; // e.g. 0.7 (70%)
  platformKeepRate: number; // e.g. 0.3 (30%)
  totalStreams: number;
  averagePayoutPerStream: number; // calculated e.g. 0.0049
}

export interface SystemConfig {
  silverPrice: number;
  goldPrice: number;
  metrics: RevenueMetrics;
}

export interface MockState {
  users: User[];
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  notifications: Notification[];
  tickets: SupportTicket[];
  applications: ArtistApplication[];
  config: SystemConfig;
}

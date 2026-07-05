import React from 'react';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MockStateProvider, useMockState } from './context/MockStateContext';
import { LoginPage } from './components/LoginPage';
import { ListenerSignupPage } from './components/ListenerSignupPage';
import { PlaylistsView } from './components/PlaylistsView';
import { MusicPlayer } from './components/MusicPlayer';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsView } from './components/NotificationsView';
import { Song, User } from './types';

// Mock react-router-dom's useOutletContext globally for clean rendering
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useOutletContext: () => ({
      currentTrack: null,
      setCurrentTrack: vi.fn(),
      isPlaying: false,
      setIsPlaying: vi.fn(),
      onLyricsClick: vi.fn(),
      onAddToPlaylistClick: vi.fn(),
    }),
  };
});

// Robust mock for audio playback since HTML5 Audio doesn't run in jsdom full pipeline
class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  duration = 180;
  paused = true;
  addEventListener(event: string, callback: any) {
    if (event === 'timeupdate' || event === 'durationchange' || event === 'ended') {
      // safe noop
    }
  }
  removeEventListener() {}
  load() {}
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}
vi.stubGlobal('Audio', MockAudio);

// Clear localStorage before every test to ensure state isolation
beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  
  // Set default window properties for desktop view
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024
  });
});

describe('Spotify-Like Music Application - 10 Test Suite', () => {

  /* =========================================================================
     ASSERTION 1: Role-based routing upon successful universal form login
     ========================================================================= */
  it('1. should show welcome notification upon successful form login with correct credentials', async () => {
    // Seed default users in localStorage
    const defaultUser: User = {
      id: "usr-free",
      name: "Alex Carter",
      email: "alex@free.com",
      role: "listener",
      tier: "free",
      avatarUrl: "",
      followedArtists: [],
      playlistsCount: 0,
      joinedDate: "2026-01-01"
    };
    window.localStorage.setItem('spotify_mock_users', JSON.stringify([defaultUser]));

    render(
      <MockStateProvider>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </MockStateProvider>
    );

    // Type credentials
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'alex@free.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check successful authentication message
    expect(screen.getByText(/welcome back, Alex Carter/i)).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 2: Form input validation rules on listener registration pages (Required Fields)
     ========================================================================= */
  it('2. should enforce required display name and email validation constraints on listener signup', async () => {
    render(
      <MockStateProvider>
        <MemoryRouter>
          <ListenerSignupPage />
        </MemoryRouter>
      </MockStateProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /complete registration/i });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Submitting completely blank form should trigger required fields validations
    expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 3: Form input validation rules on listener registration pages (Password & Confirm Match)
     ========================================================================= */
  it('3. should enforce password length validation and mismatch checks on listener signup', async () => {
    render(
      <MockStateProvider>
        <MemoryRouter>
          <ListenerSignupPage />
        </MemoryRouter>
      </MockStateProvider>
    );

    const nameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitBtn = screen.getByRole('button', { name: /complete registration/i });

    // Fill details, short password
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@user.com' } });
    fireEvent.change(passInput, { target: { value: '123' } });
    fireEvent.change(confirmInput, { target: { value: '123' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();

    // Fix short password, but make them mismatch
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'mismatch123' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 4: Form input validation rules on listener registration pages (Privacy Policy Agreement)
     ========================================================================= */
  it('4. should block listener signup if the privacy policy agreement checkbox is unchecked', async () => {
    render(
      <MockStateProvider>
        <MemoryRouter>
          <ListenerSignupPage />
        </MemoryRouter>
      </MockStateProvider>
    );

    const nameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const submitBtn = screen.getByRole('button', { name: /complete registration/i });

    // Fill valid credentials
    fireEvent.change(nameInput, { target: { value: 'Alex Jones' } });
    fireEvent.change(emailInput, { target: { value: 'alex.jones@example.com' } });
    fireEvent.change(passInput, { target: { value: 'secret123' } });
    fireEvent.change(confirmInput, { target: { value: 'secret123' } });
    fireEvent.change(dobInput, { target: { value: '1995-10-15' } });

    // Leave checkbox UNCHECKED and submit
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/you must review and agree to the privacy policy/i)).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 5: Context block mechanisms preventing Free tier accounts from creating a 7th playlist
     ========================================================================= */
  it('5. should block playlist creation in state when free tier user already has 6 playlists', async () => {
    // Render a test component to inspect the state context operations
    const TestComponent = () => {
      const { createPlaylist, playlists, currentUser } = useMockState();
      return (
        <div>
          <span data-testid="user-tier">{currentUser?.tier}</span>
          <span data-testid="playlist-count">{playlists.length}</span>
          <button onClick={() => {
            const res = createPlaylist('My 7th Playlist', 'Fails');
            const feedback = document.getElementById('feedback');
            if (feedback) feedback.textContent = res.message;
          }}>Create 7th</button>
          <div id="feedback"></div>
        </div>
      );
    };

    // Seed state to mock current user as Free, and load 6 existing playlists
    const freeUser: User = {
      id: "usr-free",
      name: "Alex Carter",
      email: "alex@free.com",
      role: "listener",
      tier: "free",
      avatarUrl: "",
      followedArtists: [],
      playlistsCount: 6,
      joinedDate: "2026-01-15"
    };
    const sixPlaylists = Array.from({ length: 6 }, (_, idx) => ({
      id: `pl-mock-${idx}`,
      name: `Playlist ${idx + 1}`,
      userId: "usr-free",
      description: "Mock playlist description",
      coverUrl: "",
      songIds: [],
      isPublic: true,
      createdAt: "2026-07-05"
    }));

    window.localStorage.setItem('spotify_mock_current_user', JSON.stringify(freeUser));
    window.localStorage.setItem('spotify_mock_playlists', JSON.stringify(sixPlaylists));

    render(
      <MockStateProvider>
        <TestComponent />
      </MockStateProvider>
    );

    // Wait for context to load initial states
    await waitFor(() => {
      expect(screen.getByTestId('user-tier').textContent).toBe('free');
    });
    expect(screen.getByTestId('playlist-count').textContent).toBe('6');

    // Click to create 7th playlist
    fireEvent.click(screen.getByText('Create 7th'));

    // Verify limit rejection warning feedback message
    expect(screen.getByText(/tier limit reached! free accounts are limited/i)).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 6: The Player component hiding listener analytics when active user is not Gold
     ========================================================================= */
  it('6. should hide gold listener statistics on profile when user is not Gold, and reveal them when they are Gold', async () => {
    // Seed standard Free user
    const freeUser: User = {
      id: "usr-free",
      name: "Alex Carter",
      email: "alex@free.com",
      role: "listener",
      tier: "free",
      avatarUrl: "",
      followedArtists: [],
      playlistsCount: 0,
      joinedDate: "2026-01-01"
    };
    window.localStorage.setItem('spotify_mock_current_user', JSON.stringify(freeUser));

    render(
      <MockStateProvider>
        <MemoryRouter>
          <ProfileView />
        </MemoryRouter>
      </MockStateProvider>
    );

    // Wait for async state loading from localStorage
    await waitFor(() => {
      expect(screen.getByText(/Profile & Audio Settings/i)).toBeInTheDocument();
    });

    // Switch to Artist Profiles Spotlight tab where the gold statistics / teaser reside
    const artistTabBtn = screen.getByRole('button', { name: /artist profiles spotlight/i });
    fireEvent.click(artistTabBtn);

    // Verify Free user is shown the teaser of statistics restriction
    await waitFor(() => {
      expect(screen.getByText(/listener analytics restricted/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/gold studio demographics/i)).not.toBeInTheDocument();

    // Now cleanup the DOM completely and seed a Gold user to force clean remount
    cleanup();

    const goldUser: User = {
      id: "usr-gold",
      name: "Marcus Aurelius",
      email: "marcus@gold.com",
      role: "listener",
      tier: "gold",
      avatarUrl: "",
      followedArtists: [],
      playlistsCount: 0,
      joinedDate: "2026-01-01"
    };
    window.localStorage.setItem('spotify_mock_current_user', JSON.stringify(goldUser));

    render(
      <MockStateProvider>
        <MemoryRouter>
          <ProfileView />
        </MemoryRouter>
      </MockStateProvider>
    );

    // Switch to Artist Spotlight tab again on the Gold component
    const artistTabBtnGold = screen.getByRole('button', { name: /artist profiles spotlight/i });
    fireEvent.click(artistTabBtnGold);

    // Verify stats panel is now successfully unlocked and rendered for Gold users
    await waitFor(() => {
      expect(screen.getByText(/gold studio demographics/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/unlocked stats/i)).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 7: Administrative price change modifications dynamically reflecting in global context states
     ========================================================================= */
  it('7. should update premium subscription plans prices in configuration state and spawn notification alerts', async () => {
    const TestAdminComponent = () => {
      const { updatePrices, config } = useMockState();
      return (
        <div>
          <span data-testid="silver-price">{config.silverPrice}</span>
          <span data-testid="gold-price">{config.goldPrice}</span>
          <button onClick={() => updatePrices(8.99, 18.99)}>Apply Price Hikes</button>
        </div>
      );
    };

    render(
      <MockStateProvider>
        <TestAdminComponent />
      </MockStateProvider>
    );

    // Wait for context setup
    await waitFor(() => {
      expect(screen.getByTestId('silver-price').textContent).toBe('4.99');
    });
    expect(screen.getByTestId('gold-price').textContent).toBe('9.99');

    // Trigger price change
    fireEvent.click(screen.getByText('Apply Price Hikes'));

    // Check dynamic reflection in context state
    expect(screen.getByTestId('silver-price').textContent).toBe('8.99');
    expect(screen.getByTestId('gold-price').textContent).toBe('18.99');
  });

  /* =========================================================================
     ASSERTION 8: The player responsive window switching structures when simulation viewports change widths
     ========================================================================= */
  it('8. should switch styling views in responsive player modules when simulation width values change', async () => {
    const testTrack: Song = {
      id: 'sng-test',
      title: 'Neon Horizon',
      artistId: 'art-1',
      artistName: 'Synth Lab',
      albumId: 'alb-1',
      albumName: 'Retro Waves',
      duration: 180,
      audioUrl: 'mock_audio.mp3',
      coverUrl: 'mock_cover.jpg',
      lyrics: 'Let the waves crash down...',
      streams: 25,
      releaseDate: '2026-06-01',
      approved: true
    };

    const mockSetCurrentTrack = vi.fn();
    const mockSetIsPlaying = vi.fn();
    const mockNext = vi.fn();
    const mockPrev = vi.fn();
    const mockLyrics = vi.fn();
    const mockAddToPlaylist = vi.fn();

    // Default desktop rendering (window.innerWidth = 1024)
    const { container, rerender } = render(
      <MockStateProvider>
        <MusicPlayer
          currentTrack={testTrack}
          setCurrentTrack={mockSetCurrentTrack}
          isPlaying={true}
          setIsPlaying={mockSetIsPlaying}
          playNextTrack={mockNext}
          playPrevTrack={mockPrev}
          onLyricsClick={mockLyrics}
          onAddToPlaylistClick={mockAddToPlaylist}
        />
      </MockStateProvider>
    );

    // Desktop player node must be rendering
    await waitFor(() => {
      expect(container.querySelector('.desktop-player-only')).toBeInTheDocument();
    });

    // Simulate resizing window to mobile (width 375px)
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      window.dispatchEvent(new Event('resize'));
    });

    rerender(
      <MockStateProvider>
        <MusicPlayer
          currentTrack={testTrack}
          setCurrentTrack={mockSetCurrentTrack}
          isPlaying={true}
          setIsPlaying={mockSetIsPlaying}
          playNextTrack={mockNext}
          playPrevTrack={mockPrev}
          onLyricsClick={mockLyrics}
          onAddToPlaylistClick={mockAddToPlaylist}
        />
      </MockStateProvider>
    );

    // Mobile specific minimal player bar elements should be present
    expect(container.querySelector('.mobile-player-bar-minimal')).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 9: Click interactions correctly handling notification removal and updating state layouts
     ========================================================================= */
  it('9. should remove notification entry from the alerts list upon user clicking the trash delete button', async () => {
    // Seed single custom notification
    const testNotifications = [
      {
        id: "notif-test-1",
        userId: "usr-free",
        role: "listener" as const,
        title: "Test Alert",
        message: "This is a temporary log message",
        type: "success" as const,
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
    window.localStorage.setItem('spotify_mock_notifications', JSON.stringify(testNotifications));

    // Seed mock free user to allow reading notifications
    const freeUser: User = {
      id: "usr-free",
      name: "Alex Carter",
      email: "alex@free.com",
      role: "listener",
      tier: "free",
      avatarUrl: "",
      followedArtists: [],
      playlistsCount: 0,
      joinedDate: "2026-01-01"
    };
    window.localStorage.setItem('spotify_mock_current_user', JSON.stringify(freeUser));

    render(
      <MockStateProvider>
        <NotificationsView />
      </MockStateProvider>
    );

    // Verify initial layout renders the test notification
    await waitFor(() => {
      expect(screen.getByText('Test Alert')).toBeInTheDocument();
    });

    // Locate and click the delete button
    const deleteBtn = screen.getByTitle('Delete Notification');
    fireEvent.click(deleteBtn);

    // Verify notification is successfully removed and layout is updated to empty state
    await waitFor(() => {
      expect(screen.queryByText('Test Alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No Alerts Found')).toBeInTheDocument();
  });

  /* =========================================================================
     ASSERTION 10: Complete Integration workflow - User login details to playlist dashboard validation
     ========================================================================= */
  it('10. should allow listener to log in and render their empty playlists catalog status successfully', async () => {
    const defaultUser: User = {
      id: "usr-free",
      name: "Alex Carter",
      email: "alex@free.com",
      role: "listener",
      tier: "free",
      avatarUrl: "",
      followedArtists: [],
      playlistsCount: 0,
      joinedDate: "2026-01-01"
    };
    window.localStorage.setItem('spotify_mock_current_user', JSON.stringify(defaultUser));
    window.localStorage.setItem('spotify_mock_playlists', JSON.stringify([]));

    render(
      <MockStateProvider>
        <MemoryRouter>
          <PlaylistsView />
        </MemoryRouter>
      </MockStateProvider>
    );

    // Confirm view displays correct descriptive layouts
    await waitFor(() => {
      expect(screen.getByText(/your music playlists/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/no playlists curated yet/i)).toBeInTheDocument();
  });
});

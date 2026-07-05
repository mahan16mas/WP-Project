import React, { useEffect, useRef, useState } from 'react';
import { useMockState } from '../context/MockStateContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Mic, 
  Heart, 
  Plus, 
  Disc,
  Info,
  Sparkles,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import './Player.css';

interface MusicPlayerProps {
  currentTrack: Song | null;
  setCurrentTrack: (song: Song | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  onLyricsClick: () => void;
  onAddToPlaylistClick: (songId: string) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  setCurrentTrack,
  isPlaying,
  setIsPlaying,
  playNextTrack,
  playPrevTrack,
  onLyricsClick,
  onAddToPlaylistClick
}) => {
  const { currentUser, songs, toggleFollowArtist, incrementSongStreams } = useMockState();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [skipsRemaining, setSkipsRemaining] = useState(6); // Mock skip limits for Free Tier
  const [showSkipAlert, setShowSkipAlert] = useState(false);
  const [streamLogged, setStreamLogged] = useState(false);

  // New features state
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('all');
  const [queueOpen, setQueueOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Dynamic color extraction state & effect
  const [activeColor, setActiveColor] = useState('#10b981');

  useEffect(() => {
    if (!currentTrack || !currentTrack.coverUrl) {
      setActiveColor('#10b981');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentTrack.coverUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const imageData = ctx.getImageData(0, 0, 1, 1).data;
          const r = imageData[0];
          const g = imageData[1];
          const b = imageData[2];
          
          // Boost saturation & brightness for an elegant, readable accent
          let finalR = r;
          let finalG = g;
          let finalB = b;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 60) {
            finalR = Math.min(255, r + 60);
            finalG = Math.min(255, g + 60);
            finalB = Math.min(255, b + 60);
          } else if (brightness > 220) {
            finalR = Math.max(30, r - 60);
            finalG = Math.max(30, g - 60);
            finalB = Math.max(30, b - 60);
          }
          setActiveColor(`rgb(${finalR}, ${finalG}, ${finalB})`);
        }
      } catch (err) {
        console.warn("Could not extract dynamic color from artwork:", err);
        setActiveColor('#10b981');
      }
    };

    img.onerror = () => {
      setActiveColor('#10b981');
    };
  }, [currentTrack]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle next track with shuffle/repeat logic
  const handleNext = () => {
    if (!currentTrack || songs.length === 0) return;
    
    // TIER ENFORCEMENT ON SKIPS FOR FREE USERS
    if (currentUser && currentUser.role === 'listener' && currentUser.tier === 'free') {
      if (skipsRemaining <= 0) {
        setShowSkipAlert(true);
        setTimeout(() => setShowSkipAlert(false), 4000);
        return;
      }
      setSkipsRemaining(prev => prev - 1);
    }

    if (isShuffle) {
      const otherSongs = songs.filter(s => s.id !== currentTrack.id);
      if (otherSongs.length > 0) {
        const randomSong = otherSongs[Math.floor(Math.random() * otherSongs.length)];
        setCurrentTrack(randomSong);
        setIsPlaying(true);
      }
    } else {
      const currentIndex = songs.findIndex(s => s.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < songs.length - 1) {
        setCurrentTrack(songs[currentIndex + 1]);
        setIsPlaying(true);
      } else {
        if (repeatMode === 'all') {
          setCurrentTrack(songs[0]);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
          if (audioRef.current) audioRef.current.pause();
        }
      }
    }
  };

  // Handle previous track with shuffle/repeat logic
  const handlePrev = () => {
    if (!currentTrack || songs.length === 0) return;

    if (isShuffle) {
      const otherSongs = songs.filter(s => s.id !== currentTrack.id);
      if (otherSongs.length > 0) {
        const randomSong = otherSongs[Math.floor(Math.random() * otherSongs.length)];
        setCurrentTrack(randomSong);
        setIsPlaying(true);
      }
    } else {
      const currentIndex = songs.findIndex(s => s.id === currentTrack.id);
      if (currentIndex > 0) {
        setCurrentTrack(songs[currentIndex - 1]);
        setIsPlaying(true);
      } else {
        if (repeatMode === 'all') {
          setCurrentTrack(songs[songs.length - 1]);
          setIsPlaying(true);
        } else {
          if (audioRef.current) audioRef.current.currentTime = 0;
        }
      }
    }
  };

  // Cycle repeat mode cycle: all -> one -> none -> all
  const cycleRepeatMode = () => {
    if (repeatMode === 'all') {
      setRepeatMode('one');
    } else if (repeatMode === 'one') {
      setRepeatMode('none');
    } else {
      setRepeatMode('all');
    }
  };

  // Handle source changes and play state
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || currentTrack?.duration || 0);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.log("Replay failed:", err));
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    if (currentTrack) {
      const prevSrc = audio.src;
      if (prevSrc !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.load();
        setStreamLogged(false);
      }

      if (isPlaying) {
        audio.play().catch(err => {
          console.log("Audio play failed or was interrupted:", err);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, isPlaying, repeatMode, isShuffle]);

  // Increment stream count once 10 seconds of a song have played (to prevent spamming stream payouts)
  useEffect(() => {
    if (isPlaying && currentTrack && currentTime > 10 && !streamLogged) {
      incrementSongStreams(currentTrack.id);
      setStreamLogged(true);
    }
  }, [isPlaying, currentTrack, currentTime, streamLogged, incrementSongStreams]);

  if (!currentUser) return null;

  const handlePlayPause = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isFollowing = currentUser.followedArtists.includes(currentTrack?.artistName || '');

  return (
    <div style={{ '--active-theme-color': activeColor } as React.CSSProperties}>
      {/* ======================================= */}
      /* 1. DESKTOP VIEW STICKY PLAYER BAR       */
      {/* ======================================= */}
      <div 
        className="desktop-player-only h-24 bg-[#181818] fixed bottom-0 left-0 right-0 z-40 px-6 flex items-center justify-between select-none"
        style={{ borderTop: '2px solid var(--active-theme-color)' }}
      >
        
        {/* Track Details (Left Block) */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          {currentTrack ? (
            <>
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-14 h-14 rounded-md object-cover shadow-lg border border-zinc-850"
              />
              <div className="flex flex-col min-w-0">
                <span 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(currentTrack.title)}`)}
                  className="text-sm font-semibold text-white hover:underline cursor-pointer truncate"
                  title="Search song"
                >
                  {currentTrack.title}
                </span>
                <span 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(currentTrack.artistName)}`)}
                  className="text-xs text-zinc-400 hover:underline cursor-pointer truncate"
                  title="Search artist"
                >
                  {currentTrack.artistName}
                </span>
                {currentTrack.albumName && (
                  <span 
                    onClick={() => navigate(`/search?q=${encodeURIComponent(currentTrack.albumName)}`)}
                    className="text-[10px] text-zinc-500 hover:underline cursor-pointer truncate"
                    title="Search album"
                  >
                    {currentTrack.albumName}
                  </span>
                )}
                {currentUser.tier === 'gold' && (
                  <span className="text-[10px] text-amber-400 font-mono font-bold mt-0.5" title="Stream Count">
                    🔥 {currentTrack.streams ? currentTrack.streams.toLocaleString() : 0} streams
                  </span>
                )}
              </div>

              {/* Social & Playlist actions on track */}
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => toggleFollowArtist(currentTrack.artistName)}
                  className="p-1.5 hover:text-white hover:scale-105 transition cursor-pointer"
                  title={isFollowing ? "Unfollow Artist" : "Follow Artist"}
                >
                  <Heart 
                    className="w-4 h-4 transition-colors duration-200"
                    style={{ 
                      color: isFollowing ? 'var(--active-theme-color)' : 'rgb(161, 161, 170)',
                      fill: isFollowing ? 'var(--active-theme-color)' : 'transparent'
                    }} 
                  />
                </button>
                <button
                  onClick={() => onAddToPlaylistClick(currentTrack.id)}
                  className="p-1.5 hover:text-white hover:scale-105 transition cursor-pointer"
                  title="Add to Playlist"
                >
                  <Plus className="w-4 h-4 text-zinc-400 hover:text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <Disc className="w-6 h-6 text-zinc-700 animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-500">No Track Selected</span>
                <span className="text-[10px] text-zinc-600 font-mono">Choose a song from Home or Search</span>
              </div>
            </div>
          )}
        </div>

        {/* Audio Control Panel (Center Block) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-4">
          {/* Playback controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className="p-1 transition cursor-pointer"
              style={{ color: isShuffle ? 'var(--active-theme-color)' : 'rgb(113, 113, 122)' }}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrev}
              className="text-zinc-400 hover:text-white transition cursor-pointer"
              title="Previous Track"
              disabled={!currentTrack}
            >
              <SkipBack className="w-5 h-5 shrink-0" />
            </button>
            
            <button
              onClick={handlePlayPause}
              className={`w-9 h-9 rounded-full bg-white text-black flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer ${
                !currentTrack ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isPlaying ? "Pause" : "Play"}
              disabled={!currentTrack}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black text-black ml-0" />
              ) : (
                <Play className="w-5 h-5 fill-black text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="text-zinc-400 hover:text-white transition cursor-pointer relative"
              title="Next Track"
              disabled={!currentTrack}
            >
              <SkipForward className="w-5 h-5 shrink-0" />
              {currentUser.role === 'listener' && currentUser.tier === 'free' && (
                <span className="absolute -top-3.5 -right-3 px-1 py-0.2 rounded bg-amber-500 text-[8px] text-black font-bold font-mono">
                  {skipsRemaining}
                </span>
              )}
            </button>

            <button
              onClick={cycleRepeatMode}
              className="p-1 transition cursor-pointer"
              style={{ color: repeatMode !== 'none' ? 'var(--active-theme-color)' : 'rgb(113, 113, 122)' }}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Dynamic seek timeline */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 font-mono select-none w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentTrack}
              className="flex-1 h-1 bg-zinc-600 hover:bg-zinc-500 rounded-lg appearance-none cursor-pointer focus:outline-none player-range-input"
              style={{ accentColor: 'var(--active-theme-color)' }}
            />
            <span className="text-[10px] text-zinc-400 font-mono select-none w-8 text-left">
              {formatTime(duration)}
            </span>
          </div>

          {/* Skip Alert prompt */}
          {showSkipAlert && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-800 text-amber-200 text-[11px] px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Skip limit reached (6/hr). <strong>Upgrade to Premium</strong> to skip unlimited songs!</span>
            </div>
          )}
        </div>

        {/* Utility Sliders (Right Block) */}
        <div className="flex items-center gap-4 w-1/4 justify-end min-w-[200px]">
          {/* Queue toggle button */}
          <button
            onClick={() => setQueueOpen(!queueOpen)}
            className="p-2 hover:scale-105 transition cursor-pointer"
            style={{ color: queueOpen ? 'var(--active-theme-color)' : 'rgb(161, 161, 170)' }}
            title="Play Queue"
          >
            <ListMusic className="w-4.5 h-4.5" />
          </button>

          {/* Dynamic Lyrics display action button */}
          <button
            onClick={onLyricsClick}
            className="p-2 hover:text-white hover:scale-105 transition cursor-pointer text-zinc-400 relative"
            title="Lyrics Console"
            disabled={!currentTrack}
          >
            <Mic className="w-4 h-4" />
            {currentUser.tier === 'gold' && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
            )}
          </button>

          {/* Volume controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-zinc-600 hover:bg-zinc-500 rounded-lg appearance-none cursor-pointer focus:outline-none"
              style={{ accentColor: 'var(--active-theme-color)' }}
            />
          </div>

          {/* Simple Audio Fidelity Indicator */}
          <div 
            className="border rounded px-2 py-1 text-[8px] font-mono text-zinc-500 select-none flex flex-col items-center transition-colors"
            style={{ borderColor: 'var(--active-theme-color)', opacity: 0.8 }}
          >
            <span className="leading-none text-zinc-600 uppercase font-bold text-[7px]">FIDELITY</span>
            <span className="mt-0.5 font-bold transition-colors" style={{ color: 'var(--active-theme-color)' }}>
              {currentUser.tier === 'gold' ? '24-bit Hi-Res' : currentUser.tier === 'silver' ? '320kbps High' : '128kbps Standard'}
            </span>
          </div>
        </div>

      </div>

      {/* ======================================= */}
      /* 2. SLIDING PLAY QUEUE DRAWER (DESKTOP)   */
      {/* ======================================= */}
      {queueOpen && (
        <div 
          className="absolute bottom-24 right-6 w-80 bg-[#121214]/95 backdrop-blur border rounded-xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-200 transition-colors"
          style={{ borderColor: 'var(--active-theme-color)' }}
        >
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <ListMusic className="w-4 h-4" style={{ color: 'var(--active-theme-color)' }} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Play Queue</h4>
            </div>
            <button
              onClick={() => setQueueOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            <div>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono font-bold block mb-1">Now Playing</span>
              {currentTrack ? (
                <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/50">
                  <img src={currentTrack.coverUrl} className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate transition-colors" style={{ color: 'var(--active-theme-color)' }}>{currentTrack.title}</p>
                    <p className="text-[9px] text-zinc-500 truncate">{currentTrack.artistName}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-zinc-600 font-mono italic">No active song</p>
              )}
            </div>

            <div>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono font-bold block mb-1">Next Up</span>
              <div className="space-y-1.5">
                {songs.filter(s => s.id !== currentTrack?.id).slice(0, 5).map((song, idx) => (
                  <div 
                    key={song.id} 
                    onClick={() => {
                      setCurrentTrack(song);
                      setIsPlaying(true);
                    }}
                    className="flex items-center gap-2 p-1 rounded hover:bg-zinc-900/40 cursor-pointer transition"
                  >
                    <span className="text-[9px] font-mono text-zinc-600 w-3 text-center">{idx + 1}</span>
                    <img src={song.coverUrl} className="w-7 h-7 rounded object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-zinc-300 truncate">{song.title}</p>
                      <p className="text-[8px] text-zinc-500 truncate">{song.artistName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      /* 3. MINIMAL MOBILE BAR                    */
      {/* ======================================= */}
      {currentTrack && (
        <div 
          onClick={() => setIsMobileExpanded(true)}
          className="mobile-player-bar-minimal flex md:hidden cursor-pointer"
          style={{ borderTop: '2px solid var(--active-theme-color)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img src={currentTrack.coverUrl} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none mb-1">{currentTrack.title}</p>
              <p className="text-[10px] text-zinc-500 truncate">{currentTrack.artistName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================= */}
      /* 4. EXPANDED MOBILE FULLSCREEN OVERLAY   */
      {/* ======================================= */}
      {isMobileExpanded && currentTrack && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0c0e] text-white p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="text-center">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Now Streaming</span>
              <span 
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(currentTrack.albumName || '')}`);
                  setIsMobileExpanded(false);
                }}
                className="text-[10px] font-semibold text-zinc-400 truncate max-w-[180px] block hover:underline cursor-pointer"
                title="Search album"
              >
                {currentTrack.albumName}
              </span>
            </div>
            <button
              onClick={() => onAddToPlaylistClick(currentTrack.id)}
              className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Large Spinning Vinyl Disc Artwork */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-6">
            <div 
              className="relative w-56 h-56 md:w-64 md:h-64 mx-auto rounded-full shadow-2xl overflow-hidden flex items-center justify-center bg-black transition-all duration-500"
              style={{ 
                boxShadow: '0 0 35px var(--active-theme-color)',
                borderColor: 'var(--active-theme-color)',
                borderWidth: '2px'
              }}
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform ${
                  isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'
                }`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute w-12 h-12 rounded-full bg-[#0c0c0e] border-2 border-zinc-900 shadow-inner flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-zinc-850" />
              </div>
            </div>

            {/* Title & Artist details */}
            <div className="text-center space-y-1.5 w-full px-4">
              <h3 
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(currentTrack.title)}`);
                  setIsMobileExpanded(false);
                }}
                className="text-lg font-bold text-white tracking-tight truncate hover:underline cursor-pointer"
                title="Search song"
              >
                {currentTrack.title}
              </h3>
              <p 
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(currentTrack.artistName)}`);
                  setIsMobileExpanded(false);
                }}
                className="text-sm text-zinc-400 font-medium truncate hover:underline cursor-pointer inline-block"
                title="Search artist"
              >
                {currentTrack.artistName}
              </p>
              {currentTrack.albumName && (
                <p 
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(currentTrack.albumName)}`);
                    setIsMobileExpanded(false);
                  }}
                  className="text-xs text-zinc-500 font-medium truncate hover:underline cursor-pointer block"
                  title="Search album"
                >
                  {currentTrack.albumName}
                </p>
              )}
              {currentUser.tier === 'gold' && (
                <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] text-amber-400 font-mono font-bold mt-1">
                  <span>🔥 {currentTrack.streams ? currentTrack.streams.toLocaleString() : 0} streams</span>
                </div>
              )}
            </div>
          </div>

          {/* Synced Lyrics Console display */}
          <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850/50 space-y-2 mb-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-widest flex items-center gap-1 transition-colors" style={{ color: 'var(--active-theme-color)' }}>
                <Mic className="w-3 h-3" /> Live Lyrics Console
              </span>
              <span className="text-[8px] text-zinc-600 font-mono">Karaoke Sync Ready</span>
            </div>
            <div className="lyrics-scroll-block h-32 overflow-y-auto text-center py-2 text-xs font-semibold leading-relaxed text-zinc-400 space-y-2">
              {currentTrack.lyrics ? (
                currentTrack.lyrics.split('\n').map((line, idx) => {
                  const isActiveLine = idx === Math.min(Math.floor(currentTrack.lyrics.split('\n').length * (currentTime / (duration || 1))), currentTrack.lyrics.split('\n').length - 1);
                  return (
                    <p 
                      key={idx} 
                      className={`transition-all duration-300 ${
                        isActiveLine ? 'scale-105 font-bold' : 'opacity-45 text-zinc-300'
                      }`}
                      style={{ color: isActiveLine ? 'var(--active-theme-color)' : undefined }}
                    >
                      {line}
                    </p>
                  );
                })
              ) : (
                <p className="text-zinc-600 italic font-mono text-[10px]">No lyrics synced for this production catalog.</p>
              )}
            </div>
          </div>

          {/* Playback Controls & Range Sliders */}
          <div className="space-y-5 pb-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full player-range-input"
                style={{ accentColor: 'var(--active-theme-color)' }}
              />
            </div>

            <div className="flex items-center justify-between px-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className="p-2 transition cursor-pointer"
                style={{ color: isShuffle ? 'var(--active-theme-color)' : 'rgb(113, 113, 122)' }}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={handlePrev}
                className="p-2 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Previous"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center transition active:scale-95 shadow-xl shadow-white/5 cursor-pointer"
                title="Play / Pause"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-black text-black" /> : <Play className="w-6 h-6 fill-black text-black ml-1" />}
              </button>

              <button
                onClick={handleNext}
                className="p-2 text-zinc-300 hover:text-white transition cursor-pointer relative"
                title="Next"
              >
                <SkipForward className="w-6 h-6 fill-current" />
                {currentUser.role === 'listener' && currentUser.tier === 'free' && (
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-amber-500 text-[8px] text-black font-bold font-mono">
                    {skipsRemaining}
                  </span>
                )}
              </button>

              <button
                onClick={cycleRepeatMode}
                className="p-2 transition cursor-pointer"
                style={{ color: repeatMode !== 'none' ? 'var(--active-theme-color)' : 'rgb(113, 113, 122)' }}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useMockState } from '../context/MockStateContext';
import { Song, Playlist } from '../types';
import { Play, Pause, Trash2, ListMusic, Plus, FolderHeart, Info, X, Edit2, Sparkles, Crown } from 'lucide-react';

interface OutletContextType {
  currentTrack: Song | null;
  setCurrentTrack: (song: Song | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onLyricsClick: () => void;
  onAddToPlaylistClick: (songId: string) => void;
}

export const PlaylistsView: React.FC = () => {
  const { currentUser, playlists, songs, createPlaylist, deletePlaylist, renamePlaylist, removeTrackFromPlaylist } = useMockState();
  const { currentTrack, setCurrentTrack, isPlaying, setIsPlaying } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  // Create Playlist form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Rename Playlist form state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamePlaylistId, setRenamePlaylistId] = useState('');
  const [renameName, setRenameName] = useState('');
  const [renameDesc, setRenameDesc] = useState('');
  const [renameSuccess, setRenameSuccess] = useState('');
  const [renameError, setRenameError] = useState('');

  // Tier limit warning overlay state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  if (!currentUser) return null;

  // Filter playlists created by the current user
  const userPlaylists = playlists.filter(p => p.userId === currentUser.id);

  // If there's no selected playlist but playlists exist, default to the first one
  const activePlaylistId = selectedPlaylistId || (userPlaylists.length > 0 ? userPlaylists[0].id : null);
  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const playlistSongs = activePlaylist ? songs.filter(s => activePlaylist.songIds.includes(s.id)) : [];

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPlaylistName.trim()) {
      setErrorMsg('Playlist name is required.');
      return;
    }

    const result = createPlaylist(newPlaylistName, newPlaylistDesc);
    if (result.success) {
      setSuccessMsg(result.message);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccessMsg('');
      }, 1000);
    } else {
      // If it contains "Limit" or "Tier Limit", show our gorgeous custom warning overlay!
      if (result.message.toLowerCase().includes('limit')) {
        setLimitMessage(result.message);
        setShowCreateModal(false);
        setShowLimitModal(true);
      } else {
        setErrorMsg(result.message);
      }
    }
  };

  const handleTrackPlay = (song: Song) => {
    setCurrentTrack(song);
    setIsPlaying(true);
  };

  const handlePlaylistPlayAll = () => {
    if (playlistSongs.length > 0) {
      setCurrentTrack(playlistSongs[0]);
      setIsPlaying(true);
    }
  };

  const isPlaylistActivePlaying = playlistSongs.some(
    s => currentTrack && s.id === currentTrack.id && isPlaying
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Music Playlists</h1>
          <p className="text-xs text-zinc-400">Curate and configure custom listening stages for your session.</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Playlists List Panel (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider">
            Playlists Catalog ({userPlaylists.length})
          </h3>

          {userPlaylists.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
              <FolderHeart className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">No playlists curated yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-[11px] text-emerald-400 hover:underline font-bold cursor-pointer"
              >
                Create your first playlist
              </button>
              <div className="mt-2 text-[10px] text-zinc-500 font-mono">or</div>
              <button
                onClick={() => navigate('/search')}
                className="mt-1 text-[11px] text-zinc-300 hover:text-white font-bold cursor-pointer underline"
              >
                Search all tracks
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {userPlaylists.map((pl) => {
                const isSelected = pl.id === activePlaylistId;
                const isPlPlaying = songs
                  .filter(s => pl.songIds.includes(s.id))
                  .some(s => currentTrack && s.id === currentTrack.id && isPlaying);

                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-900 border-zinc-800' 
                        : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={pl.coverUrl}
                        alt={pl.name}
                        className="w-10 h-10 rounded-lg object-cover shadow"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {pl.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate font-semibold">
                          {pl.songIds.length} tracks
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlPlaying) {
                          setIsPlaying(false);
                        } else {
                          setSelectedPlaylistId(pl.id);
                          const plSongs = songs.filter(s => pl.songIds.includes(s.id));
                          if (plSongs.length > 0) {
                            setCurrentTrack(plSongs[0]);
                            setIsPlaying(true);
                          }
                        }
                      }}
                      className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-emerald-500 hover:text-black text-zinc-400 flex items-center justify-center transition cursor-pointer"
                    >
                      {isPlPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Playlist Tracks details (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          {activePlaylist ? (
            <div className="space-y-6">
              
              {/* Active Playlist Detail Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 bg-gradient-to-b from-zinc-900/60 to-zinc-950 p-5 rounded-xl border border-zinc-900 shadow">
                <img
                  src={activePlaylist.coverUrl}
                  alt={activePlaylist.name}
                  className="w-24 h-24 rounded-lg object-cover shadow-lg border border-zinc-800"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <span className="text-[9px] text-emerald-400 font-mono uppercase font-bold tracking-widest block">
                    Curator Stage
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight truncate leading-none">
                    {activePlaylist.name}
                  </h2>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {activePlaylist.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span>By: <strong className="text-zinc-400">{currentUser.name}</strong></span>
                    <span>•</span>
                    <span>{playlistSongs.length} tracks</span>
                    <span>•</span>
                    <span>Created: {activePlaylist.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end">
                  {playlistSongs.length > 0 && (
                    <button
                      onClick={handlePlaylistPlayAll}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      {isPlaylistActivePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                      <span>{isPlaylistActivePlaying ? 'Pause Stream' : 'Play Stage'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setRenamePlaylistId(activePlaylist.id);
                      setRenameName(activePlaylist.name);
                      setRenameDesc(activePlaylist.description || '');
                      setRenameError('');
                      setRenameSuccess('');
                      setShowRenameModal(true);
                    }}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg transition cursor-pointer"
                    title="Rename / Edit Playlist"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      deletePlaylist(activePlaylist.id);
                      setSelectedPlaylistId(null);
                    }}
                    className="p-2 bg-rose-950 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-900/50 rounded-lg transition cursor-pointer"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tracks Listing */}
              <div className="bg-[#121214] border border-zinc-850 p-5 rounded-xl space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-widest">
                    Track List
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono">Click to play track • Hover to remove</span>
                </div>

                {playlistSongs.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500">
                    <ListMusic className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                    <p className="text-xs font-bold text-zinc-400">Empty playlist stage</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 max-w-xs mx-auto">
                      Stream songs from the home dashboard or catalog views, and tap the '+' icon to build up this list!
                    </p>
                    <button
                      onClick={() => navigate('/search')}
                      className="mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition cursor-pointer shadow-md"
                    >
                      Browse & Search Archive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {playlistSongs.map((song, idx) => {
                      const isThisTrack = currentTrack && song.id === currentTrack.id;
                      return (
                        <div
                          key={song.id}
                          onClick={() => handleTrackPlay(song)}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer group ${
                            isThisTrack ? 'bg-emerald-950/20 text-white' : 'hover:bg-zinc-900/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 text-xs font-mono text-zinc-600 text-center font-semibold">
                              {idx + 1}
                            </span>
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="w-9 h-9 rounded object-cover border border-zinc-850 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isThisTrack ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                {song.title}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate font-semibold">
                                {song.artistName} • {song.albumName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 font-mono text-zinc-500 text-[10px]">
                            <span>
                              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTrackFromPlaylist(activePlaylist.id, song.id);
                              }}
                              className="text-zinc-600 hover:text-rose-400 transition p-1 cursor-pointer"
                              title="Remove track"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-zinc-950/20 border border-zinc-900 rounded-xl">
              <FolderHeart className="w-12 h-12 text-zinc-800 mb-2 animate-pulse" />
              <h3 className="text-sm font-bold text-zinc-400">Select a playlist</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Choose an item from the left panel listing to display details.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h3 className="text-base font-bold text-white">Create playlist stage</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Build customized lists of audio releases</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-wider">Playlist Title</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Chill Waves"
                  className="w-full bg-[#242424] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-wider">Description (Optional)</label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="e.g. Soundtracks for late night study sessions"
                  rows={3}
                  className="w-full bg-[#242424] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-400 font-mono">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-400 font-mono">
                  {successMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowRenameModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={(e) => {
              e.preventDefault();
              setRenameError('');
              setRenameSuccess('');

              if (!renameName.trim()) {
                setRenameError('Playlist name is required.');
                return;
              }

              const result = renamePlaylist(renamePlaylistId, renameName, renameDesc);
              if (result.success) {
                setRenameSuccess(result.message);
                setTimeout(() => {
                  setShowRenameModal(false);
                  setRenameSuccess('');
                }, 1000);
              } else {
                setRenameError(result.message);
              }
            }} className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h3 className="text-base font-bold text-white">Rename Playlist</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Update title and description</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-wider">Playlist Title</label>
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  className="w-full bg-[#242424] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-wider">Description (Optional)</label>
                <textarea
                  value={renameDesc}
                  onChange={(e) => setRenameDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#242424] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white resize-none"
                />
              </div>

              {renameError && (
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-400 font-mono">
                  {renameError}
                </div>
              )}

              {renameSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-400 font-mono">
                  {renameSuccess}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Warning Overlay Modal for Tier Limit */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#181818] border border-amber-900/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Crown className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Playlist Creation Limit Reached</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {limitMessage || "You have reached your tier's playlist limit."}
              </p>
            </div>

            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-left space-y-2">
              <span className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Tier Allowances</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-zinc-500 block font-mono">FREE</span>
                  <span className="text-zinc-300">6 Playlists</span>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-zinc-500 block font-mono">SILVER</span>
                  <span className="text-zinc-300">100 Playlists</span>
                </div>
                <div className="p-2 bg-zinc-900/50 border border-emerald-500/30 rounded">
                  <span className="text-emerald-400 block font-mono">GOLD</span>
                  <span className="text-emerald-300">Unlimited</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
              >
                Dismiss Warning
              </button>
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  navigate('/profile');
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>Upgrade Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { useMockState } from '../context/MockStateContext';
import { Shield, Sparkles, User as UserIcon, Users, Headset, Star, ChevronDown, LogOut } from 'lucide-react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, users, switchUser, logout, config } = useMockState();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  const getRoleIcon = (role: string, tier?: string) => {
    if (role === 'admin') return <Shield className="w-4 h-4 text-rose-400" />;
    if (role === 'support') return <Headset className="w-4 h-4 text-sky-400" />;
    if (role === 'artist') return <Sparkles className="w-4 h-4 text-amber-400" />;
    if (tier === 'gold') return <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
    if (tier === 'silver') return <Star className="w-4 h-4 text-slate-300 fill-slate-300" />;
    return <UserIcon className="w-4 h-4 text-slate-400" />;
  };

  const getBadgeStyle = (user: User) => {
    if (user.role === 'admin') return 'bg-rose-950 text-rose-300 border-rose-800';
    if (user.role === 'support') return 'bg-sky-950 text-sky-300 border-sky-800';
    if (user.role === 'artist') return 'bg-amber-950 text-amber-300 border-amber-800';
    if (user.tier === 'gold') return 'bg-yellow-950 text-yellow-300 border-yellow-800';
    if (user.tier === 'silver') return 'bg-slate-800 text-slate-200 border-slate-700';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const getBadgeLabel = (user: User) => {
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'support') return 'Support Agent';
    if (user.role === 'artist') return 'Artist';
    return `${user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Listener`;
  };

  return (
    <div className="relative z-50">
      {/* Active User Header Banner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-full py-1.5 pl-2 pr-4 text-left transition duration-200 focus:outline-none shadow-lg cursor-pointer"
        id="role-switcher-btn"
      >
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover border border-zinc-700"
        />
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400 font-mono leading-none mb-0.5">Simulating Identity</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white max-w-[120px] truncate">{currentUser.name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono font-medium ${getBadgeStyle(currentUser)}`}>
              {getBadgeLabel(currentUser)}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown list of all user identities */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
            <div className="px-3 py-1.5 border-b border-zinc-900 mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Switch Target Account
              </span>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {users.map((u) => {
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-950/40 border border-emerald-900/50' 
                        : 'hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-800"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {u.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono truncate">{u.email}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-medium shrink-0 ${getBadgeStyle(u)}`}>
                      {getBadgeLabel(u)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-900 px-3 pb-1 text-[10px] text-zinc-500 font-mono flex flex-col gap-1">
              <div>Silver: ${config.silverPrice}/mo</div>
              <div>Gold: ${config.goldPrice}/mo</div>
              <div className="text-zinc-600">Simulate upgrades inside the app interface.</div>
            </div>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
                navigate('/login');
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-lg border border-rose-900/30 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out Identity</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

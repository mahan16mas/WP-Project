import React from 'react';
import { useMockState } from '../context/MockStateContext';
import { 
  Bell, 
  Trash2, 
  Check, 
  CheckCheck, 
  MailOpen, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Clock 
} from 'lucide-react';
import './ProfileSettings.css';

export const NotificationsView: React.FC = () => {
  const { 
    currentUser, 
    notifications, 
    markNotificationRead, 
    clearAllNotifications, 
    deleteNotification 
  } = useMockState();

  if (!currentUser) return null;

  // Filter notifications relevant to current user identity, role, or 'all'
  const relevantNotifs = notifications.filter(n => {
    if (n.userId === currentUser.id) return true;
    if (n.role === currentUser.role) return true;
    if (n.role === 'all') return true;
    return false;
  });

  const unreadCount = relevantNotifs.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    if (type === 'success') return <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />;
    if (type === 'ticket') return <MessageSquare className="w-5 h-5 text-sky-400 shrink-0" />;
    return <Bell className="w-5 h-5 text-zinc-400 shrink-0" />;
  };

  const getNotifBorderClass = (type: string, read: boolean) => {
    if (read) return 'border-zinc-900/60 opacity-75';
    if (type === 'warning') return 'border-amber-900/30 ring-1 ring-amber-500/10';
    if (type === 'success') return 'border-emerald-900/30 ring-1 ring-emerald-500/10';
    if (type === 'ticket') return 'border-sky-900/30 ring-1 ring-sky-500/10';
    return 'border-zinc-800/80';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* View Title Panel */}
      <div className="border-b border-zinc-900 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-emerald-400" />
            <span>Alert & Notifications Center</span>
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Stay updated with system billing logs, artist certifications, and agent feedback channels.
          </p>
        </div>

        {relevantNotifs.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-900/40 text-emerald-400 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Read All</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Dynamic Alerts List (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          
          {relevantNotifs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/20 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-300">No Alerts Found</p>
                <p className="text-xs text-zinc-500 font-medium">Your inbox is currently clear of any new announcements.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {relevantNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border flex gap-4 transition items-start ${
                    n.read 
                      ? 'bg-zinc-950/30' 
                      : 'bg-zinc-900/45 hover:bg-zinc-900/70 notif-unread-bg'
                  } ${getNotifBorderClass(n.type, n.read)}`}
                >
                  {/* Category icon */}
                  <div className="mt-0.5">
                    {getNotifIcon(n.type)}
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm font-bold truncate ${n.read ? 'text-zinc-400' : 'text-white'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="notif-badge-unread shrink-0" title="Unread Notice" />
                        )}
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${n.read ? 'text-zinc-500 font-medium' : 'text-zinc-300 font-medium'}`}>
                      {n.message}
                    </p>

                    <div className="flex items-center gap-2 pt-1 font-mono text-[8px] text-zinc-600">
                      <span className="uppercase">{n.type} log</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Operational actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {!n.read && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/30 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Alerts Context Panel (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#121214] border border-zinc-800/80 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest">
              Notification Rules
            </h3>
            
            <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed font-medium">
              <p>
                Our telemetry system dispatches alerts based on your active identity role and account credentials.
              </p>
              
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-2">
                <span className="text-[9px] text-zinc-500 font-mono block uppercase">Active Filters</span>
                <ul className="space-y-1.5 text-[10px] text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    <span>Personal logs (User ID: <code className="text-emerald-400">{currentUser.id}</code>)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    <span>Role dispatches (Role: <code className="text-indigo-400 capitalize">{currentUser.role}</code>)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    <span>System-wide global releases</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] text-zinc-500 font-mono leading-normal">
                <strong>Simulated:</strong> Standard alerts clear after user logouts unless stored inside your browser's persistent LocalStorage cache.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ArrowRight,
  Sun,
  Moon,
  RefreshCw,
  User,
  Sparkles,
  Home,
  AlertOctagon,
  Package,
  Compass
} from 'lucide-react';

interface CommandMenuItem {
  id: string;
  label: string;
  subtext?: string;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: CommandMenuItem[];
  requests: any[];
  shelters: any[];
  resources: any[];
  theme: 'dark' | 'light';
  onSelectTab: (tabId: any) => void;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onRefresh: () => void;
  onReplayIntro: () => void;
}

interface PaletteEntry {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  requests,
  shelters,
  resources,
  theme,
  onSelectTab,
  onToggleTheme,
  onOpenProfile,
  onRefresh,
  onReplayIntro
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const allEntries = useMemo<PaletteEntry[]>(() => {
    const items: PaletteEntry[] = [];

    menuItems.forEach((tab) => {
      items.push({
        id: `nav-${tab.id}`,
        group: 'Navigation Modules',
        title: tab.label,
        subtitle: tab.subtext || 'Switch workspace portal view',
        icon: <Compass className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onSelectTab(tab.id);
          onClose();
        }
      });
    });

    items.push(
      {
        id: 'act-theme',
        group: 'Quick Actions',
        title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: 'Toggle accessible visual surface contrast theme',
        icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onToggleTheme();
          onClose();
        }
      },
      {
        id: 'act-profile',
        group: 'Quick Actions',
        title: 'My Profile, Quick Unlock & Account Settings',
        subtitle: 'Configure Pattern, PIN, Biometrics, or photo',
        icon: <User className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenProfile();
        }
      },
      {
        id: 'act-refresh',
        group: 'Quick Actions',
        title: 'Refresh All Operational Data',
        subtitle: 'Sync latest emergency requests, shelters & stock',
        icon: <RefreshCw className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onRefresh();
          onClose();
        }
      },
      {
        id: 'act-intro',
        group: 'Quick Actions',
        title: 'Replay 3D CriSync Brand Formation Intro',
        subtitle: 'Show Crisis + Sync intro animation',
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          onReplayIntro();
        }
      }
    );

    const hasDashboard = menuItems.some((m) => m.id === 'dashboard');
    const reqTargetTab = hasDashboard ? 'dashboard' : menuItems[0]?.id || 'citizen';
    requests.slice(0, 12).forEach((req) => {
      items.push({
        id: `req-${req.id}`,
        group: 'Emergency Requests',
        title: `${req.referenceCode || ''} ${req.title || 'Help Request'}`.trim(),
        subtitle: `${req.category} • Urgency: ${req.finalApprovedUrgency || req.urgency} • Status: ${req.status}`,
        icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
        action: () => {
          onSelectTab(reqTargetTab);
          onClose();
        }
      });
    });

    const shelterTarget = menuItems.some((m) => m.id === 'shelters')
      ? 'shelters'
      : menuItems.some((m) => m.id === 'citizen')
      ? 'citizen'
      : menuItems[0]?.id;
    shelters.slice(0, 8).forEach((sh) => {
      items.push({
        id: `shelter-${sh.id}`,
        group: 'Safe Shelters',
        title: sh.name,
        subtitle: `Occupancy: ${sh.currentOccupancy}/${sh.totalCapacity} • ${sh.isWheelchairAccessible ? 'Wheelchair Accessible' : 'Standard Access'}`,
        icon: <Home className="w-4 h-4 text-emerald-400" />,
        action: () => {
          if (shelterTarget) onSelectTab(shelterTarget);
          onClose();
        }
      });
    });

    const logisticsTarget = menuItems.some((m) => m.id === 'logistics')
      ? 'logistics'
      : menuItems[0]?.id;
    resources.slice(0, 8).forEach((res) => {
      items.push({
        id: `res-${res.id}`,
        group: 'Relief Stock & Depots',
        title: `${res.name} (${res.warehouseName})`,
        subtitle: `Available: ${res.availableQuantity} ${res.unit} • ${res.supportsColdChain ? 'Cold-Chain' : 'Standard'}`,
        icon: <Package className="w-4 h-4 text-purple-400" />,
        action: () => {
          if (logisticsTarget) onSelectTab(logisticsTarget);
          onClose();
        }
      });
    });

    return items;
  }, [menuItems, requests, shelters, resources, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries.slice(0, 12);
    return allEntries
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          entry.subtitle.toLowerCase().includes(q) ||
          entry.group.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [allEntries, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[95]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Global Quick Search and Command Palette"
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-x-3 top-14 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-20 z-[100] sm:w-full sm:max-w-xl bento-glass rounded-3xl border border-indigo-500/35 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search requests (REQ-...), shelters, stock, modules or actions..."
                className="w-full bg-transparent text-sm font-medium text-white placeholder:text-zinc-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Command Palette"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60dvh] overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-400">
                  No matching portal modules, requests, shelters, or resources found.
                </div>
              ) : (
                filtered.map((entry, idx) => {
                  const isFocused = idx === selectedIndex;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={entry.action}
                      className={`w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition ${
                        isFocused
                          ? 'bg-indigo-600/20 border border-indigo-500/40'
                          : 'border border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                          {entry.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                              {entry.group}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {entry.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {entry.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 shrink-0 ${isFocused ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-400">
              <span>Navigate: ↑↓ • Open: Enter</span>
              <span>Close: Esc</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

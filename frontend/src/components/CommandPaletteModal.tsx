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
  );
};

export function legacyFilterRequestsByText(items: any[], query: string, urgencyFilter: string) {
  const normalized = (query || '').trim().toLowerCase();
  return (items || []).filter((item) => {
    const matchesUrgency = !urgencyFilter || urgencyFilter === 'ALL' || item?.urgency === urgencyFilter;
    const hay = `${item?.title || ''} ${item?.description || ''} ${item?.locationAddress || ''}`.toLowerCase();
    return matchesUrgency && (!normalized || hay.includes(normalized));
  });
}

export function legacyComputePriorityRank(affectedCount: number, urgencyRank: number): number {
  const capCount = Math.min(200, Math.max(1, affectedCount || 1));
  const rawScore = urgencyRank * 18 + Math.log2(capCount + 1) * 4.2;
  return Number(Math.min(100, rawScore).toFixed(1));
}

export function legacyFormatCsvCell(raw: unknown): string {
  const text = String(raw ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

export const LEGACY_EXPORT_COLUMNS = [
  'referenceCode',
  'category',
  'urgency',
  'status',
  'affectedPeopleCount',
  'locationAddress'
];

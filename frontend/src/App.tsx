import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  UserCheck,
  Sparkles,
  Truck,
  Home,
  Users,
  HeartHandshake,
  MapPin,
  RefreshCw,
  LogOut,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
  Sun,
  Moon,
  Menu,
  HelpCircle,
  Globe,
  User,
  Camera,
  Lock,
  Phone,
  Pencil,
  Fingerprint,
  ShieldCheck,
  Trash2,
  Smartphone,
  Search
} from 'lucide-react';
import { apiFetch } from './api';
import { LANGUAGE_OPTIONS, SupportedLanguage, TRANSLATIONS } from './i18n';
import { LoginPage } from './pages/LoginPage';
import { GlobalEarthBackdrop } from './components/GlobalEarthBackdrop';
import { PatternLockPad } from './components/PatternLockPad';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import {
  clearTrustedDeviceUnlock,
  detectCurrentDeviceName,
  enrollDeviceBiometric,
  isPlatformBiometricSupported,
  loadTrustedDeviceUnlock,
  saveTrustedDeviceUnlock
} from './utils/quickUnlock';
import { DashboardTab } from './pages/DashboardTab';
import { CitizenPortalTab } from './pages/CitizenPortalTab';
import { AiGovernanceTab } from './pages/AiGovernanceTab';
import { LogisticsTab } from './pages/LogisticsTab';
import {
  SheltersTab,
  VolunteersTab,
  DonationsTab,
  MapAndResilienceTab
} from './pages/SheltersVolunteersDonationsTab';

type TabKey =
  | 'dashboard'
  | 'citizen'
  | 'ai-governance'
  | 'logistics'
  | 'shelters'
  | 'volunteers'
  | 'donations'
  | 'map-resilience';

interface MenuItemConfig {
  id: TabKey;
  number: string;
  label: string;
  subtext: string;
}

function getModuleIcon(id: TabKey, className = 'w-4 h-4') {
  switch (id) {
    case 'dashboard':
      return <Activity className={className} />;
    case 'citizen':
      return <UserCheck className={className} />;
    case 'ai-governance':
      return <Sparkles className={className} />;
    case 'logistics':
      return <Truck className={className} />;
    case 'shelters':
      return <Home className={className} />;
    case 'volunteers':
      return <Users className={className} />;
    case 'donations':
      return <HeartHandshake className={className} />;
    case 'map-resilience':
      return <MapPin className={className} />;
  }
}

function getFriendlyRoleTitle(role: string): string {
  switch (role) {
    case 'Citizen':
      return 'Affected Citizen';
    case 'Donor':
      return 'Public Donor';
    case 'Volunteer':
      return 'Field Volunteer';
    case 'EmergencyCoordinator':
      return 'Emergency Coordinator';
    case 'CaseManager':
      return 'Case Manager';
    case 'LogisticsManager':
      return 'Logistics Manager';
    case 'ShelterAdmin':
      return 'Shelter Admin';
    case 'VolunteerCoordinator':
      return 'Volunteer Coordinator';
    case 'DonorOfficer':
      return 'Donor / Funding Officer';
    case 'PartnerOfficer':
      return 'Partner Agency Officer';
    case 'OrganizationAdmin':
      return 'Organization Admin';
    case 'SystemAdmin':
      return 'Global System Admin';
    default:
      return role;
  }
}

function getRoleMenuItems(role: string): MenuItemConfig[] {
  switch (role) {
    case 'Citizen':
      return [
        { id: 'citizen', number: '1', label: 'Request Help & My Aid', subtext: 'Ask for aid, update family info & track delivery' },
        { id: 'map-resilience', number: '2', label: 'Live Shelter & Crisis Map', subtext: 'Find nearby safe shelters & open routes' },
        { id: 'donations', number: '3', label: 'Relief Campaigns', subtext: 'See community relief funds & support' }
      ];
    case 'Donor':
      return [
        { id: 'donations', number: '1', label: 'Relief Campaigns & Donate', subtext: 'Support disaster relief funds & pledge supplies' },
        { id: 'map-resilience', number: '2', label: 'Live Crisis Impact Map', subtext: 'View crisis zones, shelters & relief progress' }
      ];
    case 'Volunteer':
      return [
        { id: 'volunteers', number: '1', label: 'Volunteer Portal & Status', subtext: 'Check verification status & active missions' },
        { id: 'map-resilience', number: '2', label: 'Field Map & Routes', subtext: 'View incident locations & safe shelters' }
      ];
    case 'EmergencyCoordinator':
      return [
        { id: 'dashboard', number: '1', label: 'Overview & Cases', subtext: 'Live summary, briefings, citizen requests & invitations' },
        { id: 'ai-governance', number: '2', label: 'AI Priority & Forecast', subtext: 'Approve AI urgency scores & 48-hour supply needs' },
        { id: 'logistics', number: '3', label: 'Supplies & Dispatch', subtext: 'Plan deliveries & manage warehouse stock' },
        { id: 'shelters', number: '4', label: 'Evacuation Shelters', subtext: 'Check shelter capacity & assign families' },
        { id: 'volunteers', number: '5', label: 'Volunteers & Teams', subtext: 'Verify volunteers & assign field tasks' },
        { id: 'map-resilience', number: '6', label: 'Live Map & System Health', subtext: 'Crisis map, backup controls & activity logs' }
      ];
    case 'CaseManager':
      return [
        { id: 'dashboard', number: '1', label: 'Case Queue & Citizen Onboarding', subtext: 'Verify cases & register offline citizens on their behalf' },
        { id: 'ai-governance', number: '2', label: 'AI Priority Review', subtext: 'Approve or adjust AI urgency recommendations' },
        { id: 'shelters', number: '3', label: 'Shelter Check-In', subtext: 'Place displaced families into safe shelters' },
        { id: 'map-resilience', number: '4', label: 'Live Crisis Map', subtext: 'View request locations & safe zones' }
      ];
    case 'LogisticsManager':
      return [
        { id: 'logistics', number: '1', label: 'Supplies & Dispatch', subtext: 'Allocate warehouse stock & dispatch aid' },
        { id: 'ai-governance', number: '2', label: '48-Hour Supply Forecast', subtext: 'View predicted shortages for the next 2 days' },
        { id: 'map-resilience', number: '3', label: 'Warehouse & Route Map', subtext: 'View depot locations & check road distances' }
      ];
    case 'ShelterAdmin':
      return [
        { id: 'shelters', number: '1', label: 'Manage Shelters & Check-In', subtext: 'Check in families & register new shelters' },
        { id: 'dashboard', number: '2', label: 'Shelter Help Requests', subtext: 'Review citizen requests needing shelter' },
        { id: 'map-resilience', number: '3', label: 'Shelter Map', subtext: 'View all shelters & flood risk zones' }
      ];
    case 'VolunteerCoordinator':
      return [
        { id: 'volunteers', number: '1', label: 'Verify Volunteers & Matching', subtext: 'Verify Pending volunteers & deploy field teams' },
        { id: 'dashboard', number: '2', label: 'Field Rescue Cases', subtext: 'View active rescue & medical requests' },
        { id: 'map-resilience', number: '3', label: 'Field Map & Routes', subtext: 'See incident pins & calculate travel distance' }
      ];
    case 'DonorOfficer':
      return [
        { id: 'donations', number: '1', label: 'Campaigns & Donations', subtext: 'Track fundraising, record gifts & approve large donations' },
        { id: 'dashboard', number: '2', label: 'Crisis Impact Summary', subtext: 'See how relief funds are helping on the ground' }
      ];
    case 'PartnerOfficer':
      return [
        { id: 'dashboard', number: '1', label: 'Shared Relief Cases', subtext: 'Coordinate on multi-agency citizen requests' },
        { id: 'logistics', number: '2', label: 'Partner Supply Sharing', subtext: 'Add partner stock to warehouses & plan deliveries' },
        { id: 'volunteers', number: '3', label: 'Specialist Teams', subtext: 'Assign partner medical & rescue volunteers' },
        { id: 'map-resilience', number: '4', label: 'Shared Crisis Map', subtext: 'View operational zones, shelters & depots' }
      ];
    case 'OrganizationAdmin':
    case 'SystemAdmin':
    default:
      return [
        { id: 'map-resilience', number: '1', label: 'Admin Control, Users & Map', subtext: 'Manage users, partnerships, permissions, integrations & logs' },
        { id: 'dashboard', number: '2', label: 'Overview & Cases', subtext: 'Full view of crisis cases, invitations & onboarding' },
        { id: 'ai-governance', number: '3', label: 'AI Priority Review', subtext: 'Review AI scoring & 48-hour demand forecast' },
        { id: 'logistics', number: '4', label: 'Supplies & Dispatch', subtext: 'Supervise warehouse stock & allocation plans' },
        { id: 'shelters', number: '5', label: 'Evacuation Shelters', subtext: 'Supervise shelter occupancy & registrations' },
        { id: 'volunteers', number: '6', label: 'Volunteers & Teams', subtext: 'Verify Pending volunteers & supervise deployments' },
        { id: 'donations', number: '7', label: 'Donations & Compliance', subtext: 'Supervise relief campaigns & compliance checks' },
        { id: 'citizen', number: '8', label: 'Citizen Portal View', subtext: 'Preview the public citizen help portal' }
      ];
  }
}

function getRolePermissionsSummary(role: string): string {
  switch (role) {
    case 'Citizen':
      return 'You can submit emergency help requests, save your family details, find safe shelters, and rate delivered aid.';
    case 'Donor':
      return 'You can support humanitarian fundraising campaigns, log monetary gifts or in-kind supply pledges, and track live relief impact.';
    case 'Volunteer':
      return 'Your volunteer profile is verified by a Volunteer Coordinator before field deployment. Check your activation status and available missions.';
    case 'EmergencyCoordinator':
      return 'You can declare crises, oversee cases, invite operational roles (CaseManager, ShelterAdmin, LogisticsManager, VolunteerCoordinator), and review AI priorities.';
    case 'CaseManager':
      return 'You can verify citizen cases, register affected citizens without internet/phone access on their behalf, merge duplicates, and review AI priorities.';
    case 'LogisticsManager':
      return 'You can preview and dispatch warehouse supplies using smart allocation rules, and add new relief inventory.';
    case 'ShelterAdmin':
      return 'You can check displaced families into safe evacuation centers and register new temporary relief shelters.';
    case 'VolunteerCoordinator':
      return 'You can verify and activate Pending volunteer accounts, search volunteers by skill & distance, and assign field rescue tasks.';
    case 'DonorOfficer':
      return 'Appointed by Global System Admin: monitor relief campaigns, record donations, and approve high-value compliance checks.';
    case 'PartnerOfficer':
      return 'Submit partner organization details for Admin approval, and coordinate multi-agency relief supplies & specialist teams.';
    case 'OrganizationAdmin':
      return 'Organization Admin: manage staff accounts, approve partner organizations, review role permissions, and inspect system logs.';
    case 'SystemAdmin':
    default:
      return 'Global System Admin: appoint Donor Officers & Admins under the small-count policy, approve partnerships, manage roles & integration settings.';
  }
}

const LAUNCH_STAGES = [
  'Authenticating RBAC role & security session...',
  'Synchronizing live relief coordination telemetry & AI triage...',
  'Launching CriSync Command Workspace...'
];

type IntroPhase = 'enter' | 'fuse' | 'locked';

function CriSyncBrandIntroOverlay({
  phase,
  theme,
  onSkip
}: {
  phase: IntroPhase;
  theme: 'dark' | 'light';
  onSkip: () => void;
}) {
  const isFused = phase === 'fuse' || phase === 'locked';
  return (
    <motion.div
      key="crisync-brand-intro"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
      className={`fixed inset-0 z-[110] flex flex-col items-center justify-center px-6 overflow-hidden backdrop-blur-2xl ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-zinc-100'
      }`}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.24),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      <button
        type="button"
        onClick={onSkip}
        className={`fixed top-5 right-5 z-20 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${theme === 'light'
            ? 'bg-white/90 hover:bg-white border-slate-200 text-slate-700 shadow-sm'
            : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-zinc-300'
        }`}
      >
        Skip Intro →
      </button>

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl w-full space-y-7">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
          <motion.div
            animate={
              isFused
                ? { scale: [0.85, 1.55], opacity: [0.65, 0] }
                : { scale: [0.9, 1.15], opacity: [0.35, 0.1] }
            }
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-cyan-400/50"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-dashed border-indigo-400/45 border-t-cyan-400"
          />
          <motion.img
            src="/crisync-logo.png"
            alt="CriSync Logo"
            initial={{ scale: 0.55, opacity: 0, rotate: -10 }}
            animate={
              phase === 'locked'
                ? { scale: [1, 1.07, 1], opacity: 1, rotate: 0 }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] object-cover crisync-logo-frame ${isFused ? 'crisync-fusion-glow' : ''
            }`}
          />
        </div>

        <div className="relative flex flex-col items-center space-y-4 w-full">
          {isFused && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.35, opacity: 0.9 }}
                animate={{ scale: 2.35, opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
                className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border-2 border-cyan-400/75 shadow-[0_0_40px_rgba(34,211,238,0.45)]"
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const dist = 125;
                return (
                  <motion.span
                    key={deg}
                    initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
                    animate={{
                      x: Math.cos(rad) * dist,
                      y: Math.sin(rad) * dist * 0.55,
                      scale: 0,
                      opacity: 0
                    }}
                    transition={{ duration: 0.78, ease: 'easeOut' }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400"
                  />
                );
              })}
            </div>
          )}

          <div className="relative flex flex-wrap sm:flex-nowrap items-center justify-center crisync-intro-word text-5xl sm:text-7xl lg:text-8xl tracking-tight select-none">
            <motion.div
              initial={{ x: -220, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="inline-flex items-baseline"
            >
              <span className="crisync-wordmark-primary">Cri</span>
              <motion.span
                initial={{ opacity: 1, maxWidth: 360 }}
                animate={
                  phase === 'enter'
                    ? { opacity: 1, maxWidth: 360 }
                    : { opacity: 0, maxWidth: 0 }
                }
                transition={
                  phase === 'enter'
                    ? { duration: 0.2 }
                    : {
                        opacity: { duration: 0.16, ease: 'easeOut' },
                        maxWidth: { duration: 0.48, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }
                      }
                }
                className={`crisync-fragment-sis inline-block align-baseline ${phase === 'enter' ? 'overflow-visible' : 'overflow-hidden'
                }`}
              >
                sis
              </motion.span>
            </motion.div>

            <motion.span
              initial={{ scale: 0, opacity: 0, maxWidth: 88, marginLeft: 20, marginRight: 20 }}
              animate={
                phase === 'enter'
                  ? { scale: 1, opacity: 1, maxWidth: 88, marginLeft: 20, marginRight: 20 }
                  : { scale: 0, opacity: 0, maxWidth: 0, marginLeft: 0, marginRight: 0 }
              }
              transition={
                phase === 'enter'
                  ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }
                  : {
                      opacity: { duration: 0.15, ease: 'easeOut' },
                      scale: { duration: 0.2, ease: 'easeOut' },
                      maxWidth: { duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const },
                      marginLeft: { duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const },
                      marginRight: { duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }
                    }
              }
              className="inline-flex items-center justify-center overflow-hidden rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 text-2xl sm:text-4xl font-black w-10 h-10 sm:w-14 sm:h-14 shrink-0"
            >
              +
            </motion.span>

            <motion.span
              initial={{ x: 220, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="crisync-wordmark-accent inline-block"
            >
              Sync
            </motion.span>
          </div>

          <div className="w-56 sm:w-72 h-7 flex items-center justify-center">
            <svg viewBox="0 0 280 34" className="w-full h-full overflow-visible" fill="none">
              <defs>
                <linearGradient id="crisyncPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 0 17 L 78 17 L 94 17 L 106 5 L 118 29 L 132 3 L 146 31 L 158 17 L 176 17 L 280 17"
                stroke="url(#crisyncPulseGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0.35 }}
                animate={
                  isFused
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0.25, opacity: 0.45 }
                }
                transition={{ duration: 0.95, ease: 'easeInOut' }}
              />
            </svg>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'enter' ? (
              <motion.div
                key="stage-components"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold"
              >
                <span className="px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-400">
                  From Left: Crisis (&ldquo;Cry-sis&rdquo;)
                </span>
                <span className="text-zinc-500 font-black">+</span>
                <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-400">
                  From Right: Sync (&ldquo;Synchronize&rdquo;)
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="stage-fused"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-2.5"
              >
                <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bento-glass border border-indigo-500/35 text-xs sm:text-sm font-extrabold">
                  <span className={theme === 'light' ? 'text-slate-700' : 'text-zinc-300'}>Crisis</span>
                  <span className="text-indigo-400">+</span>
                  <span className="text-cyan-400">Sync</span>
                  <span className="text-indigo-400">→</span>
                  <span className="crisync-wordmark text-base sm:text-lg">
                    <span className="crisync-wordmark-primary">Cri</span>
                    <span className="crisync-wordmark-accent">Sync</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/35 text-[11px] font-bold text-indigo-400">
                    Pronounced: &ldquo;Cry-Sync&rdquo;
                  </span>
                </div>
                <p className={`text-xs sm:text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Synchronizing Humanitarian Aid & Disaster Response
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-xs mx-auto pt-2">
            <div className="h-1.5 w-full rounded-full bg-white/10 border border-white/10 overflow-hidden">
              <motion.div
                initial={{ width: '4%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.4, ease: 'easeInOut' }}
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-indigo-500 to-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CrisyncLaunchOverlay({
  user,
  stageIndex,
  theme
}: {
  user: any;
  stageIndex: number;
  theme: 'dark' | 'light';
}) {
  return (
    <motion.div
      key="crisync-launch-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 overflow-hidden backdrop-blur-2xl ${theme === 'light' ? 'bg-slate-50/95 text-slate-900' : 'bg-[#07090e]/98 text-zinc-100'
      }`}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.22),transparent_62%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />

      <div className="relative flex flex-col items-center text-center max-w-md w-full">
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center mb-6">
          <motion.div
            animate={{ scale: [0.75, 1.5], opacity: [0.55, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-cyan-400/45"
          />
          <motion.div
            animate={{ scale: [0.75, 1.65], opacity: [0.45, 0] }}
            transition={{ duration: 1.8, delay: 0.85, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-indigo-400/40"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
            className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-dashed border-cyan-400/45 border-t-indigo-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
            className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-indigo-400/25 border-b-rose-400/75"
          />

          <motion.div
            initial={{ scale: 0.45, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 19 }}
            className="relative z-10"
          >
            <motion.img
              src="/crisync-logo.png"
              alt="CriSync Logo"
              animate={{ scale: [1, 1.055, 1] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] object-cover crisync-logo-frame"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="space-y-3 w-full"
        >
          <div className="crisync-wordmark text-4xl sm:text-5xl tracking-tight">
            <span className="crisync-wordmark-primary">Cri</span>
            <span className="crisync-wordmark-accent">Sync</span>
          </div>

          <div className="bento-glass rounded-2xl px-4 py-3 border border-indigo-500/25 flex items-center justify-center gap-3 mx-auto max-w-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                {user.fullName} • {getFriendlyRoleTitle(user.role)}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {user.organisationName}
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs mx-auto pt-2 space-y-2.5">
            <div className="h-2 w-full rounded-full bg-white/10 border border-white/10 overflow-hidden">
              <motion.div
                initial={{ width: '8%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.1, ease: 'easeInOut' }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500"
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={stageIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-semibold text-indigo-300 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{LAUNCH_STAGES[stageIndex] || LAUNCH_STAGES[0]}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('aether_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [showBrandIntro, setShowBrandIntro] = useState<boolean>(() => {
    try {
      if (localStorage.getItem('crisync_auth_user')) return false;
      return !sessionStorage.getItem('crisync_intro_seen');
    } catch {
      return false;
    }
  });
  const [introPhase, setIntroPhase] = useState<IntroPhase>('enter');
  const [introRunId, setIntroRunId] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const savedTab = localStorage.getItem('crisync_active_tab') as TabKey;
      return savedTab || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [mobileNavDrawerOpen, setMobileNavDrawerOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [authUser, setAuthUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('crisync_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLanguage, setProfileLanguage] = useState('en');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUnlocked, setProfileUnlocked] = useState<Record<string, boolean>>({});
  const [quickUnlockStatus, setQuickUnlockStatus] = useState<{
    quickUnlockEnabled: boolean;
    mode: string;
    hasBiometricCredential: boolean;
    failedAttempts: number;
    trustedDevices?: {
      deviceId: string;
      deviceName: string;
      originHost: string;
      hasBiometrics: boolean;
      createdAtUtc: string;
    }[];
  } | null>(null);
  const [currentDeviceBound, setCurrentDeviceBound] = useState(false);
  const [quickUnlockMode, setQuickUnlockMode] = useState<'Pattern' | 'Pin'>('Pattern');
  const [quickUnlockPin, setQuickUnlockPin] = useState('');
  const [quickUnlockPattern, setQuickUnlockPattern] = useState('');
  const [quickUnlockCurrentPassword, setQuickUnlockCurrentPassword] = useState('');
  const [quickUnlockUseBiometrics, setQuickUnlockUseBiometrics] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [quickUnlockBusy, setQuickUnlockBusy] = useState(false);
  const [loginTransitionUser, setLoginTransitionUser] = useState<any | null>(null);
  const [loginStageIndex, setLoginStageIndex] = useState<number>(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [metrics, setMetrics] = useState<any | null>(null);
  const [crises, setCrises] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [household, setHousehold] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [demandForecast, setDemandForecast] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<any | null>(null);
  const [briefingLang, setBriefingLang] = useState('en');

  const [resources, setResources] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState('MultiConstraintOptimal');
  const [selectedCompetingIds, setSelectedCompetingIds] = useState<string[]>([]);
  const [allocationPlanResult, setAllocationPlanResult] = useState<any | null>(null);

  const [organisations, setOrganisations] = useState<any[]>([]);
  const [sheltersData, setSheltersData] = useState<any>({ shelters: [], allocations: [] });
  const [volunteersData, setVolunteersData] = useState<any>({ volunteers: [], assignments: [] });
  const [volunteerMatches, setVolunteerMatches] = useState<any[]>([]);
  const [donationsData, setDonationsData] = useState<any>({ campaigns: [], donations: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminPartnerships, setAdminPartnerships] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any | null>(null);
  const [serviceSettings, setServiceSettings] = useState<any | null>(null);
  const [resilienceStatus, setResilienceStatus] = useState<any | null>(null);
  const [routeCalc, setRouteCalc] = useState<any | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);
  const [myNotifications, setMyNotifications] = useState<any[]>([]);
  const [logisticsAllocationsData, setLogisticsAllocationsData] = useState<any>({
    allocations: [],
    dispatches: [],
    partnerAidRequests: []
  });
  const [transparencyReport, setTransparencyReport] = useState<any | null>(null);
  const [mappingReferences, setMappingReferences] = useState<any[]>([]);
  const [coverageReport, setCoverageReport] = useState<any | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<any | null>(null);
  const [sitRepReport, setSitRepReport] = useState<any | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!showBrandIntro) return;
    setIntroPhase('enter');
    try {
      sessionStorage.setItem('crisync_intro_seen', 'true');
    } catch { }
    const fuseTimer = setTimeout(() => setIntroPhase('fuse'), 500);
    const lockTimer = setTimeout(() => setIntroPhase('locked'), 1000);
    const hideTimer = setTimeout(() => setShowBrandIntro(false), 1600);
    return () => {
      clearTimeout(fuseTimer);
      clearTimeout(lockTimer);
      clearTimeout(hideTimer);
    };
  }, [introRunId, showBrandIntro]);

  const triggerBrandIntro = () => {
    setShowBrandIntro(true);
    setIntroRunId((n) => n + 1);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('aether_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (authUser) {
      try {
        localStorage.setItem('crisync_auth_user', JSON.stringify(authUser));
      } catch { }
    } else {
      try {
        localStorage.removeItem('crisync_auth_user');
        localStorage.removeItem('crisync_active_tab');
      } catch { }
    }
  }, [authUser]);

  useEffect(() => {
    if (activeTab && authUser) {
      try {
        localStorage.setItem('crisync_active_tab', activeTab);
      } catch { }
    }
  }, [activeTab, authUser]);

  useEffect(() => {
    document.body.style.overflow =
      mobileNavDrawerOpen || languageMenuOpen || profileModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavDrawerOpen, languageMenuOpen, profileModalOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (authUser) {
          event.preventDefault();
          setCommandPaletteOpen((prev) => !prev);
        }
        return;
      }
      if (event.key === 'Escape') {
        if (commandPaletteOpen) setCommandPaletteOpen(false);
        if (profileModalOpen) setProfileModalOpen(false);
        if (languageMenuOpen) setLanguageMenuOpen(false);
        if (mobileNavDrawerOpen) setMobileNavDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authUser, commandPaletteOpen, profileModalOpen, languageMenuOpen, mobileNavDrawerOpen]);

  useEffect(() => {
    if (!statusBanner) return;
    const timer = setTimeout(() => {
      setStatusBanner(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [statusBanner]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const notify = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusBanner({ type, text });
  };

  useEffect(() => {
    const onUnauthorized = () => {
      setAuthUser(null);
      try {
        localStorage.removeItem('crisync_auth_user');
        localStorage.removeItem('crisync_active_tab');
      } catch { }
      setAdminUsers([]);
      setAdminPartnerships([]);
      setRolePermissions([]);
      setSystemConfig(null);
      setServiceSettings(null);
      setMyNotifications([]);
      setTransparencyReport(null);
      setStatusBanner(null);
      setProfileModalOpen(false);
      setMobileNavDrawerOpen(false);
      setCommandPaletteOpen(false);
      setLoginError('Your session expired. Please sign in again.');
    };
    window.addEventListener('crisync:unauthorized', onUnauthorized);
    return () => window.removeEventListener('crisync:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>('/organisations').catch(() => []),
      apiFetch<any[]>('/crises').catch(() => [])
    ]).then(([orgs, publicCrises]) => {
      setOrganisations(orgs);
      if (Array.isArray(publicCrises)) {
        setCrises(publicCrises);
      }
    });

    if (authUser?.token) {
      loadAllData(authUser.token, undefined, authUser.role).catch((err: any) => {
        if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
          handleLogout();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!authUser?.token) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadAllData(authUser.token, undefined, authUser.role);
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAllData(authUser.token, undefined, authUser.role);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authUser?.token, authUser?.role]);

  const loadAllData = async (tokenOverride?: string | null, langOverride?: string, roleOverride?: string) => {
    const activeToken = tokenOverride !== undefined ? tokenOverride : authUser?.token;
    if (!activeToken) {
      return;
    }
    const activeLang = langOverride || briefingLang;
    const activeRole = roleOverride || authUser?.role;
    const isAdminTier = activeRole === 'SystemAdmin' || activeRole === 'OrganizationAdmin';
    const canViewAuditLogs =
      activeRole === 'SystemAdmin' ||
      activeRole === 'OrganizationAdmin' ||
      activeRole === 'EmergencyCoordinator';
    setLoading(true);
    try {
      const [
        orgsRes,
        metricsRes,
        crisesRes,
        alertsRes,
        requestsRes,
        recsRes,
        resourcesRes,
        sheltersRes,
        volunteersRes,
        donationsRes,
        auditsRes,
        resilienceRes,
        householdRes,
        usersRes,
        partnershipsRes,
        permissionsRes,
        configRes,
        settingsRes,
        myNotifsRes,
        allocsDataRes,
        transparencyRes,
        mapRefsRes,
        coverageRes,
        feedbackAnalyticsRes,
        sitRepRes
      ] = await Promise.all([
        apiFetch<any[]>('/organisations', {}, activeToken).catch(() => []),
        apiFetch<any>('/admin/metrics', {}, activeToken).catch(() => null),
        apiFetch<any[]>('/crises', {}, activeToken).catch(() => []),
        apiFetch<any[]>('/crises/alerts', {}, activeToken).catch(() => []),
        apiFetch<any[]>('/requests', {}, activeToken).catch(() => []),
        apiFetch<any[]>('/ai-governance/recommendations', {}, activeToken).catch(() => []),
        apiFetch<any[]>('/logistics/resources', {}, activeToken).catch(() => []),
        apiFetch<any>('/shelters', {}, activeToken).catch(() => ({ shelters: [], allocations: [] })),
        apiFetch<any>('/volunteers', {}, activeToken).catch(() => ({ volunteers: [], assignments: [] })),
        apiFetch<any>('/donations', {}, activeToken).catch(() => ({ campaigns: [], donations: [] })),
        canViewAuditLogs ? apiFetch<any[]>('/admin/audit-logs', {}, activeToken).catch(() => []) : Promise.resolve([]),
        apiFetch<any>('/admin/resilience', {}, activeToken).catch(() => null),
        apiFetch<any>('/users/households/me', {}, activeToken).catch(() => null),
        isAdminTier ? apiFetch<any[]>('/admin/users', {}, activeToken).catch(() => []) : Promise.resolve([]),
        isAdminTier ? apiFetch<any[]>('/admin/partnerships', {}, activeToken).catch(() => []) : Promise.resolve([]),
        isAdminTier ? apiFetch<any[]>('/admin/role-permissions', {}, activeToken).catch(() => []) : Promise.resolve([]),
        isAdminTier ? apiFetch<any>('/admin/system-config', {}, activeToken).catch(() => null) : Promise.resolve(null),
        isAdminTier ? apiFetch<any>('/admin/service-settings', {}, activeToken).catch(() => null) : Promise.resolve(null),
        apiFetch<any[]>('/notifications/me', {}, activeToken).catch(() => []),
        apiFetch<any>('/logistics/allocations', {}, activeToken).catch(() => ({ allocations: [], dispatches: [], partnerAidRequests: [] })),
        apiFetch<any>('/donations/transparency-report', {}, activeToken).catch(() => null),
        apiFetch<any[]>('/mapping/references', {}, activeToken).catch(() => []),
        apiFetch<any>('/mapping/coverage-report', {}, activeToken).catch(() => null),
        apiFetch<any>('/requests/feedback', {}, activeToken).catch(() => null),
        apiFetch<any>('/reports/sitrep', {}, activeToken).catch(() => null)
      ]);

      if (Array.isArray(orgsRes) && orgsRes.length > 0) {
        setOrganisations(orgsRes);
      }
      setMetrics(metricsRes);
      setCrises(crisesRes);
      setAlerts(alertsRes);
      setRequests(requestsRes);
      setRecommendations(recsRes);
      setResources(resourcesRes);
      setSheltersData(sheltersRes);
      setVolunteersData(volunteersRes);
      setDonationsData(donationsRes);
      setAuditLogs(auditsRes);
      setResilienceStatus(resilienceRes);
      setHousehold(householdRes);
      setAdminUsers(Array.isArray(usersRes) ? usersRes : []);
      setAdminPartnerships(Array.isArray(partnershipsRes) ? partnershipsRes : []);
      setRolePermissions(Array.isArray(permissionsRes) ? permissionsRes : []);
      setSystemConfig(configRes);
      setServiceSettings(settingsRes);
      setMyNotifications(Array.isArray(myNotifsRes) ? myNotifsRes : []);
      setLogisticsAllocationsData(allocsDataRes || { allocations: [], dispatches: [], partnerAidRequests: [] });
      setTransparencyReport(transparencyRes);
      setMappingReferences(Array.isArray(mapRefsRes) ? mapRefsRes : []);
      setCoverageReport(coverageRes);
      setFeedbackAnalytics(feedbackAnalyticsRes);
      setSitRepReport(sitRepRes);

      if (requestsRes.length >= 2 && selectedCompetingIds.length === 0) {
        const medRequests = requestsRes
          .filter((r: any) => r.category === 'Medicine' && r.status !== 'MergedAsDuplicate')
          .map((r: any) => r.id);
        setSelectedCompetingIds(medRequests);
      }

      if (crisesRes.length > 0) {
        const primaryCrisisId = crisesRes[0].id;
        const [forecastRes, briefRes] = await Promise.all([
          apiFetch<any[]>(`/ai-governance/demand-forecast/${primaryCrisisId}`, {}, activeToken),
          apiFetch<any>(`/ai-governance/multilingual-briefing/${primaryCrisisId}?lang=${activeLang}`, {}, activeToken)
        ]);
        setDemandForecast(forecastRes);
        setBriefing(briefRes);
      } else {
        setDemandForecast([]);
        setBriefing(null);
      }
      setLastSyncedAt(new Date());
    } catch (err: any) {
      notify('error', err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const completeSessionLogin = async (res: any, successBannerText: string) => {
    let stageTimerOne: ReturnType<typeof setTimeout> | undefined;
    let stageTimerTwo: ReturnType<typeof setTimeout> | undefined;
    try {
      setMobileNavDrawerOpen(false);
      setLoginStageIndex(0);
      setLoginTransitionUser(res);

      stageTimerOne = setTimeout(() => setLoginStageIndex(1), 350);
      stageTimerTwo = setTimeout(() => setLoginStageIndex(2), 700);

      await loadAllData(res.token, undefined, res.role);

      const roleTabs = getRoleMenuItems(res.role);
      setActiveTab(roleTabs[0].id);
      setAuthUser(res);
      setLoginTransitionUser(null);
      notify('success', successBannerText);
    } finally {
      if (stageTimerOne) clearTimeout(stageTimerOne);
      if (stageTimerTwo) clearTimeout(stageTimerTwo);
    }
  };

  const handleLogin = async (emailToUse: string, passwordToUse: string, requireAdminRole = false) => {
    setLoginError(null);
    try {
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailToUse, password: passwordToUse })
      });
      if (requireAdminRole && res.role !== 'SystemAdmin' && res.role !== 'OrganizationAdmin') {
        setLoginError('Access Denied: The Admin Login portal is restricted to Global System Admin and Organization Admin accounts only.');
        return;
      }
      await completeSessionLogin(res, `Signed in as ${res.fullName} (${getFriendlyRoleTitle(res.role)})`);
    } catch (err: any) {
      setLoginTransitionUser(null);
      setLoginError(err.message || 'Invalid credentials');
    }
  };

  const handleQuickUnlockSession = async (res: any, methodLabel: string) => {
    setLoginError(null);
    try {
      await completeSessionLogin(res, `Unlocked via ${methodLabel} as ${res.fullName} (${getFriendlyRoleTitle(res.role)})`);
    } catch (err: any) {
      setLoginTransitionUser(null);
      setLoginError(err.message || 'Quick Unlock failed.');
    }
  };

  const handleRegister = async (payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: string;
    preferredLanguage: string;
    organisationId: string | null;
    primaryAddress?: string;
    totalMembers?: number;
    childrenCount?: number;
    elderlyCount?: number;
    hasMobilityNeeds?: boolean;
    hasChronicMedicalNeeds?: boolean;
    medicalNotes?: string;
    registerAsVolunteer?: boolean;
    skillsCsv?: string;
    languagesCsv?: string;
    availabilitySchedule?: string;
    baseTown?: string;
    organisationName?: string;
    organisationType?: string;
    country?: string;
    partnershipProposal?: string;
  }) => {
    setLoginError(null);
    let stageTimerOne: ReturnType<typeof setTimeout> | undefined;
    let stageTimerTwo: ReturnType<typeof setTimeout> | undefined;
    try {
      const res = await apiFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: payload.fullName.trim(),
          email: payload.email.trim(),
          phoneNumber: payload.phoneNumber.trim(),
          password: payload.password,
          role: payload.role,
          preferredLanguage: payload.preferredLanguage || 'en',
          organisationId: payload.organisationId || null,
          organisationName: payload.organisationName?.trim() || null,
          organisationType: payload.organisationType?.trim() || null,
          country: payload.country?.trim() || null,
          partnershipProposal: payload.partnershipProposal?.trim() || null,
          skillsCsv: payload.skillsCsv?.trim() || null,
          languagesCsv: payload.languagesCsv?.trim() || null,
          availabilitySchedule: payload.availabilitySchedule?.trim() || null
        })
      });

      const matchedOrg = organisations.find((o) => o.id === (res.organisationId || payload.organisationId));
      const enrichedRes = {
        ...res,
        organisationName: matchedOrg ? matchedOrg.name : res.organisationName
      };

      const chosenLang = payload.preferredLanguage || 'en';
      setBriefingLang(chosenLang);

      setMobileNavDrawerOpen(false);
      setLoginStageIndex(0);
      setLoginTransitionUser(enrichedRes);

      stageTimerOne = setTimeout(() => setLoginStageIndex(1), 700);
      stageTimerTwo = setTimeout(() => setLoginStageIndex(2), 1450);

      if (payload.role === 'Citizen') {
        await apiFetch<any>(
          '/users/households',
          {
            method: 'POST',
            body: JSON.stringify({
              householdHeadName: payload.fullName.trim(),
              totalMembers: Math.max(1, Number(payload.totalMembers) || 1),
              childrenCount: Math.max(0, Number(payload.childrenCount) || 0),
              elderlyCount: Math.max(0, Number(payload.elderlyCount) || 0),
              hasMobilityNeeds: Boolean(payload.hasMobilityNeeds),
              hasChronicMedicalNeeds: Boolean(payload.hasChronicMedicalNeeds),
              medicalNotes: payload.medicalNotes?.trim() || '',
              primaryAddress: payload.primaryAddress?.trim() || '',
              latitude: 6.9271,
              longitude: 79.8612
            })
          },
          enrichedRes.token
        ).catch(() => {});
      }

      if (payload.role === 'Citizen' && payload.registerAsVolunteer) {
        await apiFetch<any>(
          '/volunteers',
          {
            method: 'POST',
            body: JSON.stringify({
              fullName: payload.fullName.trim(),
              skillsCsv: payload.skillsCsv?.trim() || 'FirstAid, Logistics',
              languagesCsv: payload.languagesCsv?.trim() || 'English',
              availabilitySchedule: payload.availabilitySchedule?.trim() || 'Available On-Call',
              currentLatitude: 6.9271,
              currentLongitude: 79.8612
            })
          },
          enrichedRes.token
        ).catch(() => {});
      }

      await loadAllData(enrichedRes.token, chosenLang, enrichedRes.role);

      const roleTabs = getRoleMenuItems(enrichedRes.role);
      setActiveTab(roleTabs[0].id);
      setAuthUser(enrichedRes);
      setLoginTransitionUser(null);

  return null;
}

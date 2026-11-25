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

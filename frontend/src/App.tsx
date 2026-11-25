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

      if (enrichedRes.accountStatus === 'Pending') {
        notify(
          'info',
          `Volunteer registration submitted for ${enrichedRes.fullName}. Status is Pending until verified and activated by a Volunteer Coordinator.`
        );
      } else if (enrichedRes.accountStatus === 'PendingPartnershipApproval') {
        notify(
          'info',
          `Partner Organization request submitted for ${enrichedRes.fullName}. Status is Pending Admin approval.`
        );
      } else {
        notify(
          'success',
          `Welcome to CriSync, ${enrichedRes.fullName}! Account registered as ${getFriendlyRoleTitle(enrichedRes.role)}.`
        );
      }
    } catch (err: any) {
      setLoginTransitionUser(null);
      setLoginError(err.message || 'Registration failed. Please check your details.');
    } finally {
      if (stageTimerOne) clearTimeout(stageTimerOne);
      if (stageTimerTwo) clearTimeout(stageTimerTwo);
    }
  };

  const AVATAR_COLOR_PRESETS: Array<[string, string]> = [
    ['#4f46e5', '#06b6d4'],
    ['#e11d48', '#f97316'],
    ['#059669', '#14b8a6'],
    ['#7c3aed', '#ec4899'],
    ['#0284c7', '#3b82f6'],
    ['#d97706', '#eab308']
  ];

  const buildAvatarPresetDataUrl = (name: string, bgFrom: string, bgTo: string): string => {
    const parts = (name || 'CS').trim().split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : (name || 'CS').slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${bgFrom}"/><stop offset="100%" stop-color="${bgTo}"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g)"/><text x="60" y="74" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-weight="800" font-size="44">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const openProfileModal = () => {
    if (!authUser) return;
    setProfileFullName(authUser.fullName || '');
    setProfilePhone(authUser.phoneNumber || '');
    setProfileLanguage(authUser.preferredLanguage || briefingLang || 'en');
    setProfilePhotoUrl(authUser.profilePhotoUrl || '');
    setProfileCurrentPassword('');
    setProfileNewPassword('');
    setProfileUnlocked({});
    setQuickUnlockPin('');
    setQuickUnlockPattern('');
    setQuickUnlockCurrentPassword('');
    setQuickUnlockUseBiometrics(false);
    const localRecord = loadTrustedDeviceUnlock();
    setCurrentDeviceBound(Boolean(localRecord && localRecord.userId === authUser.id));
    setMobileNavDrawerOpen(false);
    setProfileModalOpen(true);

    void isPlatformBiometricSupported().then(setBiometricSupported);
    void apiFetch<any>('/auth/quick-unlock/status', {}, authUser.token)
      .then((statusRes) => {
        setQuickUnlockStatus(statusRes);
        if (statusRes?.mode === 'Pin' || statusRes?.mode === 'Pattern') {
          setQuickUnlockMode(statusRes.mode);
        }
      })
      .catch(() => {});
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setProfilePhotoUrl(canvas.toDataURL('image/jpeg', 0.84));
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !profileFullName.trim()) return;
    setProfileSaving(true);
    try {
      const updated = await apiFetch<any>(
        '/users/me',
        {
          method: 'PUT',
          body: JSON.stringify({
            fullName: profileFullName.trim(),
            phoneNumber: profilePhone.trim(),
            preferredLanguage: profileLanguage || 'en',
            profilePhotoUrl: profilePhotoUrl,
            currentPassword: profileNewPassword.trim() ? profileCurrentPassword : null,
            newPassword: profileNewPassword.trim() ? profileNewPassword.trim() : null
          })
        },
        authUser.token
      );
      setAuthUser(updated);
      setProfileModalOpen(false);
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      if (profileLanguage && profileLanguage !== briefingLang) {
        await handleLanguageBriefingChange(profileLanguage);
      }
      await loadAllData(updated.token, profileLanguage || briefingLang, updated.role);
      notify('success', `Profile updated for ${updated.fullName}.`);
    } catch (err: any) {
      notify('error', err.message || 'Could not update your profile settings.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEnableQuickUnlock = async () => {
    if (!authUser) return;
    const secret = quickUnlockMode === 'Pattern' ? quickUnlockPattern.trim() : quickUnlockPin.trim();
    if (!quickUnlockCurrentPassword.trim()) {
      notify('error', 'Please enter your current password to authorise Trusted-Device Quick Unlock.');
      return;
    }
    if (quickUnlockMode === 'Pin' && !/^\d{6}$/.test(secret)) {
      notify('error', 'Quick Unlock PIN must be exactly 6 digits.');
      return;
    }
    if (quickUnlockMode === 'Pattern' && secret.split('-').filter(Boolean).length < 4) {
      notify('error', 'Draw a pattern connecting at least 4 dots.');
      return;
    }

    setQuickUnlockBusy(true);
    try {
      let biometricCredId: string | null = null;
      if (quickUnlockUseBiometrics) {
        biometricCredId = await enrollDeviceBiometric(authUser.email, authUser.fullName);
      }

      const setupRes = await apiFetch<any>(
        '/auth/quick-unlock/setup',
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: quickUnlockCurrentPassword,
            mode: quickUnlockMode,
            secret,
            biometricCredentialId: biometricCredId,
            deviceName: detectCurrentDeviceName(),
            originHost: typeof window !== 'undefined' ? window.location.host : 'localhost'
          })
        },
        authUser.token
      );

      saveTrustedDeviceUnlock({
        userId: setupRes.userId,
        fullName: setupRes.fullName,
        email: setupRes.email,
        role: setupRes.role,
        mode: setupRes.mode,
        hasBiometricCredential: Boolean(setupRes.hasBiometricCredential),
        credentialId: biometricCredId || undefined,
        deviceId: setupRes.deviceId,
        deviceName: setupRes.deviceName,
        deviceToken: setupRes.deviceToken,
        savedAtIso: new Date().toISOString()
      });

      setCurrentDeviceBound(true);
      const refreshedStatus = await apiFetch<any>('/auth/quick-unlock/status', {}, authUser.token).catch(() => null);
      if (refreshedStatus) {
        setQuickUnlockStatus(refreshedStatus);
      } else {
        setQuickUnlockStatus({
          quickUnlockEnabled: true,
          mode: setupRes.mode,
          hasBiometricCredential: Boolean(setupRes.hasBiometricCredential),
          failedAttempts: 0
        });
      }
      setQuickUnlockPin('');
      setQuickUnlockPattern('');
      setQuickUnlockCurrentPassword('');
      notify(
        'success',
        `Trusted-Device Quick Unlock (${setupRes.mode}${setupRes.hasBiometricCredential ? ' + Biometrics' : ''}) bound to ${setupRes.deviceName || 'this browser'}!`
      );
    } catch (err: any) {
      notify('error', err.message || 'Could not enable Quick Unlock on this device.');
    } finally {
      setQuickUnlockBusy(false);
    }
  };

  const handleRemoveTrustedDevice = async (deviceId: string) => {
    if (!authUser) return;
    setQuickUnlockBusy(true);
    try {
      await apiFetch(`/auth/quick-unlock/devices/${deviceId}`, { method: 'DELETE' }, authUser.token);
      const localRecord = loadTrustedDeviceUnlock();
      if (localRecord && localRecord.deviceId === deviceId) {
        clearTrustedDeviceUnlock();
        setCurrentDeviceBound(false);
      }
      const refreshedStatus = await apiFetch<any>('/auth/quick-unlock/status', {}, authUser.token).catch(() => null);
      if (refreshedStatus) {
        setQuickUnlockStatus(refreshedStatus);
      }
      notify('info', 'Removed selected trusted device.');
    } catch (err: any) {
      notify('error', err.message || 'Could not remove trusted device.');
    } finally {
      setQuickUnlockBusy(false);
    }
  };

  const handleRevokeQuickUnlock = async () => {
    if (!authUser) return;
    setQuickUnlockBusy(true);
    try {
      await apiFetch('/auth/quick-unlock', { method: 'DELETE' }, authUser.token);
      const localRecord = loadTrustedDeviceUnlock();
      if (localRecord && localRecord.userId === authUser.id) {
        clearTrustedDeviceUnlock();
        setCurrentDeviceBound(false);
      }
      setQuickUnlockStatus({
        quickUnlockEnabled: false,
        mode: '',
        hasBiometricCredential: false,
        failedAttempts: 0,
        trustedDevices: []
      });
      notify('info', 'Trusted-Device Quick Unlock disabled across all devices.');
    } catch (err: any) {
      notify('error', err.message || 'Could not disable Quick Unlock.');
    } finally {
      setQuickUnlockBusy(false);
    }
  };

  const handleLogout = () => {
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
    setStatusBanner(null);
    setProfileModalOpen(false);
    setMobileNavDrawerOpen(false);
  };

  const handleLanguageBriefingChange = async (lang: string) => {
    setBriefingLang(lang);
    const targetCrisisId = crises[0]?.id;
    if (!targetCrisisId) {
      setBriefing(null);
      return;
    }
    try {
      const briefRes = await apiFetch<any>(
        `/ai-governance/multilingual-briefing/${targetCrisisId}?lang=${lang}`,
        {},
        authUser?.token
      );
      setBriefing(briefRes);
    } catch {
      setBriefing(null);
    }
  };

  const handleUploadEvidence = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiFetch<any>('/requests/upload-evidence', { method: 'POST', body: formData }, authUser?.token);
      notify('success', `Document '${res.originalFileName}' attached successfully.`);
      return res.safeFileName;
    } catch (err: any) {
      notify('error', err.message);
      return null;
    }
  };

  const handleSubmitCitizenRequest = async (payload: any): Promise<boolean> => {
    const targetCrisisId = payload.crisisEventId || crises[0]?.id;
    if (!targetCrisisId) {
      notify(
        'error',
        'No active crisis event declared yet. An Emergency Coordinator or System Admin must declare an active crisis first.'
      );
      return false;
    }
    try {
      const created = await apiFetch<any>(
        '/requests',
        {
          method: 'POST',
          body: JSON.stringify({ ...payload, crisisEventId: targetCrisisId })
        },
        authUser?.token
      );
      notify(
        'success',
        `Help request ${created.referenceCode} submitted! Priority Score: ${created.priorityScore}/100`
      );
      await loadAllData();
      return true;
    } catch (err: any) {
      notify('error', err.message);
      return false;
    }
  };

  const handleSaveHousehold = async (payload: any) => {
    try {
      const saved = await apiFetch<any>(
        '/users/households',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        authUser?.token
      );
      setHousehold(saved);
      notify('success', 'Your family profile has been saved.');
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleSubmitCitizenFeedback = async (payload: {
    assistanceRequestId: string;
    rating: number;
    comments: string;
    wasAidTimely: boolean;
    wasQuantitySufficient: boolean;
  }) => {
    try {
      await apiFetch<any>(
        '/requests/feedback',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        authUser?.token
      );
      notify('success', 'Thank you! Your delivery feedback and star rating have been saved.');
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleUpdateRequestStatus = async (
    id: string,
    newStatus: string,
    note: string,
    assignedOrganisationId?: string | null
  ) => {
    try {
      await apiFetch<any>(
        `/requests/${id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({
            newStatus,
            assignedOrganisationId: assignedOrganisationId || null,
            actionNote: note
          })
        },
        authUser?.token
      );
      notify('success', `Request status updated to '${newStatus}'.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleCreateOperationalArea = async (crisisId: string, payload: any) =>
    runAdminMutation(`/crises/${crisisId}/operational-areas`, 'POST', payload, `Operational area '${payload.zoneName}' added.`);

  const handleReplenishResource = async (id: string, addedQuantity: number, sourceNote?: string) =>
    runAdminMutation(`/logistics/resources/${id}/replenish`, 'POST', { addedQuantity, sourceNote }, `Added +${addedQuantity} units to warehouse stock.`);

  const handleMarkDispatchDelivered = async (id: string) =>
    runAdminMutation(`/logistics/dispatches/${id}/deliver`, 'POST', null, 'Supply convoy marked as Delivered.');

  const handleCreatePartnerAidRequest = async (payload: any) =>
    runAdminMutation('/logistics/partner-aid-requests', 'POST', payload, `Mutual aid request posted for '${payload.resourceName}'.`);

  const handleFulfillPartnerAidRequest = async (id: string, fulfillmentNotes?: string) =>
    runAdminMutation(`/logistics/partner-aid-requests/${id}/fulfill`, 'POST', { fulfillmentNotes }, 'Partner aid request marked as Fulfilled.');

  const handleRequestShelterSupplies = async (shelterId: string, payload: any) =>
    runAdminMutation(`/shelters/${shelterId}/request-supplies`, 'POST', payload, `Supply escalation submitted for '${payload.resourceName}'.`);

  const handleUpdateMyAvailability = async (payload: { isAvailable: boolean; availabilitySchedule: string }) =>
    runAdminMutation('/volunteers/me/availability', 'PUT', payload, 'Updated your volunteer availability and shift schedule.');

  const handleRespondAssignment = async (assignmentId: string, decision: string, notes?: string) =>
    runAdminMutation(`/volunteers/assignments/${assignmentId}/respond`, 'POST', { decision, notes }, `Mission response recorded: ${decision}.`);

  const handleCompleteAssignment = async (assignmentId: string, completionNotes: string) =>
    runAdminMutation(`/volunteers/assignments/${assignmentId}/complete`, 'POST', { completionNotes }, 'Volunteer task completed and logged.');

  const handleRecordExpenditure = async (campaignId: string, payload: { amountUsd: number; category: string; description: string }) =>
    runAdminMutation(`/donations/campaigns/${campaignId}/expenditures`, 'POST', payload, `Recorded $${payload.amountUsd.toLocaleString()} USD expenditure (${payload.category}).`);

  const handleRejectFlaggedDonation = async (id: string) =>
    runAdminMutation(`/donations/${id}/reject`, 'POST', null, 'Flagged contribution rejected by compliance.');

  const handleRetryFailedNotifications = async () => {
    try {
      const res = await apiFetch<any>('/notifications/retry-failed', { method: 'POST' }, authUser?.token);
      notify('success', `Notification retry sweep finished. Recovered ${res.recoveredCount} queued alerts.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Retry failed.');
    }
  };

  const handleGovernanceReviewSubmit = async (payload: any) => {
    try {
      await apiFetch<any>('/ai-governance/review', { method: 'POST', body: JSON.stringify(payload) }, authUser?.token);
      notify('success', `Staff review decision (${payload.decisionStatus}) saved.`);
      setSelectedRecommendation(null);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleMergeDuplicate = async (duplicateReq: any) => {
    if (!duplicateReq.potentialDuplicateOfRequestId) return;
    try {
      await apiFetch<any>(
        '/requests/merge-duplicate',
        {
          method: 'POST',
          body: JSON.stringify({
            primaryRequestId: duplicateReq.potentialDuplicateOfRequestId,
            duplicateRequestId: duplicateReq.id,
            mergeJustification: `Merged duplicate request (${Math.round(duplicateReq.duplicateSimilarityScore * 100)}% match) into primary request.`
          })
        },
        authUser?.token
      );
      notify('success', `Duplicate request ${duplicateReq.referenceCode} merged into primary case.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleSimulateOrExecuteAllocation = async (commitToDatabase: boolean) => {
    try {
      const endpoint = commitToDatabase ? '/logistics/execute-allocation' : '/logistics/simulate-allocation';
      const result = await apiFetch<any>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify({
            resourceItemId: resources[0]?.id || '55555555-5555-5555-5555-555555555501',
            competingRequestIds: selectedCompetingIds,
            strategyName: selectedStrategy
          })
        },
        authUser?.token
      );
      setAllocationPlanResult(result);
      notify(
        'success',
        commitToDatabase
          ? `Supplies allocated and dispatched from warehouse (${result.strategyUsed}).`
          : `Delivery preview generated (${result.strategyUsed}). Review the plan below.`
      );
      if (commitToDatabase) {
        await loadAllData();
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleAddResource = async (payload: any) => {
    try {
      await apiFetch<any>(
        '/logistics/resources',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        authUser?.token
      );
      notify('success', `Added '${payload.name}' to warehouse inventory.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleCreateShelter = async (payload: any) => {
    try {
      await apiFetch<any>(
        '/shelters',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        authUser?.token
      );
      notify('success', `Registered shelter '${payload.name}'.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleCreateCrisisEvent = async (payload: {
    title: string;
    crisisType: string;
    severity: string;
    country: string;
    region: string;
    description: string;
    centerLatitude: number;
    centerLongitude: number;
    radiusKm: number;
  }) => {
    try {
      await apiFetch<any>(
        '/crises',
        {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            isActive: true,
            operationalAreas: []
          })
        },
        authUser?.token
      );
      notify('success', `Crisis event '${payload.title}' declared and activated.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleCreatePublicAlert = async (payload: {
    crisisEventId: string;
    title: string;
    message: string;
    severityLevel: string;
    safetyGuidance: string;
  }) => {
    try {
      await apiFetch<any>(
        '/crises/alerts',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        authUser?.token
      );
      notify('success', `Public alert '${payload.title}' broadcast to all active channels.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleRecommendShelters = async (requestId: string): Promise<any[]> => {
    try {
      const candidates = await apiFetch<any[]>(
        `/shelters/recommendations/${encodeURIComponent(requestId)}`,
        {},
        authUser?.token
      );
      notify('info', `Found ${candidates.length} AI-ranked shelter recommendations.`);
      return candidates;
    } catch (err: any) {
      notify('error', err.message || 'Unable to generate shelter recommendations.');
      return [];
    }
  };

  const handleRegisterVolunteer = async (payload: {
    fullName: string;
    skillsCsv: string;
    languagesCsv: string;
    availabilitySchedule: string;
    baseTown: string;
    baseLatitude?: number;
    baseLongitude?: number;
  }) => {
    try {
      const created = await apiFetch<any>(
        '/volunteers',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName: payload.fullName.trim(),
            skillsCsv: payload.skillsCsv.trim(),
            languagesCsv: payload.languagesCsv.trim() || 'English',
            availabilitySchedule: payload.availabilitySchedule.trim() || 'Available On-Call',
            currentLatitude: Number(payload.baseLatitude) || 6.9271,
            currentLongitude: Number(payload.baseLongitude) || 79.8612
          })
        },
        authUser?.token
      );
      notify('success', `Volunteer '${created.fullName}' registered in database field roster.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Unable to register volunteer.');
    }
  };

  const handleCreateCampaign = async (payload: {
    title: string;
    crisisEventId?: string;
    targetAmountUsd: number;
  }) => {
    try {
      const created = await apiFetch<any>(
        '/donations/campaigns',
        {
          method: 'POST',
          body: JSON.stringify({
            title: payload.title.trim(),
            crisisEventId: payload.crisisEventId || crises[0]?.id || null,
            targetAmountUsd: Number(payload.targetAmountUsd) || 50000
          })
        },
        authUser?.token
      );
      notify('success', `Fundraising campaign '${created.title}' created.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Unable to create fundraising campaign.');
    }
  };

  const runAdminMutation = async (url: string, method: 'POST' | 'PUT' | 'DELETE', body: any, successMsg: string) => {
    try {
      await apiFetch<any>(
        url,
        body !== null ? { method, body: JSON.stringify(body) } : { method },
        authUser?.token
      );
      notify('success', successMsg);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Administrator action failed.');
    }
  };

  const handleAdminCreateUser = async (payload: any) => {
    try {
      const created = await apiFetch<any>(
        '/admin/users',
        { method: 'POST', body: JSON.stringify(payload) },
        authUser?.token
      );
      notify('success', `Created ${created.role} account for '${created.fullName}' (${created.email}).`);
      await loadAllData();
      return created;
    } catch (err: any) {
      notify('error', err.message || 'Unable to create account.');
      throw err;
    }
  };

  const handleRegisterCitizenOnBehalf = async (payload: any) => {
    try {
      const created = await apiFetch<any>(
        '/users/register-citizen-behalf',
        { method: 'POST', body: JSON.stringify(payload) },
        authUser?.token
      );
      notify('success', `Registered Citizen '${created.fullName}' (${created.email}) on their behalf.`);
      await loadAllData();
      return created;
    } catch (err: any) {
      notify('error', err.message || 'Unable to register citizen on their behalf.');
      throw err;
    }
  };

  const handleInviteStaff = async (payload: any) => {
    try {
      const created = await apiFetch<any>(
        '/invitations/invite-staff',
        { method: 'POST', body: JSON.stringify(payload) },
        authUser?.token
      );
      notify('success', `Invited '${created.fullName}' as ${created.role} (${created.invitationCode}).`);
      await loadAllData();
      return created;
    } catch (err: any) {
      notify('error', err.message || 'Unable to invite staff role.');
      throw err;
    }
  };

  const handleVerifyActivateVolunteer = async (volunteerId: string, fullName: string) => {
    try {
      await apiFetch<any>(`/volunteers/${volunteerId}/verify-activate`, { method: 'POST' }, authUser?.token);
      notify('success', `Verified and activated volunteer account for '${fullName}'.`);
      await loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Unable to verify volunteer.');
    }
  };

  const handleApprovePartnership = (orgId: string, orgName: string) =>
    runAdminMutation(`/admin/partnerships/${orgId}/approve`, 'POST', null, `Approved partnership for '${orgName}'.`);

  const handleRejectPartnership = (orgId: string, orgName: string) =>
    runAdminMutation(`/admin/partnerships/${orgId}/reject`, 'POST', null, `Updated partnership status to Rejected for '${orgName}'.`);

  const handleAddRolePermission = (payload: any) =>
    runAdminMutation('/admin/role-permissions', 'POST', payload, `Added permission '${payload.permissionCode}' to ${payload.role}.`);

  const handleDeleteRolePermission = (id: string) =>
    runAdminMutation(`/admin/role-permissions/${id}`, 'DELETE', null, 'Removed role permission.');

  const handleUpdateSystemConfig = (payload: any) =>
    runAdminMutation('/admin/system-config', 'PUT', payload, 'Updated core system governance configuration.');

  const handleUpdateServiceSettings = (payload: any) =>
    runAdminMutation('/admin/service-settings', 'PUT', payload, 'Updated AI, SMS, Email & Mapping service settings.');

  const handleAdminUpdateUser = (id: string, payload: any) =>
    runAdminMutation(`/admin/users/${id}`, 'PUT', payload, `Updated user '${payload.fullName}'.`);

  const handleAdminDeleteUser = (id: string, label: string) =>
    runAdminMutation(`/admin/users/${id}`, 'DELETE', null, `Removed user '${label}'.`);

  const handleAdminUpdateCrisis = (id: string, payload: any) =>
    runAdminMutation(`/crises/${id}`, 'PUT', payload, `Updated crisis '${payload.title}'.`);

  const handleAdminDeleteCrisis = (id: string, label: string) =>
    runAdminMutation(`/crises/${id}`, 'DELETE', null, `Removed crisis '${label}'.`);

  const handleAdminUpdateShelter = (id: string, payload: any) =>
    runAdminMutation(`/shelters/${id}`, 'PUT', payload, `Updated shelter '${payload.name}'.`);

  const handleAdminDeleteShelter = (id: string, label: string) =>
    runAdminMutation(`/shelters/${id}`, 'DELETE', null, `Removed shelter '${label}'.`);

  const handleAdminUpdateResource = (id: string, payload: any) =>
    runAdminMutation(`/logistics/resources/${id}`, 'PUT', payload, `Updated stock item '${payload.name}'.`);

  const handleAdminDeleteResource = (id: string, label: string) =>
    runAdminMutation(`/logistics/resources/${id}`, 'DELETE', null, `Removed stock item '${label}'.`);

  const handleAdminDeleteRequest = (id: string, label: string) =>
    runAdminMutation(`/requests/${id}`, 'DELETE', null, `Removed request '${label}'.`);

  const handleAdminDeleteVolunteer = (id: string, label: string) =>
    runAdminMutation(`/volunteers/${id}`, 'DELETE', null, `Removed volunteer '${label}'.`);

  const handleAdminDeleteCampaign = (id: string, label: string) =>
    runAdminMutation(`/donations/campaigns/${id}`, 'DELETE', null, `Removed campaign '${label}'.`);

  const currentLang = (briefingLang as SupportedLanguage) || 'en';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const getLocalizedTabLabel = (id: TabKey, fallback: string): string => {
    switch (id) {
      case 'dashboard':
        return t.nav.dashboard;
      case 'citizen':
        return t.nav.citizen;
      case 'ai-governance':
        return t.nav.aiGovernance;
      case 'logistics':
        return t.nav.logistics;
      case 'shelters':
        return t.nav.shelters;
      case 'volunteers':
        return t.nav.volunteers;
      case 'donations':
        return t.nav.donations;
      case 'map-resilience':
        return t.nav.mapResilience;
      default:
        return fallback;
    }
  };

  const allOperationalAreas = crises.flatMap((c: any) => c.operationalAreas || []);
  const menuItems = authUser ? getRoleMenuItems(authUser.role) : [];
  const activeMenuItem = menuItems.find((m) => m.id === activeTab) || menuItems[0];
  const activeLanguageOption = LANGUAGE_OPTIONS.find((l) => l.code === briefingLang) || LANGUAGE_OPTIONS[0];
  const mobileBottomTabs = menuItems.slice(0, 4);

  return (
    <>
      <AnimatePresence mode="wait">
        {showBrandIntro && (
          <CriSyncBrandIntroOverlay
            key={`intro-${introRunId}`}
            phase={introPhase}
            theme={theme}
            onSkip={() => setShowBrandIntro(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loginTransitionUser && (
          <CrisyncLaunchOverlay
            user={loginTransitionUser}
            stageIndex={loginStageIndex}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {!authUser ? (
        <LoginPage
          organisations={organisations}
          activeCrisisTitle={crises[0]?.title}
          onLogin={handleLogin}
          onQuickUnlockSuccess={handleQuickUnlockSession}
          onRegister={handleRegister}
          onReplayIntro={triggerBrandIntro}
          errorMessage={loginError}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <div className="min-h-[100dvh] w-full bg-[#07090e] text-zinc-100 flex flex-col relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-indigo-600 focus:text-white focus:font-bold"
      >
        Skip to main content
      </a>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.14, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute -top-28 -left-24 w-[480px] h-[480px] rounded-full blur-3xl ${theme === 'light' ? 'bg-indigo-400/25' : 'bg-indigo-600/15'
          }`}
        />
        <motion.div
          animate={{ scale: [1.08, 0.94, 1.08], x: [0, -35, 0], y: [0, 28, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute -bottom-32 right-[-90px] w-[520px] h-[520px] rounded-full blur-3xl ${theme === 'light' ? 'bg-cyan-400/25' : 'bg-cyan-500/12'
          }`}
        />
        <motion.div
          animate={{ scale: [0.95, 1.12, 0.95], x: [0, 22, 0], y: [0, 22, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute top-1/2 left-1/3 w-[380px] h-[380px] rounded-full blur-3xl ${theme === 'light' ? 'bg-rose-300/20' : 'bg-rose-500/8'
          }`}
        />
      </div>
      <GlobalEarthBackdrop theme={theme} variant="workspace" />

      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#07090e]/85 border-b border-white/[0.08]">
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavDrawerOpen(true)}
              className="xl:hidden w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-200 flex items-center justify-center transition shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={triggerBrandIntro}
              title="Replay Crisis + Sync → CriSync Intro Animation"
              className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 text-left group"
            >
              <img
                src="/crisync-logo.png"
                alt="CriSync Logo"
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover crisync-logo-frame shrink-0"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="crisync-wordmark text-xl sm:text-2xl lg:text-[26px]">
                    <span className="crisync-wordmark-primary">Cri</span>
                    <span className="crisync-wordmark-accent">Sync</span>
                  </span>
                  <span
                        className={`hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${crises.length > 0
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <span
                          className={`w-1.5 h-1.5 rounded-full animate-ping ${crises.length > 0 ? 'bg-rose-400' : 'bg-emerald-400'
                      }`}
                    />
                    {crises[0]?.title || 'No Active Crisis Declared'}
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] font-medium text-zinc-400 truncate max-w-[160px] sm:max-w-[260px] mt-0.5">
                  {authUser.organisationName}
                </p>
              </div>
            </button>
          </div>

          <nav className="hidden md:flex order-3 xl:order-2 w-full xl:w-auto mobile-tabs-scroll items-center gap-1.5 overflow-x-auto py-1 px-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                      className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${isActive
                      ? 'text-white keep-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="floatingNavDock"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-indigo-600 shadow-sm z-0"
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'keep-white' : ''}`}>
                    {getModuleIcon(item.id, 'w-3.5 h-3.5')}
                    <span>{getLocalizedTabLabel(item.id, item.label)}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="order-2 xl:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              title="Quick Search & Command Palette (Ctrl+K)"
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-zinc-300">
                Ctrl K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setLanguageMenuOpen(true)}
              title="Change Language"
              className="lg:hidden px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="sm:hidden">{activeLanguageOption.code.toUpperCase()}</span>
              <span className="hidden sm:inline">{activeLanguageOption.label}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">{t.lightMode}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">{t.darkMode}</span>
                </>
              )}
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={openProfileModal}
              title="Edit Your Profile, Photo & Password"
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-400/50 flex items-center gap-2 text-left transition cursor-pointer"
            >
              {authUser.profilePhotoUrl ? (
                <img
                  src={authUser.profilePhotoUrl}
                  alt={authUser.fullName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-indigo-400/40 shrink-0"
                />
              ) : (
                <div className="keep-white w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                  {authUser.fullName?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block max-w-[155px]">
                <p className="text-xs font-bold text-white leading-tight truncate flex items-center gap-1">
                  <span className="truncate">{authUser.fullName}</span>
                  <Pencil className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                </p>
                <p className="text-[10px] text-indigo-300 leading-tight truncate">
                  {getFriendlyRoleTitle(authUser.role)}
                </p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => loadAllData()}
              title="Refresh Data"
              className="hidden sm:inline-flex p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleLogout}
              title="Sign Out to switch accounts with password"
              className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.signOut}</span>
            </motion.button>
          </div>
        </div>

        <div className="bg-white/[0.02] border-t border-white/[0.05]">
          <div className="md:hidden max-w-[1480px] mx-auto px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                {getModuleIcon(activeMenuItem.id, 'w-3.5 h-3.5')}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">
                  {getLocalizedTabLabel(activeMenuItem.id, activeMenuItem.label)}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {getFriendlyRoleTitle(authUser.role)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>{t.signOut}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileNavDrawerOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-200 text-[11px] font-bold flex items-center gap-1"
              >
                <Menu className="w-3 h-3" />
                <span>Menu</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex max-w-[1480px] mx-auto px-6 py-2 flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] shrink-0">
                <HelpCircle className="w-3 h-3" />
                {t.yourRoleLabel}: {getFriendlyRoleTitle(authUser.role)}
              </span>
              <span className="text-zinc-400 truncate text-xs">
                {getRolePermissionsSummary(authUser.role)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 border border-white/10">
                <Globe className="w-3.5 h-3.5 text-indigo-400 ml-1.5 mr-0.5" />
                {LANGUAGE_OPTIONS.map((langOpt) => (
                  <button
                    key={langOpt.code}
                    type="button"
                    onClick={() => handleLanguageBriefingChange(langOpt.code)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${briefingLang === langOpt.code
                        ? 'bg-indigo-600 text-white keep-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {langOpt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {languageMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLanguageMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-6 z-[70] w-full sm:w-[380px] max-h-[82dvh] bento-glass rounded-t-3xl sm:rounded-3xl p-5 flex flex-col border border-white/15 shadow-2xl overflow-hidden"
            >
              <div className="w-10 h-1 rounded-full bg-zinc-500/40 mx-auto mb-3 sm:hidden shrink-0" />
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-white">{t.languageLabel}</p>
                    <p className="text-xs text-zinc-400">
                      Choose your preferred interface & briefing language
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLanguageMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 overflow-y-auto sidebar-scroll pr-1 flex-1 min-h-0">
                {LANGUAGE_OPTIONS.map((langOpt) => {
                  const isActive = briefingLang === langOpt.code;
                  return (
                    <button
                      key={langOpt.code}
                      type="button"
                      onClick={() => {
                        handleLanguageBriefingChange(langOpt.code);
                        setLanguageMenuOpen(false);
                      }}
                          className={`w-full text-left px-4 py-3 rounded-2xl border flex items-center justify-between transition ${isActive
                          ? 'bg-indigo-600/20 border-2 border-indigo-500 text-white'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-zinc-300'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-extrabold text-white">{langOpt.label}</p>
                        <p className="text-xs text-zinc-400">{langOpt.fullName}</p>
                      </div>
                      {isActive && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileNavDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[70] xl:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 left-0 z-[70] w-[88vw] max-w-[360px] h-[100dvh] bento-glass flex flex-col overflow-hidden xl:hidden border-r border-white/15"
            >
              <div className="shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/crisync-logo.png"
                    alt="CriSync Logo"
                    className="w-11 h-11 rounded-2xl object-cover crisync-logo-frame shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="crisync-wordmark text-xl">
                      <span className="crisync-wordmark-primary">Cri</span>
                      <span className="crisync-wordmark-accent">Sync</span>
                    </p>
                    <p className="text-xs font-semibold text-indigo-300 truncate mt-0.5">
                      {getFriendlyRoleTitle(authUser.role)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavDrawerOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center shrink-0"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll p-4 space-y-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5 px-1">
                    Your Navigation Menu ({menuItems.length})
                  </p>
                  <div className="space-y-2">
                    {menuItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileNavDrawerOpen(false);
                          }}
                              className={`w-full text-left p-3.5 rounded-2xl border flex items-center gap-3 transition ${isActive
                              ? 'bg-indigo-600 text-white border-indigo-400 keep-white shadow-md'
                              : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.07]'
                          }`}
                        >
                          <span
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-700/60 text-white keep-white' : 'bg-black/25'
                            }`}
                          >
                            {getModuleIcon(item.id, 'w-4 h-4')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold truncate">
                              {getLocalizedTabLabel(item.id, item.label)}
                            </p>
                            <p className="text-[11px] opacity-80 truncate mt-0.5">{item.subtext}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5 px-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.languageLabel}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map((langOpt) => (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => handleLanguageBriefingChange(langOpt.code)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition truncate ${briefingLang === langOpt.code
                            ? 'bg-indigo-600 border-indigo-400 text-white keep-white shadow-sm'
                            : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.07]'
                        }`}
                      >
                        {langOpt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-4 border-t border-white/10 space-y-2.5">
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="w-full p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-between gap-2.5 text-left transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {authUser.profilePhotoUrl ? (
                      <img
                        src={authUser.profilePhotoUrl}
                        alt={authUser.fullName}
                        className="w-8 h-8 rounded-lg object-cover border border-indigo-400/40 shrink-0"
                      />
                    ) : (
                      <div className="keep-white w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                        {authUser.fullName?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">{authUser.fullName}</p>
                      <p className="text-[10px] text-indigo-300 truncate">Tap to edit profile, photo & password</p>
                    </div>
                  </div>
                  <Pencil className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="py-2.5 px-2 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadAllData();
                      setMobileNavDrawerOpen(false);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2.5 px-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.signOut}</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[80]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="My Profile and Account Settings"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="fixed inset-x-3 top-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-10 z-[85] sm:w-full sm:max-w-lg max-h-[88dvh] bento-glass rounded-3xl p-5 sm:p-6 flex flex-col border border-indigo-500/30 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/35 text-indigo-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">My Profile & Account Settings</h2>
                    <p className="text-[11px] text-zinc-400">
                      {authUser.email} • {getFriendlyRoleTitle(authUser.role)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close Profile Modal"
                  onClick={() => setProfileModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                key="my-profile-settings-form"
                onSubmit={handleSaveProfile}
                className="flex-1 min-h-0 overflow-y-auto sidebar-scroll pr-1 space-y-4 text-xs"
              >
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    {profilePhotoUrl ? (
                      <img
                        src={profilePhotoUrl}
                        alt={profileFullName || authUser.fullName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="keep-white w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-xl font-black text-white shadow-md shrink-0">
                        {(profileFullName || authUser.fullName || 'CS').slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-[180px] space-y-2">
                      <p className="font-bold text-zinc-200">Profile Picture & Avatar</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor="profile-photo-upload-input"
                          className="keep-white cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                        </label>
                        <input
                          id="profile-photo-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                        {profilePhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setProfilePhotoUrl('')}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold transition"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Upload any photo or pick a built-in gradient avatar badge below:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {AVATAR_COLOR_PRESETS.map(([fromCol, toCol], idx) => (
                      <button
                        key={`${fromCol}-${toCol}`}
                        type="button"
                        title={`Use Avatar Style ${idx + 1}`}
                        onClick={() =>
                          setProfilePhotoUrl(buildAvatarPresetDataUrl(profileFullName || authUser.fullName, fromCol, toCol))
                        }
                        style={{ background: `linear-gradient(135deg, ${fromCol}, ${toCol})` }}
                        className="keep-white w-8 h-8 rounded-xl text-[11px] font-black text-white flex items-center justify-center border border-white/25 hover:scale-110 transition shadow-sm"
                      >
                        {(profileFullName || authUser.fullName || 'CS').slice(0, 2).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="crisync_profile_fullname"
                    autoComplete="off"
                    required
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="rsvp-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="text"
                      name="crisync_profile_phone"
                      autoComplete="off"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Preferred Language</span>
                    </label>
                    <select
                      value={profileLanguage}
                      onChange={(e) => setProfileLanguage(e.target.value)}
                      className="rsvp-input"
                    >
                      {LANGUAGE_OPTIONS.map((langOpt) => (
                        <option key={langOpt.code} value={langOpt.code}>
                          {langOpt.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/25 space-y-3">
                  <p className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Change Account Password (Optional)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">Current Password</label>
                      <input
                        type="password"
                        name="crisync_profile_current_password"
                        autoComplete="new-password"
                        readOnly={!profileUnlocked.currentPassword}
                        onFocus={() => setProfileUnlocked((p) => ({ ...p, currentPassword: true }))}
                        onMouseDown={() => setProfileUnlocked((p) => ({ ...p, currentPassword: true }))}
                        onKeyDown={() => setProfileUnlocked((p) => ({ ...p, currentPassword: true }))}
                        value={profileCurrentPassword}
                        onChange={(e) => setProfileCurrentPassword(e.target.value)}
                        placeholder="Required only if changing password"
                        className="rsvp-input"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">New Password (Min 6 chars)</label>
                      <input
                        type="password"
                        name="crisync_profile_new_password"
                        autoComplete="new-password"
                        readOnly={!profileUnlocked.newPassword}
                        onFocus={() => setProfileUnlocked((p) => ({ ...p, newPassword: true }))}
                        onMouseDown={() => setProfileUnlocked((p) => ({ ...p, newPassword: true }))}
                        onKeyDown={() => setProfileUnlocked((p) => ({ ...p, newPassword: true }))}
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        placeholder="Leave empty to keep current password"
                        className="rsvp-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4" />
                      <span>Trusted-Device Quick Unlock (Pattern / PIN / Biometrics)</span>
                    </p>
                    {quickUnlockStatus?.quickUnlockEnabled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Active ({quickUnlockStatus.mode}{quickUnlockStatus.hasBiometricCredential ? ' + Biometrics' : ''})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Bind each browser or URL (for example Laptop on localhost and Phone via ngrok HTTPS) independently to unlock with a 3×3 Pattern, 6-digit PIN, or device Fingerprint / Windows Hello.
                  </p>

                  <div
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${currentDeviceBound
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Smartphone className="w-3.5 h-3.5 shrink-0" />
                      {currentDeviceBound
                        ? `Current browser (${typeof window !== 'undefined' ? window.location.host : 'device'}) is bound.`
                        : `Current browser (${typeof window !== 'undefined' ? window.location.host : 'device'}) is not bound yet — enable below for this phone or URL!`}
                    </span>
                  </div>

                  {quickUnlockStatus?.trustedDevices && quickUnlockStatus.trustedDevices.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Active Trusted Devices ({quickUnlockStatus.trustedDevices.length})
                      </p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {quickUnlockStatus.trustedDevices.map((dev) => (
                          <div
                            key={dev.deviceId}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-100 truncate">{dev.deviceName}</p>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {dev.originHost} • {dev.hasBiometrics ? 'Pattern/PIN + Biometrics' : 'Pattern/PIN'}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={quickUnlockBusy}
                              onClick={() => void handleRemoveTrustedDevice(dev.deviceId)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition shrink-0"
                              title="Remove this device"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                    <button
                      type="button"
                      onClick={() => setQuickUnlockMode('Pattern')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition ${quickUnlockMode === 'Pattern'
                          ? 'bg-indigo-600 text-white keep-white'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      3×3 Pattern Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickUnlockMode('Pin')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition ${quickUnlockMode === 'Pin'
                          ? 'bg-indigo-600 text-white keep-white'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      6-Digit PIN
                    </button>
                  </div>

                  {quickUnlockMode === 'Pattern' ? (
                    <PatternLockPad
                      value={quickUnlockPattern}
                      onChange={setQuickUnlockPattern}
                      disabled={quickUnlockBusy}
                      label="Draw new unlock pattern (drag across 4+ dots)"
                    />
                  ) : (
                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">6-Digit Quick Unlock PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="off"
                        value={quickUnlockPin}
                        onChange={(e) => setQuickUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6 digits (e.g. 482910)"
                        className="rsvp-input tracking-widest font-mono"
                      />
                    </div>
                  )}

                  {biometricSupported && (
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer text-xs font-semibold text-zinc-200">
                      <input
                        type="checkbox"
                        checked={quickUnlockUseBiometrics}
                        onChange={(e) => setQuickUnlockUseBiometrics(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 text-indigo-500"
                      />
                      <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Also enroll Fingerprint / Face / Windows Hello on this device</span>
                    </label>
                  )}

                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Confirm Account Password</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={quickUnlockCurrentPassword}
                      onChange={(e) => setQuickUnlockCurrentPassword(e.target.value)}
                      placeholder="Enter current password to bind this device"
                      className="rsvp-input"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={quickUnlockBusy || !quickUnlockCurrentPassword.trim()}
                      onClick={() => void handleEnableQuickUnlock()}
                      className="keep-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>{quickUnlockBusy ? 'Configuring...' : 'Enable Quick Unlock on This Device'}</span>
                    </button>
                    {quickUnlockStatus?.quickUnlockEnabled && (
                      <button
                        type="button"
                        disabled={quickUnlockBusy}
                        onClick={() => void handleRevokeQuickUnlock()}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition"
                      >
                        Revoke Quick Unlock
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 font-bold transition"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={profileSaving || !profileFullName.trim()}
                    className="keep-white px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-md disabled:opacity-50 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main id="main-content" className="relative z-10 max-w-[1480px] mx-auto w-full flex-1 px-3 sm:px-6 pt-4 pb-24 md:py-6 space-y-5">
        {(authUser.accountStatus === 'Pending' || authUser.accountStatus === 'PendingPartnershipApproval') && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs sm:text-sm text-amber-200 font-semibold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              {authUser.accountStatus === 'Pending' ? (
                <span>
                  <strong className="text-white">Account Status: Pending Volunteer Verification.</strong> A Volunteer Coordinator must verify and activate your volunteer profile before full field deployment.
                </span>
              ) : (
                <span>
                  <strong className="text-white">Partnership Request Pending Approval.</strong> Your Partner Organization request is awaiting Global System Admin or Organization Admin approval.
                </span>
              )}
            </div>
          </div>
        )}

        <CommandPaletteModal
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          menuItems={menuItems.map((m) => ({
            id: m.id,
            label: getLocalizedTabLabel(m.id, m.label),
            subtext: m.subtext
          }))}
          requests={requests}
          shelters={sheltersData.shelters || []}
          resources={resources}
          theme={theme}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onToggleTheme={toggleTheme}
          onOpenProfile={openProfileModal}
          onRefresh={() => void loadAllData()}
          onReplayIntro={triggerBrandIntro}
        />

        <AnimatePresence mode="wait">
          {statusBanner && (
            <motion.div
              key={statusBanner.text}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.22 }}
                  className={`keep-white fixed top-20 right-4 sm:right-6 z-[90] w-[calc(100%-2rem)] sm:max-w-md rounded-2xl border text-xs sm:text-sm font-semibold backdrop-blur-2xl shadow-2xl overflow-hidden ${statusBanner.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/45 text-rose-100'
                  : statusBanner.type === 'info'
                  ? 'bg-amber-950/90 border-amber-500/45 text-amber-100'
                  : 'bg-emerald-950/90 border-emerald-500/45 text-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {statusBanner.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : statusBanner.type === 'info' ? (
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="leading-snug">{statusBanner.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusBanner(null)}
                  className="text-zinc-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5.5, ease: 'linear' }}
                    className={`h-1 ${statusBanner.type === 'error'
                    ? 'bg-rose-400'
                    : statusBanner.type === 'info'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loading && requests.length === 0 && crises.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-hidden="true">
            <div className="h-32 rounded-3xl crisync-skeleton border border-white/10" />
            <div className="h-32 rounded-3xl crisync-skeleton border border-white/10" />
            <div className="h-32 rounded-3xl crisync-skeleton border border-white/10" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <DashboardTab
                userRole={authUser.role}
                metrics={metrics}
                briefing={briefing}
                briefingLang={briefingLang}
                requests={requests}
                crises={crises}
                organisations={organisations}
                feedbackAnalytics={feedbackAnalytics}
                sitRepReport={sitRepReport}
                    lastSyncedAt={lastSyncedAt}
                    onManualRefresh={() => loadAllData()}
                    isSyncing={loading}
                onChangeBriefingLanguage={handleLanguageBriefingChange}
                onMergeDuplicate={handleMergeDuplicate}
                onUpdateRequestStatus={handleUpdateRequestStatus}
                onCreatePublicAlert={handleCreatePublicAlert}
                onCreateCrisisEvent={handleCreateCrisisEvent}
                onCreateOperationalArea={handleCreateOperationalArea}
                onRegisterCitizenOnBehalf={handleRegisterCitizenOnBehalf}
                onInviteStaff={handleInviteStaff}
                onSelectForAiGovernance={(req) => {
                  setActiveTab('ai-governance');
                  if (req.aiRecommendations?.[0]) {
                    setSelectedRecommendation(req.aiRecommendations[0]);
                  }
                }}
              />
            )}

            {activeTab === 'citizen' && (
              <CitizenPortalTab
                alerts={alerts}
                crises={crises}
                shelters={sheltersData.shelters || []}
                requests={requests}
                notifications={myNotifications}
                household={household}
                currentUserId={authUser.userId}
                briefing={briefing}
                activeLanguage={briefingLang as SupportedLanguage}
                onChangeLanguage={handleLanguageBriefingChange}
                onUploadEvidence={handleUploadEvidence}
                onSubmitRequest={handleSubmitCitizenRequest}
                onSaveHousehold={handleSaveHousehold}
                onSubmitFeedback={handleSubmitCitizenFeedback}
              />
            )}

            {activeTab === 'ai-governance' && (
              <AiGovernanceTab
                userRole={authUser.role}
                recommendations={recommendations}
                demandForecast={demandForecast}
                selectedRecommendation={selectedRecommendation}
                onSelectRecommendation={setSelectedRecommendation}
                onSubmitGovernanceReview={handleGovernanceReviewSubmit}
              />
            )}

            {activeTab === 'logistics' && (
              <LogisticsTab
                userRole={authUser.role}
                requests={requests}
                resources={resources}
                dispatches={logisticsAllocationsData.dispatches || []}
                partnerAidRequests={logisticsAllocationsData.partnerAidRequests || []}
                organisations={organisations}
                selectedStrategy={selectedStrategy}
                selectedCompetingIds={selectedCompetingIds}
                allocationPlanResult={allocationPlanResult}
                onChangeStrategy={setSelectedStrategy}
                onToggleCompetingRequest={(id) =>
                  setSelectedCompetingIds((prev) =>
                    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                  )
                }
                onRunAllocation={handleSimulateOrExecuteAllocation}
                onAddResource={handleAddResource}
                onReplenishResource={handleReplenishResource}
                onMarkDispatchDelivered={handleMarkDispatchDelivered}
                onCreatePartnerAidRequest={handleCreatePartnerAidRequest}
                onFulfillPartnerAidRequest={handleFulfillPartnerAidRequest}
              />
            )}

            {activeTab === 'shelters' && (
              <SheltersTab
                userRole={authUser.role}
                shelters={sheltersData.shelters || []}
                allocations={sheltersData.allocations || []}
                requests={requests}
                onRecommendShelters={handleRecommendShelters}
                onCreateShelter={handleCreateShelter}
                onRequestShelterSupplies={handleRequestShelterSupplies}
                onCheckoutShelterAllocation={async (allocationId, householdName) => {
                  try {
                    await apiFetch<any>(
                      `/shelters/allocations/${allocationId}/checkout`,
                      {
                        method: 'POST',
                        body: JSON.stringify({ dischargeNotes: `Discharged ${householdName}` })
                      },
                      authUser?.token
                    );
                    notify('success', `Checked out '${householdName}' and released shelter capacity.`);
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
                onAllocateShelter={async (payload) => {
                  try {
                    await apiFetch<any>(
                      '/shelters/allocate',
                      {
                        method: 'POST',
                        body: JSON.stringify({
                          shelterId: payload.shelterId,
                          householdName: payload.householdName,
                          membersCount: payload.membersCount,
                          requiresAccessibility: payload.requiresAccessibility,
                          assistanceRequestId: payload.assistanceRequestId || null,
                              citizenUserId: payload.citizenUserId || (authUser?.role === 'Citizen' ? authUser.userId : null)
                        })
                      },
                      authUser?.token
                    );
                    notify('success', `Checked in ${payload.membersCount} family members to shelter.`);
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
              />
            )}

            {activeTab === 'volunteers' && (
              <VolunteersTab
                userRole={authUser.role}
                currentUserId={authUser.userId}
                volunteers={volunteersData.volunteers || []}
                assignments={volunteersData.assignments || []}
                    requests={requests}
                volunteerMatches={volunteerMatches}
                onRegisterVolunteer={handleRegisterVolunteer}
                onVerifyActivateVolunteer={handleVerifyActivateVolunteer}
                onUpdateMyAvailability={handleUpdateMyAvailability}
                onRespondAssignment={handleRespondAssignment}
                onCompleteAssignment={handleCompleteAssignment}
                onMatchVolunteers={async (skill) => {
                  try {
                    const matchLat = crises[0]?.centerLatitude ?? 6.9271;
                    const matchLon = crises[0]?.centerLongitude ?? 79.8612;
                    const backendMatches = await apiFetch<any[]>(
                      `/volunteers/match?skill=${encodeURIComponent(skill)}&lat=${matchLat}&lon=${matchLon}`,
                      {},
                      authUser?.token
                    );
                    setVolunteerMatches(backendMatches);
                    notify('info', `Found ${backendMatches.length} volunteers matching '${skill}'.`);
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
                    onAssignVolunteer={async (volunteerProfileId, taskTitle, requiredSkill, assistanceRequestId) => {
                  try {
                    await apiFetch<any>(
                      '/volunteers/assign',
                      {
                        method: 'POST',
                        body: JSON.stringify({
                          volunteerProfileId,
                              assistanceRequestId: assistanceRequestId || null,
                          taskTitle,
                          requiredSkill
                        })
                      },
                      authUser?.token
                    );
                    notify('success', 'Volunteer assigned to field task.');
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
              />
            )}

            {activeTab === 'donations' && (
              <DonationsTab
                userRole={authUser.role}
                crises={crises}
                campaigns={donationsData.campaigns || []}
                donations={donationsData.donations || []}
                transparencyReport={transparencyReport}
                onCreateCampaign={handleCreateCampaign}
                onRecordExpenditure={handleRecordExpenditure}
                onRejectFlaggedDonation={handleRejectFlaggedDonation}
                onRecordDonation={async (payload) => {
                      const targetCampaignId = payload.campaignId;
                  if (!targetCampaignId) {
                        notify('error', 'Please select a specific relief campaign to credit your donation.');
                    return;
                  }
                  try {
                    const record = await apiFetch<any>(
                      '/donations',
                      {
                        method: 'POST',
                        body: JSON.stringify({
                          campaignId: targetCampaignId,
                          donorName: payload.donorName,
                          donationType: payload.donationType,
                          monetaryAmountUsd: payload.donationType === 'Monetary' ? payload.monetaryAmountUsd : 0,
                          materialDescription: payload.donationType === 'Material' ? payload.materialDescription : '',
                          materialQuantity: payload.donationType === 'Material' ? payload.materialQuantity : 0,
                          allocationPurpose: payload.allocationPurpose,
                          sandboxCardLastFour:
                            payload.donationType === 'Monetary'
                              ? payload.sandboxCardLastFour || '4242'
                              : '0000'
                        })
                      },
                      authUser?.token
                    );
                    notify(
                      record.isFlaggedSuspicious ? 'info' : 'success',
                      record.isFlaggedSuspicious
                        ? `Large donation ($${record.monetaryAmountUsd}) recorded and queued for compliance approval: ${record.suspiciousReason}`
                        : record.donationType === 'Material'
                          ? `In-kind material donation (${record.materialQuantity} × ${record.materialDescription}) recorded. Thank you!`
                          : `Donation of $${record.monetaryAmountUsd} recorded. Thank you!`
                    );
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
                onApproveFlaggedDonation={async (id) => {
                  try {
                    await apiFetch<any>(`/donations/${id}/approve`, { method: 'POST' }, authUser?.token);
                    notify('success', 'Large donation verified and approved.');
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
              />
            )}

            {activeTab === 'map-resilience' && (
              <MapAndResilienceTab
                userRole={authUser.role}
                requests={requests}
                shelters={sheltersData.shelters || []}
                resources={resources}
                operationalAreas={allOperationalAreas}
                mappingReferences={mappingReferences}
                coverageReport={coverageReport}
                resilienceStatus={resilienceStatus}
                onRetryFailedNotifications={handleRetryFailedNotifications}
                routeCalc={routeCalc}
                auditLogs={auditLogs}
                adminUsers={adminUsers}
                currentUserId={authUser.userId}
                organisations={organisations}
                crises={crises}
                volunteers={volunteersData.volunteers || []}
                campaigns={donationsData.campaigns || []}
                adminPartnerships={adminPartnerships}
                rolePermissions={rolePermissions}
                systemConfig={systemConfig}
                serviceSettings={serviceSettings}
                onAdminCreateUser={handleAdminCreateUser}
                onInviteStaff={handleInviteStaff}
                onAdminUpdateUser={handleAdminUpdateUser}
                onAdminDeleteUser={handleAdminDeleteUser}
                onApprovePartnership={handleApprovePartnership}
                onRejectPartnership={handleRejectPartnership}
                onAddRolePermission={handleAddRolePermission}
                onDeleteRolePermission={handleDeleteRolePermission}
                onUpdateSystemConfig={handleUpdateSystemConfig}
                onUpdateServiceSettings={handleUpdateServiceSettings}
                onAdminUpdateCrisis={handleAdminUpdateCrisis}
                onAdminDeleteCrisis={handleAdminDeleteCrisis}
                onAdminUpdateShelter={handleAdminUpdateShelter}
                onAdminDeleteShelter={handleAdminDeleteShelter}
                onAdminUpdateResource={handleAdminUpdateResource}
                onAdminDeleteResource={handleAdminDeleteResource}
                onAdminDeleteRequest={handleAdminDeleteRequest}
                onAdminDeleteVolunteer={handleAdminDeleteVolunteer}
                onAdminDeleteCampaign={handleAdminDeleteCampaign}
                activeLanguage={briefingLang as SupportedLanguage}
                onChangeLanguage={handleLanguageBriefingChange}
                    onCalculateRoute={async (customOriginLat?: number, customOriginLon?: number, customDestLat?: number, customDestLon?: number) => {
                  try {
                        const originLat = customOriginLat ?? resources[0]?.warehouseLatitude ?? 6.9271;
                        const originLon = customOriginLon ?? resources[0]?.warehouseLongitude ?? 79.8612;
                        const destLat = customDestLat ?? requests[0]?.latitude ?? crises[0]?.centerLatitude ?? 6.9319;
                        const destLon = customDestLon ?? requests[0]?.longitude ?? crises[0]?.centerLongitude ?? 79.8478;
                    const route = await apiFetch<any>(
                      `/mapping/route?originLat=${originLat}&originLon=${originLon}&destLat=${destLat}&destLon=${destLon}`,
                      {},
                      authUser?.token
                    );
                    setRouteCalc(route);
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
                onToggleResilience={async (service, currentValue) => {
                  try {
                    const updated = await apiFetch<any>(
                      `/admin/resilience/toggle?service=${service}&simulateFailure=${!currentValue}`,
                      { method: 'POST' },
                      authUser?.token
                    );
                    setResilienceStatus(updated);
                    notify('info', `${service.toUpperCase()} service mode updated.`);
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
                onSendIdempotentNotification={async (idempotencyKey, languageCode, subject, messageBody) => {
                  const selectedLang = languageCode || briefingLang || 'en';
                  try {
                    const rec = await apiFetch<any>(
                      '/notifications/send',
                      {
                        method: 'POST',
                        body: JSON.stringify({
                          recipientUserId: authUser?.userId || '22222222-2222-2222-2222-222222222201',
                          recipientContact: '+94-77-1112233',
                          channel: 'Sms',
                          languageCode: selectedLang,
                          subject,
                          messageBody,
                          idempotencyKey
                        })
                      },
                      authUser?.token
                    );
                    notify(
                      rec.deliveryStatus === 'SkippedDuplicate' ? 'info' : 'success',
                      `SMS Test Result (${selectedLang.toUpperCase()}): ${rec.deliveryStatus} (${rec.providerResponse})`
                    );
                    await loadAllData();
                  } catch (err: any) {
                    notify('error', err.message);
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bento-glass border-t border-white/10 px-2 py-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-around gap-1">
          {mobileBottomTabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                    className={`flex-1 min-w-0 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${isActive
                    ? 'bg-indigo-600 text-white keep-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {getModuleIcon(item.id, 'w-4 h-4 shrink-0')}
                <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                  {getLocalizedTabLabel(item.id, item.label)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileNavDrawerOpen(true)}
                className={`shrink-0 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition ${mobileNavDrawerOpen
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Menu className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold leading-tight">Menu</span>
          </button>
        </div>
      </nav>
    </div>
      )}
    </>
  );
}

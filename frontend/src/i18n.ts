export type SupportedLanguage = 'en' | 'si' | 'ta' | 'es' | 'fr' | 'ar';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  fullName: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', fullName: 'English', dir: 'ltr' },
  { code: 'si', label: 'සිංහල', fullName: 'Sinhala (සිංහල)', dir: 'ltr' },
  { code: 'ta', label: 'தமிழ்', fullName: 'Tamil (தமிழ்)', dir: 'ltr' },
  { code: 'es', label: 'Español', fullName: 'Spanish (Español)', dir: 'ltr' },
  { code: 'fr', label: 'Français', fullName: 'French (Français)', dir: 'ltr' },
  { code: 'ar', label: 'العربية', fullName: 'Arabic (العربية)', dir: 'rtl' }
];

export interface QuickTemplateItem {
  label: string;
  category: string;
  urgency: string;
  title: string;
  description: string;
  people: number;
  qty: number;
  wheelchair: boolean;
}

export interface AiSupportFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LanguageBundle {
  dir: 'ltr' | 'rtl';
  appSubtitle: string;
  activeCrisisBadge: string;
  switchRole: string;
  signOut: string;
  lightMode: string;
  darkMode: string;
  yourRoleLabel: string;
  currentTabLabel: string;
  languageLabel: string;
  nav: {
    dashboard: string;
    citizen: string;
    aiGovernance: string;
    logistics: string;
    shelters: string;
    volunteers: string;
    donations: string;
    mapResilience: string;
  };
  dashboard: {
    briefingBadge: string;
    briefingHeading: string;
    safetyAdviceBadge: string;
    openRequests: string;
    criticalUrgency: string;
    avgResponseTime: string;
    underGoal: string;
    suppliesDispatched: string;
    shelterCapacity: string;
    spacesFilled: string;
    staffAiReviews: string;
    aiScoresReviewed: string;
    duplicatesCaught: string;
    duplicateSmsBlocked: string;
    queueBadge: string;
    queueTitleManage: string;
    queueTitleView: string;
    queueSub: string;
    searchPlaceholder: string;
    filterAll: string;
    filterCritical: string;
    filterDuplicates: string;
    filterVerified: string;
    verifyBtn: string;
    escalateBtn: string;
    closeBtn: string;
    rejectBtn: string;
    mergeBtn: string;
    reviewAiBtn: string;
    peopleAffected: string;
    unitsNeeded: string;
    possibleDuplicate: string;
  };
  citizen: {
    portalTitle: string;
    portalSubtitle: string;
    tabAll: string;
    tabRequest: string;
    tabAiSupport: string;
    tabTrack: string;
    tabFamily: string;
    tabShelters: string;
    formBadge: string;
    formTitle: string;
    quickTemplatePrompt: string;
    step1Category: string;
    step2Urgency: string;
    step3Summary: string;
    step3Placeholder: string;
    step4Description: string;
    step4Placeholder: string;
    step5Location: string;
    locationPlaceholder: string;
    peopleCountLabel: string;
    quantityLabel: string;
    photoLabel: string;
    wheelchairCheckbox: string;
    submitRequestBtn: string;
    familyBadge: string;
    familyTitle: string;
    headNameLabel: string;
    totalMembersLabel: string;
    childrenLabel: string;
    elderlyLabel: string;
    medicalNotesLabel: string;
    mobilityCheckbox: string;
    chronicCheckbox: string;
    saveFamilyBtn: string;
    alertsTitle: string;
    safetyWhatToDo: string;
    alertHeadline: string;
    alertBody: string;
    alertGuidance: string;
    sheltersTitle: string;
    spacesOpen: string;
    trackerBadge: string;
    trackerTitle: string;
    rateDeliveryBtn: string;
    feedbackTitle: string;
    ratingLabel: string;
    commentsLabel: string;
    submitFeedbackBtn: string;
    aiAssistantBadge: string;
    aiAssistantTitle: string;
    aiAssistantSubtitle: string;
    aiAskPlaceholder: string;
    aiAskBtn: string;
    aiOfficialBriefingTitle: string;
    categories: Record<string, string>;
    urgencies: Record<string, { label: string; desc: string }>;
    templates: QuickTemplateItem[];
    aiFaqs: AiSupportFaqItem[];
  };
  smsNotification: {
    title: string;
    subtitle: string;
    languageSelectLabel: string;
    subject: string;
    body: string;
    sendBtn: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, LanguageBundle> = {
  en: {
    dir: 'ltr',
    appSubtitle: 'Humanitarian Aid & Emergency Coordination System',
    activeCrisisBadge: 'Kalu Ganga Floods Response',
    switchRole: 'Switch Role',
    signOut: 'Sign Out',
    lightMode: 'Light',
    darkMode: 'Dark',
    yourRoleLabel: 'Your Role',
    currentTabLabel: 'Current Tab',
    languageLabel: 'Language',
    nav: {
      dashboard: 'Overview & Cases',
      citizen: 'Request Help & My Aid',
      aiGovernance: 'AI Priority & Forecast',
      logistics: 'Supplies & Dispatch',
      shelters: 'Evacuation Shelters',
      volunteers: 'Volunteers & Teams',
      donations: 'Relief Campaigns',
      mapResilience: 'Live Map & System Health'
    },
    dashboard: {
      briefingBadge: 'Official AI Multilingual Situation Summary',
      briefingHeading: 'Crisis Briefing',
      safetyAdviceBadge: 'Safety Advice',
      openRequests: 'Open Requests',
      criticalUrgency: 'Critical Urgency',
      avgResponseTime: 'Avg. Response Time',
      underGoal: '✓ Under 30-min goal',
      suppliesDispatched: 'Supplies Dispatched',
      shelterCapacity: 'Shelter Capacity',
      spacesFilled: 'spaces filled',
      staffAiReviews: 'Staff AI Reviews',
      aiScoresReviewed: 'AI scores reviewed',
      duplicatesCaught: 'Duplicates Caught',
      duplicateSmsBlocked: 'duplicate SMS blocked',
      queueBadge: 'Citizen Help Requests Queue',
      queueTitleManage: 'Review, Verify & Prioritize Incoming Help Requests',
      queueTitleView: 'Active Community Assistance Requests',
      queueSub: 'Each card shows the AI Urgency Score (out of 100) and quick buttons to verify, escalate, or merge duplicate reports.',
      searchPlaceholder: 'Search by code, town, or need...',
      filterAll: 'All',
      filterCritical: 'Critical',
      filterDuplicates: 'Duplicates',
      filterVerified: 'Verified',
      verifyBtn: 'Verify Request',
      escalateBtn: 'Escalate Urgent',
      closeBtn: 'Close Case',
      rejectBtn: 'Reject Case',
      mergeBtn: 'Merge Duplicate',
      reviewAiBtn: 'Review AI Score',
      peopleAffected: 'people affected',
      unitsNeeded: 'units needed',
      possibleDuplicate: 'Possible Duplicate Report'
    },
    citizen: {
      portalTitle: 'Citizen Emergency Help & Multilingual AI Support Portal',
      portalSubtitle: 'Submit assistance requests in your preferred language, receive automated AI safety guidance, and track relief deliveries.',
      tabAll: 'Show All Tools',
      tabRequest: '1. Request Help',
      tabAiSupport: '2. AI Multilingual Support',
      tabTrack: '3. My Requests',
      tabFamily: '4. Family Profile',
      tabShelters: '5. Shelters & Alerts',
      formBadge: 'Multilingual Emergency Request',
      formTitle: 'Ask for Immediate Relief Assistance',
      quickTemplatePrompt: 'In a hurry? Click a Quick Emergency Template to auto-fill in English:',
      step1Category: '1. What kind of help do you need?',
      step2Urgency: '2. How urgent is your situation?',
      step3Summary: '3. Short Summary of What You Need *',
      step3Placeholder: 'Example: Need insulin and dry food packs for family of 6',
      step4Description: '4. Explain Your Situation (Water level, medical needs, landmarks) *',
      step4Placeholder: 'Tell responders about any medical conditions, children/elderly, or blocked roads...',
      step5Location: '5. Your Location (Click a town or type your address)',
      locationPlaceholder: 'Your street address, village, or nearest landmark',
      peopleCountLabel: 'People Affected',
      quantityLabel: 'Quantity / Packs Needed',
      photoLabel: 'Photo / Medical Note (Optional)',
      wheelchairCheckbox: 'Someone in my family needs wheelchair or disability-friendly evacuation support',
      submitRequestBtn: 'Submit Emergency Help Request',
      familyBadge: 'Saved Family Details',
      familyTitle: 'My Family & Medical Profile',
      headNameLabel: 'Head of Family Name',
      totalMembersLabel: 'Total Members',
      childrenLabel: 'Children',
      elderlyLabel: 'Elderly (65+)',
      medicalNotesLabel: 'Important Medical or Dietary Needs',
      mobilityCheckbox: 'Wheelchair / Mobility Assistance Required',
      chronicCheckbox: 'Ongoing Medical Condition (Insulin, Oxygen, Dialysis)',
      saveFamilyBtn: 'Save Family Profile',
      alertsTitle: 'Official Flood Warnings & Safety Advice',
      safetyWhatToDo: 'What to do:',
      alertHeadline: 'Kalu Ganga Basin High Flood Warning — Ratnapura & Kalutara',
      alertBody: 'Heavy monsoon rainfall has raised water levels in Ratnapura, Kuruwita, and Elapatha. Low-lying roads are submerged.',
      alertGuidance: 'Move immediately to approved high-ground shelters. Bring essential medicines, ID documents, and drinking water.',
      sheltersTitle: 'Open Evacuation Shelters Near You',
      spacesOpen: 'spaces open',
      trackerBadge: 'Live Aid Status Tracker',
      trackerTitle: 'My Submitted Help Requests & Delivery Rating',
      rateDeliveryBtn: 'Rate Delivery',
      feedbackTitle: 'Confirm Aid Received & Rate Your Experience',
      ratingLabel: 'Your Rating (1 to 5 Stars)',
      commentsLabel: 'Comments for the Relief Team',
      submitFeedbackBtn: 'Submit Feedback',
      aiAssistantBadge: 'Coursework 1.1.A • Automated Multilingual AI Support',
      aiAssistantTitle: 'AI Humanitarian Support & Multilingual Communication Center',
      aiAssistantSubtitle: 'Receive instant safety instructions, shelter directions, and emergency guidance in your chosen language.',
      aiAskPlaceholder: 'Ask a question (e.g., Where is a wheelchair shelter? How do I get insulin?)...',
      aiAskBtn: 'Get AI Help',
      aiOfficialBriefingTitle: 'Live Multilingual Crisis Broadcast',
      categories: {
        Medicine: 'Medicine & First Aid',
        Food: 'Food & Dry Rations',
        WaterAndSanitation: 'Clean Drinking Water',
        TemporaryShelter: 'Safe Shelter',
        SearchAndRescue: 'Boat Rescue / Evacuation',
        AccessibilityAssistance: 'Wheelchair / Disability Aid',
        Transportation: 'Emergency Transport'
      },
      urgencies: {
        Low: { label: 'Low', desc: 'Can wait 24+ hrs' },
        Medium: { label: 'Medium', desc: 'Needed today' },
        High: { label: 'High', desc: 'Urgent need' },
        Critical: { label: 'Critical', desc: 'Very urgent' },
        LifeThreatening: { label: 'Life Threatening', desc: 'Immediate danger' }
      },
      templates: [
        {
          label: '💊 Urgent Medicine / Insulin',
          category: 'Medicine',
          urgency: 'LifeThreatening',
          title: 'Urgent cold-chain insulin & medical supplies needed',
          description: 'Flood waters have cut off road access. Elderly diabetic family member needs insulin and daily medication urgently.',
          people: 6,
          qty: 10,
          wheelchair: true
        },
        {
          label: '🍲 Family Food & Clean Water',
          category: 'Food',
          urgency: 'High',
          title: 'Dry rations and drinking water for marooned family',
          description: 'Ground floor is flooded and kitchen supplies are damaged. Need dry food packs and clean drinking water for children and adults.',
          people: 5,
          qty: 15,
          wheelchair: false
        },
        {
          label: '🚣 Boat Rescue / Evacuation',
          category: 'SearchAndRescue',
          urgency: 'LifeThreatening',
          title: 'Immediate boat evacuation needed due to rising water',
          description: 'Water level is rising rapidly near our home. Family is waiting on the upper floor and needs safe transport to high ground.',
          people: 4,
          qty: 1,
          wheelchair: true
        },
        {
          label: '♿ Wheelchair Safe Shelter',
          category: 'TemporaryShelter',
          urgency: 'Critical',
          title: 'Need wheelchair-accessible shelter space for family',
          description: 'Evacuating from flood zone with an elderly relative who uses a wheelchair. Need a ground-floor accessible relief shelter.',
          people: 6,
          qty: 6,
          wheelchair: true
        }
      ],
      aiFaqs: [
        {
          id: 'shelter',
          question: 'Where is the nearest wheelchair-accessible shelter?',
          answer: 'Ratnapura Central High-Ground Relief Complex (Main Street, Ratnapura) and Kalutara District Maha Vidyalaya Shelter are open right now with wheelchair ramps, medical bays, and clean water.'
        },
        {
          id: 'medicine',
          question: 'How do I get urgent insulin or refrigerated medicine?',
          answer: 'Select "Medicine & First Aid" and set urgency to "Life Threatening". Our AI Triage Engine flags cold-chain medical keywords (like insulin or oxygen) for immediate priority dispatch from the Ratnapura Medical Cold Depot.'
        },
        {
          id: 'rescue',
          question: 'Water is rising around our house. What should we do?',
          answer: 'Move all family members to the highest floor or roof immediately, turn off main electricity, and submit a "Boat Rescue / Evacuation" request with your town preset so field rescue teams receive your GPS pin.'
        },
        {
          id: 'triage',
          question: 'Who reviews my emergency request?',
          answer: 'Our AI calculates an initial Priority Score (0–100) based on urgency and family vulnerability, and an authorised human Case Manager or Emergency Coordinator verifies and dispatches aid.'
        }
      ]
    },
    smsNotification: {
      title: 'Multilingual SMS Alert & Duplicate Protection Test',
      subtitle: 'Select a language to generate an emergency SMS in that language. Sending twice with the same Message ID blocks duplicate texts.',
      languageSelectLabel: 'Notification Language',
      subject: 'Emergency Evacuation Update',
      body: 'Proceed immediately to Ratnapura Central High-Ground Relief Complex. Medical & food aid available.',
      sendBtn: 'Send Multilingual Test SMS'
    }
  },

  si: {
    dir: 'ltr',
    appSubtitle: 'මානුෂීය ආධාර සහ හදිසි ආපදා සම්බන්ධීකරණ පද්ධතිය',
    activeCrisisBadge: 'කළු ගඟ ගංවතුර ආපදා මෙහෙයුම',
    switchRole: 'භූමිකාව මාරු කරන්න',
    signOut: 'ඉවත් වන්න',
    lightMode: 'දිවා ආලෝකය',
    darkMode: 'අඳුරු තේමාව',
    yourRoleLabel: 'ඔබගේ භූමිකාව',
    currentTabLabel: 'වත්මන් පිටුව',
    languageLabel: 'භාෂාව',
    nav: {
      dashboard: 'ප්‍රධාන පුවරුව සහ ඉල්ලීම්',
      citizen: 'ආධාර ඉල්ලීම් සහ මගේ තොරතුරු',
      aiGovernance: 'AI ප්‍රමුඛතා සහ පුරෝකථන',
      logistics: 'සැපයුම් සහ බෙදාහැරීම්',
      shelters: 'ආරක්ෂිත මධ්‍යස්ථාන',
      volunteers: 'ස්වේච්ඡා කණ්ඩායම්',
      donations: 'ආධාර අරමුදල්',
      mapResilience: 'සජීවී සිතියම සහ පද්ධති තත්ත්වය'
    },
    dashboard: {
      briefingBadge: 'නිල බහුභාෂා ආපදා තත්ත්ව වාර්තාව',
      briefingHeading: 'ආපදා මෙහෙයුම් සාරාංශය',
      safetyAdviceBadge: 'ආරක්ෂක උපදෙස්',
      openRequests: 'විවෘත ඉල්ලීම්',
      criticalUrgency: 'අතිශය හදිසි',
      avgResponseTime: 'සාමාන්‍ය ප්‍රතිචාර කාලය',
      underGoal: '✓ මිනිත්තු 30 ඉලක්කය තුළ',
      suppliesDispatched: 'බෙදාහැරි සැපයුම්',
      shelterCapacity: 'කඳවුරු ධාරිතාව',
      spacesFilled: 'ඉඩ ප්‍රමාණයක් පිරී ඇත',
      staffAiReviews: 'නිලධාරී AI පරීක්ෂාවන්',
      aiScoresReviewed: 'AI ලකුණු පරීක්ෂා කරන ලදී',
      duplicatesCaught: 'හඳුනාගත් අනුපිටපත්',
      duplicateSmsBlocked: 'අනුපිටපත් SMS වැළැක්විය',
      queueBadge: 'ජනතා සහන ඉල්ලීම් පෙළගැස්ම',
      queueTitleManage: 'ලැබී ඇති හදිසි ආධාර ඉල්ලීම් පරීක්ෂා කිරීම සහ ප්‍රමුඛතා ලබාදීම',
      queueTitleView: 'ක්‍රියාත්මක ප්‍රජා සහන ඉල්ලීම්',
      queueSub: 'සෑම ඉල්ලීමකම AI ප්‍රමුඛතා ලකුණු (100 න්) සහ තහවුරු කිරීමේ බොත්තම් දැක්වේ.',
      searchPlaceholder: 'අංකය, නගරය හෝ අවශ්‍යතාවය අනුව සොයන්න...',
      filterAll: 'සියල්ල',
      filterCritical: 'අතිශය හදිසි',
      filterDuplicates: 'අනුපිටපත්',
      filterVerified: 'තහවුරු කළ',
      verifyBtn: 'තහවුරු කරන්න',
      escalateBtn: 'හදිසි ලෙස යොමු කරන්න',
      closeBtn: 'අවසන් කරන්න',
      rejectBtn: 'ප්‍රතික්ෂේප කරන්න',
      mergeBtn: 'අනුපිටපත් එක් කරන්න',
      reviewAiBtn: 'AI ලකුණු බලන්න',
      peopleAffected: 'පුද්ගලයින්',
      unitsNeeded: 'ඒකක අවශ්‍යයි',
      possibleDuplicate: 'හඳුනාගත් අනුපිටපත් ඉල්ලීමක්'
    },
    citizen: {
      portalTitle: 'පුරවැසි හදිසි සහන සහ බහුභාෂා AI උපකාරක ද්වාරය',
      portalSubtitle: 'සිංහල භාෂාවෙන් හදිසි ආධාර ඉල්ලුම් කරන්න, ස්වයංක්‍රීය AI ආරක්ෂක උපදෙස් ලබාගන්න, සහ ආධාර ලැබෙන ආකාරය පරීක්ෂා කරන්න.',
      tabAll: 'සියලුම සේවාවන්',
      tabRequest: '1. ආධාර ඉල්ලුම් කරන්න',
      tabAiSupport: '2. AI සිංහල උපකාරක සේවාව',
      tabTrack: '3. මගේ ඉල්ලීම්',
      tabFamily: '4. පවුලේ තොරතුරු',
      tabShelters: '5. ආරක්ෂිත කඳවුරු සහ නිවේදන',
      formBadge: 'හදිසි සහන ඉල්ලුම්පත (සිංහල)',
      formTitle: 'හදිසි මානුෂීය ආධාර ඉල්ලුම් කරන්න',
      quickTemplatePrompt: 'ඉක්මනින් ඉල්ලුම් කිරීමට පහත ක්ෂණික ආකෘතියක් (Template) තෝරන්න:',
      step1Category: '1. ඔබට අවශ්‍ය කුමන ආකාරයේ උපකාරයක්ද?',
      step2Urgency: '2. තත්ත්වය කොපමණ හදිසිද?',
      step3Summary: '3. අවශ්‍යතාවය පිළිබඳ කෙටි සාරාංශයක් *',
      step3Placeholder: 'උදා: සාමාජිකයින් 6 දෙනෙකුට ඉන්සියුලින් සහ වියළි ආහාර අවශ්‍යයි',
      step4Description: '4. වැඩිදුර විස්තර (ජල මට්ටම, රෝගීන්, ගමන් මාර්ග අවහිරතා) *',
      step4Placeholder: 'වෛද්‍ය අවශ්‍යතා, කුඩා දරුවන්/වැඩිහිටියන් හෝ අවහිර වූ මාර්ග ගැන සඳහන් කරන්න...',
      step5Location: '5. ඔබ සිටින ස්ථානය (නගරය තෝරන්න හෝ ලිපිනය ලියන්න)',
      locationPlaceholder: 'ඔබගේ ලිපිනය, ගම හෝ ආසන්නතම ස්ථානය',
      peopleCountLabel: 'බලපෑමට ලක්වූ පිරිස',
      quantityLabel: 'අවශ්‍ය ප්‍රමාණය (ඒකක)',
      photoLabel: 'ඡායාරූප / වෛද්‍ය වාර්තා (අත්‍යවශ්‍ය නොවේ)',
      wheelchairCheckbox: 'රෝද පුටු හෝ විශේෂ අවශ්‍යතා සහිත පුද්ගලයෙකු පවුලේ සිටී',
      submitRequestBtn: 'හදිසි ආධාර ඉල්ලීම යොමු කරන්න',
      familyBadge: 'සුරැකි පවුලේ තොරතුරු',
      familyTitle: 'මගේ පවුලේ සහ වෛද්‍ය තොරතුරු',
      headNameLabel: 'ගෘහ මූලිකයාගේ නම',
      totalMembersLabel: 'මුළු සාමාජිකයින්',
      childrenLabel: 'දරුවන් ගණන',
      elderlyLabel: 'වැඩිහිටියන් (65+)',
      medicalNotesLabel: 'විශේෂ වෛද්‍ය හෝ ආහාර අවශ්‍යතා',
      mobilityCheckbox: 'රෝද පුටු / ගමන් බිමන් උපකාර අවශ්‍යයි',
      chronicCheckbox: 'නිදන්ගත රෝග පවතී (ඉන්සියුලින්, ඔක්සිජන්)',
      saveFamilyBtn: 'පවුලේ තොරතුරු සුරකින්න',
      alertsTitle: 'නිල ගංවතුර අනතුරු ඇඟවීම් සහ ආරක්ෂක උපදෙස්',
      safetyWhatToDo: 'කළ යුතු දේ:',
      alertHeadline: 'කළු ගඟ ද්‍රෝණියේ දැඩි ගංවතුර අනතුරු ඇඟවීම — රත්නපුර සහ කළුතර',
      alertBody: 'ධාරානිපාත වර්ෂාව හේතුවෙන් රත්නපුර, කුරුවිට සහ ඇලපාත පහත් බිම් ජලයෙන් යටවී ඇත.',
      alertGuidance: 'වහාම අනුමත ආරක්ෂිත මධ්‍යස්ථාන වෙත යොමු වන්න. අත්‍යවශ්‍ය ඖෂධ සහ පානීය ජලය රැගෙන යන්න.',
      sheltersTitle: 'ඔබ අසල විවෘත ආරක්ෂිත කඳවුරු',
      spacesOpen: 'ඉඩ පහසුකම් ඇත',
      trackerBadge: 'සජීවී ආධාර තත්ත්ව පරීක්ෂාව',
      trackerTitle: 'මා යොමු කළ ඉල්ලීම් සහ ආධාර ඇගයීම',
      rateDeliveryBtn: 'ආධාර ඇගයීම',
      feedbackTitle: 'ආධාර ලැබුණු බව තහවුරු කර තරු ලකුණු ලබාදෙන්න',
      ratingLabel: 'ඔබගේ ඇගයීම (තරු 1 සිට 5 දක්වා)',
      commentsLabel: 'සහන කණ්ඩායම වෙත ඔබගේ අදහස්',
      submitFeedbackBtn: 'ඇගයීම යොමු කරන්න',
      aiAssistantBadge: 'Coursework 1.1.A • ස්වයංක්‍රීය බහුභාෂා AI සහායක',
      aiAssistantTitle: 'AI මානුෂීය උපකාරක සහ සිංහල සන්නිවේදන මධ්‍යස්ථානය',
      aiAssistantSubtitle: 'ඔබගේ භාෂාවෙන් ක්ෂණික ආරක්ෂක උපදෙස්, ආරක්ෂිත කඳවුරු තොරතුරු සහ හදිසි මගපෙන්වීම් ලබාගන්න.',
      aiAskPlaceholder: 'ප්‍රශ්නයක් අසන්න (උදා: රෝද පුටු පහසුකම් ඇති කඳවුර කොහේද? ඉන්සියුලින් ලබාගන්නේ කෙසේද?)...',
      aiAskBtn: 'AI පිළිතුර ලබාගන්න',
      aiOfficialBriefingTitle: 'සජීවී බහුභාෂා ආපදා නිවේදනය',
      categories: {
        Medicine: 'ඖෂධ සහ ප්‍රථමාධාර',
        Food: 'ආහාර සහ වියළි සලාක',
        WaterAndSanitation: 'පිරිසිදු පානීය ජලය',
        TemporaryShelter: 'ආරක්ෂිත නවාතැන්',
        SearchAndRescue: 'බෝට්ටු මගින් මුදාගැනීම්',
        AccessibilityAssistance: 'රෝද පුටු / ආබාධිත සහන',
        Transportation: 'හදිසි ප්‍රවාහන පහසුකම්'
      },
      urgencies: {
        Low: { label: 'අඩු (Low)', desc: 'පැය 24+ රැඳිය හැක' },
        Medium: { label: 'මධ්‍යම (Medium)', desc: 'අද දින අවශ්‍යයි' },
        High: { label: 'ඉහළ (High)', desc: 'ඉක්මන් අවශ්‍යතාවයකි' },
        Critical: { label: 'බරපතල (Critical)', desc: 'ඉතා හදිසියි' },
        LifeThreatening: { label: 'ජීවිත අවදානම්', desc: 'ක්ෂණික මුදාගැනීම්' }
      },
      templates: [
        {
          label: '💊 හදිසි ඉන්සියුලින් / ඖෂධ',
          category: 'Medicine',
          urgency: 'LifeThreatening',
          title: 'හදිසි ඉන්සියුලින් (Insulin) සහ වෛද්‍ය ආධාර අවශ්‍යයි',
          description: 'ගංවතුර නිසා මාර්ග අවහිර වී ඇත. දියවැඩියා රෝගයෙන් පෙළෙන වැඩිහිටි මවට ඉන්සියුලින් සහ දෛනික ඖෂධ වහාම අවශ්‍ය වේ.',
          people: 6,
          qty: 10,
          wheelchair: true
        },
        {
          label: '🍲 පවුලේ ආහාර සහ පානීය ජලය',
          category: 'Food',
          urgency: 'High',
          title: 'කොටුවී සිටින පවුලක් සඳහා වියළි ආහාර සහ පානීය ජලය',
          description: 'නිවසේ පහත මාලය ජලයෙන් යටවී ඇත. කුඩා දරුවන් සහ වැඩිහිටියන් සඳහා වියළි ආහාර සහ පානීය ජල බෝතල් අවශ්‍යයි.',
          people: 5,
          qty: 15,
          wheelchair: false
        },
        {
          label: '🚣 බෝට්ටු මගින් හදිසි මුදාගැනීම්',
          category: 'SearchAndRescue',
          urgency: 'LifeThreatening',
          title: 'ජල මට්ටම ඉහළ යාම නිසා වහාම බෝට්ටුවකින් මුදාගැනීමට අවශ්‍යයි',
          description: 'නිවස අවට ජල මට්ටම වේගයෙන් ඉහළ යයි. පවුලේ සාමාජිකයින් ඉහළ මාලයේ රැඳී සිටින අතර ආරක්ෂිත ස්ථානයකට යාමට උපකාර අවශ්‍යයි.',
          people: 4,
          qty: 1,
          wheelchair: true
        },
        {
          label: '♿ රෝද පුටු පහසුකම් සහිත කඳවුරක්',
          category: 'TemporaryShelter',
          urgency: 'Critical',
          title: 'රෝද පුටු පහසුකම් සහිත ආරක්ෂිත කඳවුරක ඉඩ අවශ්‍යයි',
          description: 'රෝද පුටුවක් භාවිතා කරන වැඩිහිටි ඥාතියෙකු සමඟ ගංවතුර කලාපයෙන් ඉවත් වීමට ආරක්ෂිත නවාතැනක් අවශ්‍යයි.',
          people: 6,
          qty: 6,
          wheelchair: true
        }
      ],
      aiFaqs: [
        {
          id: 'shelter',
          question: 'රෝද පුටු පහසුකම් සහිත ආසන්නතම ආරක්ෂිත කඳවුර කොහේද?',
          answer: 'රත්නපුර මධ්‍යම උස්බිම් සහන මධ්‍යස්ථානය සහ කළුතර දිස්ත්‍රික් මහා විද්‍යාල කඳවුර දැනට විවෘතව පවතී. එහි රෝද පුටු පිවිසුම්, වෛද්‍ය ඒකක සහ පානීය ජලය ඇත.'
        },
        {
          id: 'medicine',
          question: 'හදිසි ඉන්සියුලින් හෝ ඖෂධ ලබාගන්නේ කෙසේද?',
          answer: 'ඉල්ලුම්පතෙහි "ඖෂධ සහ ප්‍රථමාධාර" තෝරා "ජීවිත අවදානම්" ලෙස සඳහන් කරන්න. අපගේ AI පද්ධතිය එයට ඉහළම ප්‍රමුඛතාවය ලබාදී රත්නපුර ශීතාගාර ගබඩාවෙන් ඖෂධ එවීමට කටයුතු කරයි.'
        },
        {
          id: 'rescue',
          question: 'නිවස අවට ජල මට්ටම ඉහළ යනවා. අපි කුමක් කළ යුතුද?',
          answer: 'වහාම නිවසේ ඉහළ මාලයට හෝ උස් ස්ථානයකට යන්න. ප්‍රධාන විදුලි සැපයුම විසන්ධි කර "බෝට්ටු මගින් මුදාගැනීම්" ඉල්ලීමක් යොමු කරන්න.'
        },
        {
          id: 'triage',
          question: 'මගේ ආධාර ඉල්ලීම පරීක්ෂා කරන්නේ කවුද?',
          answer: 'AI පද්ධතිය මගින් හදිසිභාවය අනුව ලකුණු (0-100) ලබාදෙන අතර, බලයලත් සහන නිලධාරියෙකු විසින් එය පරීක්ෂා කර අනුමත කරනු ලබයි.'
        }
      ]
    },
    smsNotification: {
      title: 'බහුභාෂා SMS අනතුරු ඇඟවීම් සහ අනුපිටපත් පරීක්ෂාව',
      subtitle: 'තෝරාගත් භාෂාවෙන් හදිසි කෙටි පණිවිඩයක් (SMS) යවන්න. එකම අංකයකින් දෙවරක් යැවීමේදී අනුපිටපත් පණිවිඩ ස්වයංක්‍රීයව වළක්වයි.',
      languageSelectLabel: 'පණිවිඩයේ භාෂාව',
      subject: 'හදිසි ඉවත්වීමේ නිවේදනය (Emergency Evacuation)',
      body: 'කරුණාකර වහාම රත්නපුර මධ්‍යම උස්බිම් ආරක්ෂිත මධ්‍යස්ථානය වෙත යොමු වන්න. වෛද්‍ය සහ ආහාර ආධාර සූදානම් කර ඇත.',
      sendBtn: 'සිංහල පරීක්ෂණ SMS පණිවිඩය යවන්න'
    }
  },

  ta: {
    dir: 'ltr',
    appSubtitle: 'மனிதநேய உதவி மற்றும் பேரிடர் ஒருங்கிணைப்பு அமைப்பு',
    activeCrisisBadge: 'களு கங்கை வெள்ள நிவாரணப் பணி',
    switchRole: 'பாத்திரத்தை மாற்று',
    signOut: 'வெளியேறு',
    lightMode: 'பகல் முறை',
    darkMode: 'இருள் முறை',
    yourRoleLabel: 'உங்கள் பொறுப்பு',
    currentTabLabel: 'தற்போதைய பக்கம்',
    languageLabel: 'மொழி',
    nav: {
      dashboard: 'முகப்பு மற்றும் கோரிக்கைகள்',
      citizen: 'உதவி கோரிக்கை & எனது தகவல்',
      aiGovernance: 'AI முன்னுரிமை & கணிப்பு',
      logistics: 'பொருட்கள் மற்றும் விநியோகம்',
      shelters: 'பாதுகாப்பு முகாம்கள்',
      volunteers: 'தன்னார்வலர்கள்',
      donations: 'நிவாரண நிதிகள்',
      mapResilience: 'நேரடி வரைபடம் & கணினி நிலை'
    },
    dashboard: {
      briefingBadge: 'அதிகாரப்பூர்வ பன்மொழி பேரிடர் அறிக்கை',
      briefingHeading: 'பேரிடர் நிலைமை சுருக்கம்',
      safetyAdviceBadge: 'பாதுகாப்பு ஆலோசனை',
      openRequests: 'திறந்த கோரிக்கைகள்',
      criticalUrgency: 'மிக அவசரம்',
      avgResponseTime: 'சராசரி பதில் நேரம்',
      underGoal: '✓ 30 நிமிட இலக்குக்குள்',
      suppliesDispatched: 'அனுப்பப்பட்ட பொருட்கள்',
      shelterCapacity: 'முகாம் கொள்ளளவு',
      spacesFilled: 'இடங்கள் நிரம்பியுள்ளன',
      staffAiReviews: 'அதிகாரி AI ஆய்வுகள்',
      aiScoresReviewed: 'AI மதிப்பெண்கள் ஆய்வு',
      duplicatesCaught: 'நகல்கள் கண்டறியப்பட்டன',
      duplicateSmsBlocked: 'நகல் SMS தடுக்கப்பட்டது',
      queueBadge: 'மக்கள் உதவி கோரிக்கை வரிசை',
      queueTitleManage: 'வரும் அவசர உதவி கோரிக்கைகளை சரிபார்த்து முன்னுரிமை அளித்தல்',
      queueTitleView: 'செயலில் உள்ள சமூக உதவி கோரிக்கைகள்',
      queueSub: 'ஒவ்வொரு கோரிக்கையும் AI முன்னுரிமை மதிப்பெண் (100-க்கு) மற்றும் சரிபார்க்கும் பொத்தான்களைக் கொண்டுள்ளது.',
      searchPlaceholder: 'குறியீடு, நகரம் அல்லது தேவை மூலம் தேடுக...',
      filterAll: 'அனைத்தும்',
      filterCritical: 'மிக அவசரம்',
      filterDuplicates: 'நகல்கள்',
      filterVerified: 'சரிபார்க்கப்பட்டவை',
      verifyBtn: 'சரிபார்',
      escalateBtn: 'அவசரமாக்கு',
      closeBtn: 'முடித்து வை',
      rejectBtn: 'நிராகரி',
      mergeBtn: 'நகலை இணை',
      reviewAiBtn: 'AI மதிப்பெண் ஆய்வு',
      peopleAffected: 'பாதிக்கப்பட்டவர்கள்',
      unitsNeeded: 'அலகுகள் தேவை',
      possibleDuplicate: 'சாத்தியமான நகல் கோரிக்கை'
    },
    citizen: {
      portalTitle: 'குடிமக்கள் அவசர உதவி & பன்மொழி AI ஆதரவு தளம்',
      portalSubtitle: 'தமிழ் மொழியில் அவசர உதவி கோரிக்கைகளை சமர்ப்பிக்கவும், AI பாதுகாப்பு வழிகாட்டல்களைப் பெறவும், நிவாரண விநியோகத்தைக் கண்காணிக்கவும்.',
      tabAll: 'அனைத்து சேவைகள்',
      tabRequest: '1. உதவி கோருக',
      tabAiSupport: '2. AI தமிழ் உதவி மையம்',
      tabTrack: '3. எனது கோரிக்கைகள்',
      tabFamily: '4. குடும்ப விபரம்',
      tabShelters: '5. முகாம்கள் & எச்சரிக்கைகள்',
      formBadge: 'அவசர உதவி விண்ணப்பம் (தமிழ்)',
      formTitle: 'உடனடி நிவாரண உதவியைக் கோருங்கள்',
      quickTemplatePrompt: 'விரைவாக நிரப்ப கீழே உள்ள உடனடி மாதிரியை (Template) கிளிக் செய்யவும்:',
      step1Category: '1. உங்களுக்கு என்ன வகையான உதவி தேவை?',
      step2Urgency: '2. உங்கள் நிலைமை எவ்வளவு அவசரமானது?',
      step3Summary: '3. தேவையின் சுருக்கமான தலைப்பு *',
      step3Placeholder: 'உதாரணம்: 6 பேர் கொண்ட குடும்பத்திற்கு இன்சுலின் மற்றும் உலர் உணவு தேவை',
      step4Description: '4. விரிவான நிலைமை (நீர் மட்டம், மருத்துவத் தேவைகள்) *',
      step4Placeholder: 'மருத்துவ நிலைமைகள், குழந்தைகள்/முதியவர்கள் அல்லது தடைபட்ட சாலைகள் பற்றி குறிப்பிடவும்...',
      step5Location: '5. உங்கள் இடம் (நகரத்தைத் தேர்ந்தெடுக்கவும் அல்லது முகவரியை உள்ளிடவும்)',
      locationPlaceholder: 'உங்கள் முகவரி, கிராமம் அல்லது அருகிலுள்ள அடையாளம்',
      peopleCountLabel: 'பாதிக்கப்பட்ட நபர்கள்',
      quantityLabel: 'தேவையான அளவு',
      photoLabel: 'புகைப்படம் / மருத்துவ குறிப்பு',
      wheelchairCheckbox: 'சக்கர நாற்காலி (Wheelchair) அல்லது மாற்றுத்திறனாளி வெளியேற்ற உதவி தேவை',
      submitRequestBtn: 'அவசர உதவி கோரிக்கையை சமர்ப்பி',
      familyBadge: 'சேமிக்கப்பட்ட குடும்ப விபரம்',
      familyTitle: 'எனது குடும்பம் மற்றும் மருத்துவ விபரம்',
      headNameLabel: 'குடும்பத் தலைவர் பெயர்',
      totalMembersLabel: 'மொத்த உறுப்பினர்கள்',
      childrenLabel: 'குழந்தைகள்',
      elderlyLabel: 'முதியவர்கள் (65+)',
      medicalNotesLabel: 'முக்கிய மருத்துவ அல்லது உணவுத் தேவைகள்',
      mobilityCheckbox: 'சக்கர நாற்காலி / நடமாடும் உதவி தேவை',
      chronicCheckbox: 'தொடர் மருத்துவ சிகிச்சை (இன்சுலின், ஆக்சிஜன்)',
      saveFamilyBtn: 'குடும்ப விபரத்தை சேமி',
      alertsTitle: 'அதிகாரப்பூர்வ வெள்ள எச்சரிக்கைகள் & பாதுகாப்பு ஆலோசனை',
      safetyWhatToDo: 'செய்ய வேண்டியவை:',
      alertHeadline: 'களு கங்கை தீவிர வெள்ள எச்சரிக்கை — இரத்தினபுரி மற்றும் களுத்துறை',
      alertBody: 'கனமழை காரணமாக இரத்தினபுரி, குருவிட்ட மற்றும் எலபாத தாழ்வான பகுதிகள் வெள்ளத்தில் மூழ்கியுள்ளன.',
      alertGuidance: 'உடனடியாக அங்கீகரிக்கப்பட்ட பாதுகாப்பான முகாம்களுக்குச் செல்லவும். அவசர மருந்துகள் மற்றும் குடிநீரை எடுத்துச் செல்லவும்.',
      sheltersTitle: 'உங்களுக்கு அருகிலுள்ள திறந்த பாதுகாப்பு முகாம்கள்',
      spacesOpen: 'இடங்கள் உள்ளன',
      trackerBadge: 'நேரடி உதவி நிலை கண்காணிப்பு',
      trackerTitle: 'எனது கோரிக்கைகள் & விநியோக மதிப்பீடு',
      rateDeliveryBtn: 'மதிப்பிடுக',
      feedbackTitle: 'உதவி கிடைத்ததை உறுதிசெய்து மதிப்பிடவும்',
      ratingLabel: 'உங்கள் மதிப்பீடு (1 முதல் 5 நட்சத்திரங்கள்)',
      commentsLabel: 'நிவாரணக் குழுவிற்கான கருத்துக்கள்',
      submitFeedbackBtn: 'மதிப்பீட்டை அனுப்பு',
      aiAssistantBadge: 'Coursework 1.1.A • தானியங்கி பன்மொழி AI உதவி',
      aiAssistantTitle: 'AI மனிதநேய உதவி & தமிழ் தகவல் தொடர்பு மையம்',
      aiAssistantSubtitle: 'உங்கள் மொழியில் உடனடி பாதுகாப்பு வழிமுறைகள், முகாம் விபரங்கள் மற்றும் அவசர வழிகாட்டல்களைப் பெறுங்கள்.',
      aiAskPlaceholder: 'கேள்வி கேட்கவும் (உ-ம்: சக்கர நாற்காலி முகாம் எங்கே உள்ளது?)...',
      aiAskBtn: 'AI பதில் பெறுக',
      aiOfficialBriefingTitle: 'நேரடி பன்மொழி பேரிடர் அறிவிப்பு',
      categories: {
        Medicine: 'மருந்து மற்றும் முதலுதவி',
        Food: 'உணவு மற்றும் உலர் ரேஷன்',
        WaterAndSanitation: 'சுத்தமான குடிநீர்',
        TemporaryShelter: 'பாதுகாப்பு முகாம்',
        SearchAndRescue: 'படகு மீட்பு / வெளியேற்றம்',
        AccessibilityAssistance: 'சக்கர நாற்காலி / மாற்றுத்திறனாளி உதவி',
        Transportation: 'அவசர போக்குவரத்து'
      },
      urgencies: {
        Low: { label: 'குறைவு (Low)', desc: '24+ மணி நேரம் காத்திருக்கலாம்' },
        Medium: { label: 'நடுத்தரம் (Medium)', desc: 'இன்று தேவை' },
        High: { label: 'அதிகம் (High)', desc: 'அவசரத் தேவை' },
        Critical: { label: 'தீவிரம் (Critical)', desc: 'மிகவும் அவசரம்' },
        LifeThreatening: { label: 'உயிர் ஆபத்து', desc: 'உடனடி மீட்பு தேவை' }
      },
      templates: [
        {
          label: '💊 அவசர இன்சுலின் / மருந்து',
          category: 'Medicine',
          urgency: 'LifeThreatening',
          title: 'அவசர இன்சுலின் (Insulin) மற்றும் மருத்துவப் பொருட்கள் தேவை',
          description: 'வெள்ளத்தால் சாலைகள் துண்டிக்கப்பட்டுள்ளன. நீரிழிவு நோயால் பாதிக்கப்பட்ட முதியவருக்கு உடனடியாக இன்சுலின் தேவை.',
          people: 6,
          qty: 10,
          wheelchair: true
        },
        {
          label: '🍲 குடும்ப உணவு & குடிநீர்',
          category: 'Food',
          urgency: 'High',
          title: 'வெள்ளத்தில் சிக்கியுள்ள குடும்பத்திற்கு உலர் உணவு மற்றும் குடிநீர்',
          description: 'வீட்டின் தரைத்தளம் வெள்ளத்தில் மூழ்கியுள்ளது. குழந்தைகள் மற்றும் பெரியவர்களுக்கு உணவு மற்றும் சுத்தமான குடிநீர் தேவை.',
          people: 5,
          qty: 15,
          wheelchair: false
        },
        {
          label: '🚣 படகு மீட்பு உதவி',
          category: 'SearchAndRescue',
          urgency: 'LifeThreatening',
          title: 'நீர் மட்டம் உயர்வதால் உடனடி படகு மீட்பு தேவை',
          description: 'வீட்டைச் சுற்றி வெள்ள நீர் வேகமாக உயர்கிறது. மேல் தளத்தில் காத்திருக்கும் குடும்பத்தை பாதுகாப்பான இடத்திற்கு அழைத்துச் செல்ல வேண்டும்.',
          people: 4,
          qty: 1,
          wheelchair: true
        },
        {
          label: '♿ சக்கர நாற்காலி முகாம்',
          category: 'TemporaryShelter',
          urgency: 'Critical',
          title: 'சக்கர நாற்காலி வசதியுள்ள பாதுகாப்பு முகாம் தேவை',
          description: 'சக்கர நாற்காலி பயன்படுத்தும் முதியவருடன் வெளியேறுகிறோம். தரைத்தள வசதியுள்ள முகாம் இடம் தேவை.',
          people: 6,
          qty: 6,
          wheelchair: true
        }
      ],
      aiFaqs: [
        {
          id: 'shelter',
          question: 'சக்கர நாற்காலி வசதியுள்ள அருகிலுள்ள முகாம் எங்கே உள்ளது?',
          answer: 'இரத்தினபுரி மத்திய உயர்நில நிவாரண வளாகம் மற்றும் களுத்துறை மாவட்ட மகா வித்தியாலய முகாம் தற்போது திறந்துள்ளன. அங்கு சக்கர நாற்காலி சாய்வுதளம் மற்றும் மருத்துவ வசதி உள்ளது.'
        },
        {
          id: 'medicine',
          question: 'அவசர இன்சுலின் அல்லது மருந்துகளை எவ்வாறு பெறுவது?',
          answer: '"மருந்து மற்றும் முதலுதவி" என்பதைத் தேர்ந்தெடுத்து "உயிர் ஆபத்து" எனக் குறிப்பிடவும். எமது AI அமைப்பு இரத்தினபுரி குளிரூட்டப்பட்ட மருந்து கிடங்கிலிருந்து உடனடியாக அனுப்ப முன்னுரிமை அளிக்கும்.'
        },
        {
          id: 'rescue',
          question: 'வீட்டைச் சுற்றி வெள்ள நீர் உயர்கிறது. நாங்கள் என்ன செய்ய வேண்டும்?',
          answer: 'உடனடியாக மேல் தளத்திற்குச் செல்லவும், பிரதான மின்சாரத்தை அணைக்கவும், உங்கள் இருப்பிடத்துடன் "படகு மீட்பு" கோரிக்கையை அனுப்பவும்.'
        },
        {
          id: 'triage',
          question: 'எனது கோரிக்கையை யார் பரிசீலிப்பார்கள்?',
          answer: 'AI அமைப்பு அவசர நிலையின் அடிப்படையில் (0–100) மதிப்பெண் வழங்கும், மேலும் அதிகாரப்பூர்வ அதிகாரி அதைச் சரிபார்த்து உதவியை அனுப்புவார்.'
        }
      ]
    },
    smsNotification: {
      title: 'பன்மொழி SMS எச்சரிக்கை & நகல் தடுப்பு சோதனை',
      subtitle: 'தேர்ந்தெடுத்த மொழியில் அவசர SMS செய்தியை உருவாக்கி அனுப்பவும்.',
      languageSelectLabel: 'செய்தி மொழி',
      subject: 'அவசர வெளியேற்ற அறிவிப்பு (Emergency Evacuation)',
      body: 'உடனடியாக இரத்தினபுரி மத்திய பாதுகாப்பு வளாகத்திற்குச் செல்லவும். மருத்துவம் மற்றும் உணவு உதவிகள் தயாராக உள்ளன.',
      sendBtn: 'தமிழ் சோதனை SMS அனுப்பு'
    }
  },

  es: {
    dir: 'ltr',
    appSubtitle: 'Sistema de Coordinación de Emergencias y Ayuda Humanitaria',
    activeCrisisBadge: 'Respuesta a Inundaciones Kalu Ganga',
    switchRole: 'Cambiar Rol',
    signOut: 'Salir',
    lightMode: 'Claro',
    darkMode: 'Oscuro',
    yourRoleLabel: 'Su Rol',
    currentTabLabel: 'Pestaña Actual',
    languageLabel: 'Idioma',
    nav: {
      dashboard: 'Resumen y Casos',
      citizen: 'Solicitar Ayuda y Mi Estado',
      aiGovernance: 'Prioridad IA y Pronóstico',
      logistics: 'Suministros y Despacho',
      shelters: 'Refugios de Evacuación',
      volunteers: 'Voluntarios y Equipos',
      donations: 'Campañas de Donación',
      mapResilience: 'Mapa en Vivo y Salud del Sistema'
    },
    dashboard: {
      briefingBadge: 'Boletín Oficial Multilingüe de Crisis',
      briefingHeading: 'Informe de Crisis',
      safetyAdviceBadge: 'Aviso de Seguridad',
      openRequests: 'Casos Abiertos',
      criticalUrgency: 'Urgencia Crítica',
      avgResponseTime: 'Tiempo Respuesta Prom.',
      underGoal: '✓ Bajo meta de 30 min',
      suppliesDispatched: 'Suministros Enviados',
      shelterCapacity: 'Capacidad de Refugios',
      spacesFilled: 'plazas ocupadas',
      staffAiReviews: 'Revisiones Humanas IA',
      aiScoresReviewed: 'puntajes IA auditados',
      duplicatesCaught: 'Duplicados Detectados',
      duplicateSmsBlocked: 'SMS duplicados bloqueados',
      queueBadge: 'Cola de Solicitudes de Ayuda Ciudadana',
      queueTitleManage: 'Revisar, Verificar y Priorizar Solicitudes de Emergencia',
      queueTitleView: 'Solicitudes Activas de Asistencia Comunitaria',
      queueSub: 'Cada tarjeta muestra el Puntaje de Prioridad IA (de 100) y botones rápidos para verificar, escalar o fusionar duplicados.',
      searchPlaceholder: 'Buscar por código, ciudad o necesidad...',
      filterAll: 'Todos',
      filterCritical: 'Críticos',
      filterDuplicates: 'Duplicados',
      filterVerified: 'Verificados',
      verifyBtn: 'Verificar Caso',
      escalateBtn: 'Escalar Urgente',
      closeBtn: 'Cerrar Caso',
      rejectBtn: 'Rechazar Caso',
      mergeBtn: 'Fusionar Duplicado',
      reviewAiBtn: 'Revisar IA',
      peopleAffected: 'personas afectadas',
      unitsNeeded: 'unidades requeridas',
      possibleDuplicate: 'Posible Solicitud Duplicada'
    },
    citizen: {
      portalTitle: 'Portal Ciudadano de Ayuda y Asistencia Multilingüe con IA',
      portalSubtitle: 'Envíe solicitudes de emergencia en español, reciba asistencia automatizada por IA y rastree sus entregas.',
      tabAll: 'Todas las Herramientas',
      tabRequest: '1. Solicitar Ayuda',
      tabAiSupport: '2. Asistente IA en Español',
      tabTrack: '3. Mis Solicitudes',
      tabFamily: '4. Perfil Familiar',
      tabShelters: '5. Refugios y Alertas',
      formBadge: 'Solicitud de Emergencia (Español)',
      formTitle: 'Solicitar Asistencia Humanitaria Inmediata',
      quickTemplatePrompt: '¿Tiene prisa? Haga clic en una plantilla rápida para rellenar en español:',
      step1Category: '1. ¿Qué tipo de ayuda necesita?',
      step2Urgency: '2. ¿Qué tan urgente es su situación?',
      step3Summary: '3. Resumen breve de lo que necesita *',
      step3Placeholder: 'Ej.: Necesito insulina y raciones de comida para 6 personas',
      step4Description: '4. Explique su situación (Nivel del agua, necesidades médicas) *',
      step4Placeholder: 'Indique condiciones médicas, niños/ancianos o carreteras bloqueadas...',
      step5Location: '5. Su Ubicación (Elija una localidad o escriba su dirección)',
      locationPlaceholder: 'Dirección, pueblo o punto de referencia más cercano',
      peopleCountLabel: 'Personas Afectadas',
      quantityLabel: 'Cantidad Necesaria',
      photoLabel: 'Foto / Nota Médica (Opcional)',
      wheelchairCheckbox: 'Alguien en mi familia necesita evacuación accesible en silla de ruedas',
      submitRequestBtn: 'Enviar Solicitud de Emergencia',
      familyBadge: 'Datos Familiares Guardados',
      familyTitle: 'Mi Familia y Perfil Médico',
      headNameLabel: 'Nombre del Jefe de Hogar',
      totalMembersLabel: 'Total Miembros',
      childrenLabel: 'Niños',
      elderlyLabel: 'Adultos Mayores (65+)',
      medicalNotesLabel: 'Necesidades Médicas o Dietéticas',
      mobilityCheckbox: 'Requiere Silla de Ruedas / Apoyo de Movilidad',
      chronicCheckbox: 'Condición Médica Crónica (Insulina, Oxígeno)',
      saveFamilyBtn: 'Guardar Perfil Familiar',
      alertsTitle: 'Alertas Oficiales de Inundación y Consejos de Seguridad',
      safetyWhatToDo: 'Qué hacer:',
      alertHeadline: 'Alerta Máxima de Inundación en la Cuenca de Kalu Ganga — Ratnapura y Kalutara',
      alertBody: 'Las fuertes lluvias monzónicas han elevado el nivel del agua en zonas bajas y cortado accesos viales.',
      alertGuidance: 'Diríjase de inmediato a los refugios verificados en tierras altas. Lleve medicamentos esenciales y agua potable.',
      sheltersTitle: 'Refugios de Evacuación Abiertos Cerca de Usted',
      spacesOpen: 'plazas libres',
      trackerBadge: 'Seguimiento de Ayuda en Vivo',
      trackerTitle: 'Mis Solicitudes Enviadas y Calificación de Entrega',
      rateDeliveryBtn: 'Calificar Entrega',
      feedbackTitle: 'Confirmar Recepción de Ayuda y Calificar',
      ratingLabel: 'Su Calificación (1 a 5 Estrellas)',
      commentsLabel: 'Comentarios para el Equipo de Socorro',
      submitFeedbackBtn: 'Enviar Calificación',
      aiAssistantBadge: 'Coursework 1.1.A • Asistencia Automatizada Multilingüe IA',
      aiAssistantTitle: 'Centro de Soporte Humanitario IA y Comunicación en Español',
      aiAssistantSubtitle: 'Reciba instrucciones de seguridad, ubicación de refugios y guía de emergencia en su idioma.',
      aiAskPlaceholder: 'Haga una pregunta (ej.: ¿Dónde hay un refugio con rampa? ¿Cómo pido insulina?)...',
      aiAskBtn: 'Consultar a la IA',
      aiOfficialBriefingTitle: 'Transmisión Oficial Multilingüe de Crisis',
      categories: {
        Medicine: 'Medicina y Primeros Auxilios',
        Food: 'Alimentos y Raciones Secas',
        WaterAndSanitation: 'Agua Potable Limpia',
        TemporaryShelter: 'Refugio Seguro',
        SearchAndRescue: 'Rescate en Bote / Evacuación',
        AccessibilityAssistance: 'Silla de Ruedas / Accesibilidad',
        Transportation: 'Transporte de Emergencia'
      },
      urgencies: {
        Low: { label: 'Baja', desc: 'Puede esperar 24h+' },
        Medium: { label: 'Media', desc: 'Necesario hoy' },
        High: { label: 'Alta', desc: 'Urgente' },
        Critical: { label: 'Crítica', desc: 'Muy urgente' },
        LifeThreatening: { label: 'Peligro de Vida', desc: 'Peligro inmediato' }
      },
      templates: [
        {
          label: '💊 Insulina / Medicina Urgente',
          category: 'Medicine',
          urgency: 'LifeThreatening',
          title: 'Se necesita insulina refrigerada y suministros médicos urgentes',
          description: 'Las inundaciones bloquearon el acceso vial. Un familiar diabético de edad avanzada necesita insulina con urgencia.',
          people: 6,
          qty: 10,
          wheelchair: true
        },
        {
          label: '🍲 Alimentos y Agua Familiar',
          category: 'Food',
          urgency: 'High',
          title: 'Raciones secas y agua potable para familia aislada',
          description: 'La planta baja está inundada. Necesitamos paquetes de alimentos secos y agua potable para niños y adultos.',
          people: 5,
          qty: 15,
          wheelchair: false
        },
        {
          label: '🚣 Rescate en Bote / Evacuación',
          category: 'SearchAndRescue',
          urgency: 'LifeThreatening',
          title: 'Evacuación inmediata en bote por subida rápida del agua',
          description: 'El nivel del agua sube rápidamente. La familia espera en el piso superior y necesita transporte seguro a tierras altas.',
          people: 4,
          qty: 1,
          wheelchair: true
        },
        {
          label: '♿ Refugio para Silla de Ruedas',
          category: 'TemporaryShelter',
          urgency: 'Critical',
          title: 'Espacio en refugio accesible para silla de ruedas',
          description: 'Evacuando zona inundada con un familiar mayor en silla de ruedas. Necesitamos refugio accesible con asistencia médica.',
          people: 6,
          qty: 6,
          wheelchair: true
        }
      ],
      aiFaqs: [
        {
          id: 'shelter',
          question: '¿Dónde está el refugio accesible en silla de ruedas más cercano?',
          answer: 'El Complejo de Refugio Alto de Ratnapura Central y el Refugio Maha Vidyalaya de Kalutara están abiertos ahora con rampas para sillas de ruedas, unidad médica y agua potable.'
        },
        {
          id: 'medicine',
          question: '¿Cómo solicito insulina urgente o medicamentos refrigerados?',
          answer: 'Seleccione "Medicina y Primeros Auxilios" y urgencia "Peligro de Vida". Nuestro motor IA prioriza automáticamente medicamentos de cadena de frío desde el Depósito Médico de Ratnapura.'
        },
        {
          id: 'rescue',
          question: 'El agua está subiendo en nuestra casa. ¿Qué debemos hacer?',
          answer: 'Suba de inmediato al piso más alto, desconecte la electricidad principal y envíe una solicitud de "Rescate en Bote" indicando su localidad.'
        },
        {
          id: 'triage',
          question: '¿Quién revisa mi solicitud de emergencia?',
          answer: 'La IA calcula un puntaje inicial (0–100) según la urgencia y vulnerabilidad, y un Coordinador humano autorizado verifica y despacha la ayuda.'
        }
      ]
    },
    smsNotification: {
      title: 'Generador Multilingüe de Alertas SMS y Prueba Anti-Duplicados',
      subtitle: 'Seleccione un idioma para generar un SMS de emergencia. Enviar dos veces con el mismo ID bloquea textos duplicados.',
      languageSelectLabel: 'Idioma de la Notificación',
      subject: 'Aviso de Evacuación de Emergencia',
      body: 'Diríjase de inmediato al Complejo de Refugio Alto de Ratnapura Central. Ayuda médica y alimentaria disponible.',
      sendBtn: 'Enviar SMS de Prueba en Español'
    }
  },

  fr: {
    dir: 'ltr',
    appSubtitle: "Système de Coordination d'Aide Humanitaire et d'Urgence",
    activeCrisisBadge: 'Réponse aux Inondations Kalu Ganga',
    switchRole: 'Changer de Rôle',
    signOut: 'Déconnexion',
    lightMode: 'Clair',
    darkMode: 'Sombre',
    yourRoleLabel: 'Votre Rôle',
    currentTabLabel: 'Onglet Actuel',
    languageLabel: 'Langue',
    nav: {
      dashboard: 'Vue Globale et Cas',
      citizen: "Demander de l'Aide",
      aiGovernance: 'Priorité IA et Prévisions',
      logistics: 'Stocks et Expédition',
      shelters: "Centres d'Hébergement",
      volunteers: 'Bénévoles et Équipes',
      donations: 'Campagnes de Dons',
      mapResilience: 'Carte Live et Résilience'
    },
    dashboard: {
      briefingBadge: 'Bulletin Officiel Multilingue de Crise',
      briefingHeading: 'Bulletin de Crise',
      safetyAdviceBadge: 'Consignes de Sécurité',
      openRequests: 'Demandes Ouvertes',
      criticalUrgency: 'Urgence Critique',
      avgResponseTime: 'Temps de Réponse Moy.',
      underGoal: '✓ Sous la cible de 30 min',
      suppliesDispatched: 'Secours Expédiés',
      shelterCapacity: "Capacité d'Accueil",
      spacesFilled: 'places occupées',
      staffAiReviews: 'Révisions Humaines IA',
      aiScoresReviewed: 'scores IA vérifiés',
      duplicatesCaught: 'Doublons Détectés',
      duplicateSmsBlocked: 'SMS en double bloqués',
      queueBadge: "File d'Attente des Demandes Citoyennes",
      queueTitleManage: "Vérifier, Prioriser et Coordonner les Demandes d'Aide",
      queueTitleView: "Demandes d'Assistance Communautaire Actives",
      queueSub: "Chaque carte affiche le Score de Priorité IA (sur 100) et des boutons rapides pour vérifier, escalader ou fusionner les doublons.",
      searchPlaceholder: 'Rechercher par code, ville ou besoin...',
      filterAll: 'Tous',
      filterCritical: 'Critiques',
      filterDuplicates: 'Doublons',
      filterVerified: 'Vérifiés',
      verifyBtn: 'Vérifier',
      escalateBtn: 'Escalader',
      closeBtn: 'Clôturer',
      rejectBtn: 'Rejeter',
      mergeBtn: 'Fusionner Doublon',
      reviewAiBtn: 'Réviser Score IA',
      peopleAffected: 'personnes touchées',
      unitsNeeded: 'unités requises',
      possibleDuplicate: 'Doublon Potentiel Détecté'
    },
    citizen: {
      portalTitle: "Portail Citoyen d'Aide d'Urgence et d'Assistance IA Multilingue",
      portalSubtitle: "Soumettez vos demandes d'aide en français, recevez des conseils de sécurité automatisés par l'IA et suivez vos livraisons.",
      tabAll: 'Tous les Outils',
      tabRequest: "1. Demander de l'Aide",
      tabAiSupport: '2. Assistance IA en Français',
      tabTrack: '3. Mes Demandes',
      tabFamily: '4. Profil Familial',
      tabShelters: '5. Abris et Alertes',
      formBadge: "Demande d'Urgence (Français)",
      formTitle: 'Demander une Aide Humanitaire Immédiate',
      quickTemplatePrompt: 'Pressé(e) ? Cliquez sur un modèle rapide pour remplir le formulaire en français :',
      step1Category: "1. De quel type d'aide avez-vous besoin ?",
      step2Urgency: '2. Quel est le degré d’urgence ?',
      step3Summary: '3. Résumé court de votre besoin *',
      step3Placeholder: 'Ex. : Besoin d’insuline et de rations alimentaires pour 6 personnes',
      step4Description: "4. Décrivez votre situation (Niveau d'eau, besoins médicaux) *",
      step4Placeholder: 'Précisez les besoins médicaux, enfants/personnes âgées ou routes coupées...',
      step5Location: '5. Votre Localisation (Choisissez une ville ou tapez votre adresse)',
      locationPlaceholder: 'Votre adresse, village ou point de repère proche',
      peopleCountLabel: 'Personnes Touchées',
      quantityLabel: 'Quantité Requise',
      photoLabel: 'Photo / Note Médicale (Optionnel)',
      wheelchairCheckbox: "Un membre de ma famille a besoin d'une évacuation accessible en fauteuil roulant",
      submitRequestBtn: "Envoyer la Demande d'Urgence",
      familyBadge: 'Dossier Familial Enregistré',
      familyTitle: 'Ma Famille et Profil Médical',
      headNameLabel: 'Nom du Chef de Foyer',
      totalMembersLabel: 'Membres au Total',
      childrenLabel: 'Enfants',
      elderlyLabel: 'Personnes Âgées (65+)',
      medicalNotesLabel: 'Besoins Médicaux ou Alimentaires',
      mobilityCheckbox: 'Fauteuil Roulant / Aide à la Mobilité Requise',
      chronicCheckbox: 'Maladie Chronique (Insuline, Oxygène, Dialyse)',
      saveFamilyBtn: 'Enregistrer le Profil Familial',
      alertsTitle: "Alertes Officielles d'Inondation et Consignes de Sécurité",
      safetyWhatToDo: 'Que faire :',
      alertHeadline: 'Alerte Inondation Majeure Bassin de Kalu Ganga — Ratnapura et Kalutara',
      alertBody: "Les fortes pluies de mousson ont provoqué la montée des eaux et coupé plusieurs routes basses.",
      alertGuidance: "Rejoignez immédiatement les centres d'hébergement vérifiés en hauteur avec vos médicaments essentiels.",
      sheltersTitle: "Centres d'Hébergement Ouverts à Proximité",
      spacesOpen: 'places disponibles',
      trackerBadge: 'Suivi des Secours en Direct',
      trackerTitle: 'Mes Demandes Soumises et Évaluation des Livraisons',
      rateDeliveryBtn: 'Évaluer la Livraison',
      feedbackTitle: "Confirmer la Réception de l'Aide et Noter",
      ratingLabel: 'Votre Note (1 à 5 Étoiles)',
      commentsLabel: "Commentaires pour l'Équipe de Secours",
      submitFeedbackBtn: "Envoyer l'Évaluation",
      aiAssistantBadge: 'Coursework 1.1.A • Assistance Automatisée Multilingue IA',
      aiAssistantTitle: 'Centre de Support Humanitaire IA et Communication en Français',
      aiAssistantSubtitle: "Recevez des consignes de sécurité, l'emplacement des abris et une assistance d'urgence dans votre langue.",
      aiAskPlaceholder: 'Posez une question (ex. : Où se trouve un abri accessible ? Comment obtenir de l’insuline ?)...',
      aiAskBtn: "Demander à l'IA",
      aiOfficialBriefingTitle: 'Diffusion Officielle Multilingue de Crise',
      categories: {
        Medicine: 'Médicaments et Premiers Secours',
        Food: 'Nourriture et Rations Sèches',
        WaterAndSanitation: 'Eau Potable Propre',
        TemporaryShelter: "Abri d'Urgence",
        SearchAndRescue: 'Sauvetage en Bateau / Évacuation',
        AccessibilityAssistance: 'Fauteuil Roulant / Accessibilité',
        Transportation: "Transport d'Urgence"
      },
      urgencies: {
        Low: { label: 'Faible', desc: 'Peut attendre 24h+' },
        Medium: { label: 'Moyenne', desc: "Requis aujourd'hui" },
        High: { label: 'Élevée', desc: 'Besoin urgent' },
        Critical: { label: 'Critique', desc: 'Très urgent' },
        LifeThreatening: { label: 'Danger de Mort', desc: 'Danger immédiat' }
      },
      templates: [
        {
          label: '💊 Insuline / Médicaments Urgents',
          category: 'Medicine',
          urgency: 'LifeThreatening',
          title: 'Besoin urgent d’insuline réfrigérée et de fournitures médicales',
          description: "Les inondations ont coupé l'accès routier. Un parent âgé diabétique a un besoin vital d'insuline.",
          people: 6,
          qty: 10,
          wheelchair: true
        },
        {
          label: '🍲 Nourriture et Eau Potable',
          category: 'Food',
          urgency: 'High',
          title: 'Rations alimentaires et eau potable pour famille isolée',
          description: "Le rez-de-chaussée est inondé. Besoin de colis alimentaires secs et d'eau potable pour enfants et adultes.",
          people: 5,
          qty: 15,
          wheelchair: false
        },
        {
          label: '🚣 Sauvetage en Bateau',
          category: 'SearchAndRescue',
          urgency: 'LifeThreatening',
          title: 'Évacuation immédiate en bateau suite à la montée des eaux',
          description: "Le niveau de l'eau monte rapidement. La famille attend à l'étage supérieur et a besoin d'une évacuation sûre.",
          people: 4,
          qty: 1,
          wheelchair: true
        },
        {
          label: '♿ Abri Fauteuil Roulant',
          category: 'TemporaryShelter',
          urgency: 'Critical',
          title: 'Place en centre d’hébergement accessible en fauteuil roulant',
          description: 'Évacuation avec un proche âgé en fauteuil roulant. Besoin d’un abri accessible au rez-de-chaussée.',
          people: 6,
          qty: 6,
          wheelchair: true
        }
      ],
      aiFaqs: [
        {
          id: 'shelter',
          question: 'Où se trouve le centre d’hébergement accessible en fauteuil roulant le plus proche ?',
          answer: 'Le Complexe de Secours de Ratnapura Central et le Centre Maha Vidyalaya de Kalutara sont ouverts avec rampes d’accès, unité médicale et eau potable.'
        },
        {
          id: 'medicine',
          question: 'Comment obtenir de l’insuline urgente ou des médicaments réfrigérés ?',
          answer: 'Sélectionnez « Médicaments et Premiers Secours » et l’urgence « Danger de Mort ». Notre moteur IA priorise immédiatement l’expédition depuis le Dépôt Médical Frigorifique de Ratnapura.'
        },
        {
          id: 'rescue',
          question: 'L’eau monte autour de notre maison. Que devons-nous faire ?',
          answer: 'Montez immédiatement à l’étage supérieur, coupez le courant électrique principal et envoyez une demande « Sauvetage en Bateau » avec votre localisation.'
        },
        {
          id: 'triage',
          question: 'Qui examine ma demande d’aide d’urgence ?',
          answer: 'L’IA calcule un score de priorité initial (0–100) et un coordinateur humain autorisé vérifie et valide chaque expédition de secours.'
        }
      ]
    },
    smsNotification: {
      title: 'Générateur Multilingue de SMS et Test Anti-Doublons',
      subtitle: "Choisissez une langue pour générer un SMS d'urgence. L'envoi répété avec le même ID bloque les doublons.",
      languageSelectLabel: 'Langue de la Notification',
      subject: "Avis d'Évacuation d'Urgence",
      body: 'Veuillez rejoindre immédiatement le Complexe de Secours de Ratnapura Central. Aide médicale et vivres disponibles.',
      sendBtn: 'Envoyer un SMS de Test en Français'
    }
  },

  ar: {
    dir: 'rtl',
    appSubtitle: 'نظام تنسيق المساعدات الإنسانية والاستجابة للطوارئ',
    activeCrisisBadge: 'استجابة فيضانات كالو غانغا',
    switchRole: 'تبديل الدور',
    signOut: 'تسجيل الخروج',
    lightMode: 'الوضع النهاري',
    darkMode: 'الوضع الداكن',
    yourRoleLabel: 'دورك الحالي',
    currentTabLabel: 'القسم الحالي',
    languageLabel: 'اللغة',
    nav: {
      dashboard: 'نظرة عامة والحالات',
      citizen: 'طلب مساعدة ومتابعة حالتي',
      aiGovernance: 'أولويات الذكاء الاصطناعي والتوقعات',
      logistics: 'الإمدادات والتوزيع',
      shelters: 'مراكز الإيواء الآمنة',
      volunteers: 'المتطوعون والفرق الميدانية',
      donations: 'حملات الإغاثة والتبرعات',
      mapResilience: 'الخريطة الحية ومرونة النظام'
    },
    dashboard: {
      briefingBadge: 'الموجز الرسمي متعدد اللغات للأزمة',
      briefingHeading: 'موجز عمليات الأزمة',
      safetyAdviceBadge: 'إرشادات السلامة',
      openRequests: 'الطلبات المفتوحة',
      criticalUrgency: 'حالات حرجة للغاية',
      avgResponseTime: 'متوسط وقت الاستجابة',
      underGoal: '✓ أقل من هدف 30 دقيقة',
      suppliesDispatched: 'الإمدادات المرسلة',
      shelterCapacity: 'سعة مراكز الإيواء',
      spacesFilled: 'أماكن مشغولة',
      staffAiReviews: 'مراجعات الموظفين للذكاء الاصطناعي',
      aiScoresReviewed: 'تقييمات تمت مراجعتها',
      duplicatesCaught: 'الطلبات المكررة المكتشفة',
      duplicateSmsBlocked: 'رسائل مكررة تم حظرها',
      queueBadge: 'قائمة طلبات المساعدة الإنسانية',
      queueTitleManage: 'مراجعة الطلبات الطارئة والتحقق منها وتحديد أولوياتها',
      queueTitleView: 'طلبات المساعدة المجتمعية النشطة',
      queueSub: 'تعرض كل بطاقة درجة الأولوية من الذكاء الاصطناعي (من 100) وأزرار التحقق أو التصعيد أو دمج الطلبات المكررة.',
      searchPlaceholder: 'ابحث بالرمز أو المدينة أو نوع الحاجة...',
      filterAll: 'الكل',
      filterCritical: 'حرجة',
      filterDuplicates: 'مكررة',
      filterVerified: 'تم التحقق',
      verifyBtn: 'تأكيد الطلب',
      escalateBtn: 'تصعيد عاجل',
      closeBtn: 'إغلاق الحالة',
      rejectBtn: 'رفض الحالة',
      mergeBtn: 'دمج المكرر',
      reviewAiBtn: 'مراجعة تقييم الذكاء الاصطناعي',
      peopleAffected: 'أشخاص متضررون',
      unitsNeeded: 'وحدات مطلوبة',
      possibleDuplicate: 'طلب مكرر محتمل'
    },
    citizen: {
      portalTitle: 'بوابة مساعدة المواطنين والدعم الذكي متعدد اللغات',
      portalSubtitle: 'قدّم طلبات الإغاثة الطارئة باللغة العربية، واحصل على إرشادات سلامة فورية من الذكاء الاصطناعي، وتابع وصول المساعدات.',
      tabAll: 'عرض جميع الأدوات',
      tabRequest: '1. طلب مساعدة عاجلة',
      tabAiSupport: '2. المساعد الذكي بالعربية',
      tabTrack: '3. طلباتي السابقة',
      tabFamily: '4. ملف الأسرة الطبي',
      tabShelters: '5. الملاجئ والتحذيرات',
      formBadge: 'استمارة طوارئ متعددة اللغات (العربية)',
      formTitle: 'طلب مساعدة إنسانية فورية',
      quickTemplatePrompt: 'في حالة طارئة؟ انقر على قالب سريع لملء النموذج باللغة العربية فوراً:',
      step1Category: '1. ما نوع المساعدة التي تحتاجها؟',
      step2Urgency: '2. ما مدى خطورة الوضع؟',
      step3Summary: '3. ملخص قصير لما تحتاجه *',
      step3Placeholder: 'مثال: نحتاج إلى إنسولين وحصص غذائية جافة لأسرة من 6 أفراد',
      step4Description: '4. اشرح وضعك بالتفصيل (مستوى المياه، الحالات الطبية، الطرق المغلقة) *',
      step4Placeholder: 'اذكر أي حالات طبية أو أطفال أو كبار سن أو عوائق في الطريق...',
      step5Location: '5. موقعك (اختر المدينة أو اكتب العنوان)',
      locationPlaceholder: 'عنوان الشارع أو القرية أو أقرب معلم',
      peopleCountLabel: 'عدد الأفراد المتضررين',
      quantityLabel: 'الكمية المطلوبة',
      photoLabel: 'صورة أو تقرير طبي (اختياري)',
      wheelchairCheckbox: 'يوجد فرد في الأسرة يحتاج إلى كرسي متحرك أو دعم إخلاء لذوي الإعاقة',
      submitRequestBtn: 'إرسال طلب المساعدة الطارئة',
      familyBadge: 'بيانات الأسرة المحفوظة',
      familyTitle: 'ملف أسرتي والاحتياجات الطبية',
      headNameLabel: 'اسم رب الأسرة',
      totalMembersLabel: 'إجمالي الأفراد',
      childrenLabel: 'الأطفال',
      elderlyLabel: 'كبار السن (+65)',
      medicalNotesLabel: 'ملاحظات طبية أو غذائية هامة',
      mobilityCheckbox: 'مطلوب كرسي متحرك / دعم حركي',
      chronicCheckbox: 'حالة طبية مزمنة (إنسولين، أكسجين، غسيل كلى)',
      saveFamilyBtn: 'حفظ ملف الأسرة',
      alertsTitle: 'تحذيرات الفيضانات الرسمية وإرشادات السلامة',
      safetyWhatToDo: 'الإجراء المطلوب:',
      alertHeadline: 'تحذير عاجل من فيضانات شديدة في حوض كالو غانغا — راتنابورا وكالوتارا',
      alertBody: 'أدت الأمطار الموسمية الغزيرة إلى ارتفاع منسوب المياه وإغلاق الطرق المنخفضة.',
      alertGuidance: 'توجه فوراً إلى مراكز الإيواء المعتمدة في المناطق المرتفعة مع الأدوية الضرورية ومياه الشرب.',
      sheltersTitle: 'مراكز الإيواء المفتوحة بالقرب منك',
      spacesOpen: 'أماكن شاغرة',
      trackerBadge: 'متابعة حالة المساعدات مباشرة',
      trackerTitle: 'طلباتي المقدمة وتقييم استلام المعونة',
      rateDeliveryBtn: 'تقييم التسليم',
      feedbackTitle: 'تأكيد استلام المساعدة وتقييم الخدمة',
      ratingLabel: 'تقييمك (من 1 إلى 5 نجوم)',
      commentsLabel: 'ملاحظاتك لفريق الإغاثة',
      submitFeedbackBtn: 'إرسال التقييم',
      aiAssistantBadge: 'Coursework 1.1.A • المساعد الذكي متعدد اللغات',
      aiAssistantTitle: 'مركز الدعم الإنساني الذكي والتواصل باللغة العربية',
      aiAssistantSubtitle: 'احصل على تعليمات السلامة الفورية، ومواقع الملاجئ، وإرشادات الطوارئ بلغتك.',
      aiAskPlaceholder: 'اطرح سؤالاً (مثال: أين أقرب ملجأ مجهز للكراسي المتحركة؟ كيف أطلب الإنسولين؟)...',
      aiAskBtn: 'اسأل المساعد الذكي',
      aiOfficialBriefingTitle: 'البث الرسمي متعدد اللغات للأزمة',
      categories: {
        Medicine: 'الأدوية والإسعافات الأولية',
        Food: 'الغذاء والحصص الجافة',
        WaterAndSanitation: 'مياه شرب نظيفة',
        TemporaryShelter: 'مأوى آمن مؤقت',
        SearchAndRescue: 'إنقاذ بالقوارب / إخلاء',
        AccessibilityAssistance: 'كرسي متحرك / دعم ذوي الإعاقة',
        Transportation: 'نقل طارئ'
      },
      urgencies: {
        Low: { label: 'منخفضة', desc: 'يمكن الانتظار +24 ساعة' },
        Medium: { label: 'متوسطة', desc: 'مطلوب اليوم' },
        High: { label: 'عالية', desc: 'حاجة عاجلة' },
        Critical: { label: 'حرجة', desc: 'عاجل جداً' },
        LifeThreatening: { label: 'تهديد للحياة', desc: 'خطر فوري' }
      },
      templates: [
        {
          label: '💊 إنسولين / أدوية عاجلة',
          category: 'Medicine',
          urgency: 'LifeThreatening',
          title: 'حاجة ماسة إلى إنسولين مبرد ومستلزمات طبية عاجلة',
          description: 'قطعت مياه الفيضانات الطريق. أحد كبار السن المصابين بالسكري يحتاج إلى الإنسولين والأدوية اليومية بشكل عاجل.',
          people: 6,
          qty: 10,
          wheelchair: true
        },
        {
          label: '🍲 غذاء ومياه شرب للأسرة',
          category: 'Food',
          urgency: 'High',
          title: 'حصص غذائية جافة ومياه شرب لأسرة محاصرة',
          description: 'الطابق الأرضي مغمور بالمياه. نحتاج إلى طرود غذائية جافة ومياه شرب نظيفة للأطفال والكبار.',
          people: 5,
          qty: 15,
          wheelchair: false
        },
        {
          label: '🚣 إنقاذ وإخلاء بالقارب',
          category: 'SearchAndRescue',
          urgency: 'LifeThreatening',
          title: 'مطلوب إخلاء فوري بالقارب بسبب ارتفاع منسوب المياه',
          description: 'يرتفع مستوى المياه بسرعة حول منزلنا. الأسرة تنتظر في الطابق العلوي وتحتاج إلى نقل آمن لأرض مرتفعة.',
          people: 4,
          qty: 1,
          wheelchair: true
        },
        {
          label: '♿ مأوى مجهز للكراسي المتحركة',
          category: 'TemporaryShelter',
          urgency: 'Critical',
          title: 'حاجة إلى مكان في ملجأ مجهز للكراسي المتحركة',
          description: 'نخلي منطقة الفيضان مع قريب مسن يستخدم كرسياً متحركاً ونحتاج إلى مركز إيواء مجهز في الطابق الأرضي.',
          people: 6,
          qty: 6,
          wheelchair: true
        }
      ],
      aiFaqs: [
        {
          id: 'shelter',
          question: 'أين يقع أقرب مركز إيواء مجهز للكراسي المتحركة؟',
          answer: 'مجمع الإغاثة المرتفع في راتنابورا الوسطى وملجأ ماها فيديالايا في كالوتارا مفتوحان الآن ومجهزان بمنحدرات للكراسي المتحركة ووحدة طبية ومياه نظيفة.'
        },
        {
          id: 'medicine',
          question: 'كيف أحصل على إنسولين عاجل أو أدوية مبردة؟',
          answer: 'اختر "الأدوية والإسعافات الأولية" وحدد الخطورة "تهديد للحياة". يقوم نظام الذكاء الاصطناعي فوراً بإعطاء أولوية قصوى لإرسال الأدوية المبردة من مستودع راتنابورا الطبي.'
        },
        {
          id: 'rescue',
          question: 'المياه ترتفع حول منزلنا. ماذا يجب أن نفعل؟',
          answer: 'انتقلوا فوراً إلى الطابق العلوي، وافصلوا التيار الكهربائي الرئيسي، وأرسلوا طلب "إنقاذ بالقوارب" مع تحديد موقعكم.'
        },
        {
          id: 'triage',
          question: 'من يقوم بمراجعة طلب المساعدة الطارئة الخاص بي؟',
          answer: 'يحسب الذكاء الاصطناعي درجة أولوية مبدئية (0–100) بناءً على الخطورة، ثم يقوم منسق الطوارئ البشري المعتمد بالتحقق واعتماد إرسال المساعدات.'
        }
      ]
    },
    smsNotification: {
      title: 'مولد رسائل الطوارئ متعدد اللغات واختبار منع التكرار',
      subtitle: 'اختر اللغة لإنشاء رسالة طوارئ نصية. إرسال نفس المعرف مرتين يمنع تكرار الرسائل تلقائياً.',
      languageSelectLabel: 'لغة الرسالة النصية',
      subject: 'تنبيه إخلاء طارئ (Emergency Evacuation)',
      body: 'يرجى التوجه فوراً إلى مجمع الإغاثة المرتفع في راتنابورا الوسطى. تتوفر المساعدات الطبية والغذائية.',
      sendBtn: 'إرسال رسالة نصية تجريبية بالعربية'
    }
  }
};

export function generateAutomatedAiSupportReply(lang: SupportedLanguage, query: string): string {
  const q = query.toLowerCase();
  const bundle = TRANSLATIONS[lang];

  if (q.includes('insulin') || q.includes('med') || q.includes('ඉන්සියුලින්') || q.includes('ඖෂධ') || q.includes('மருந்து') || q.includes('இன்சுலின்') || q.includes('إنسولين') || q.includes('دواء') || q.includes('médic')) {
    return bundle.citizen.aiFaqs[1].answer;
  }
  if (q.includes('boat') || q.includes('water') || q.includes('rescue') || q.includes('බෝට්ටු') || q.includes('ජල') || q.includes('படகு') || q.includes('வெள்ள') || q.includes('bote') || q.includes('bateau') || q.includes('قارب') || q.includes('مياه')) {
    return bundle.citizen.aiFaqs[2].answer;
  }
  if (q.includes('score') || q.includes('ai') || q.includes('review') || q.includes('ලකුණු') || q.includes('மதிப்பெண்') || q.includes('puntaje') || q.includes('تقييم')) {
    return bundle.citizen.aiFaqs[3].answer;
  }
  return bundle.citizen.aiFaqs[0].answer;
}

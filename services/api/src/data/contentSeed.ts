import type { ContentAppKey, ContentBlockType, ContentLocale } from "@tasks-cash/types";

export interface ContentSeedRow {
  appKey: ContentAppKey;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  locale: ContentLocale;
  value: string;
}

const LOCALES: ContentLocale[] = ["en", "ar", "fr"];

function tri(
  appKey: ContentAppKey,
  pageKey: string,
  sectionKey: string,
  contentKey: string,
  type: ContentBlockType,
  en: string,
  ar: string,
  fr: string
): ContentSeedRow[] {
  return [
    { appKey, pageKey, sectionKey, contentKey, type, locale: "en", value: en },
    { appKey, pageKey, sectionKey, contentKey, type, locale: "ar", value: ar },
    { appKey, pageKey, sectionKey, contentKey, type, locale: "fr", value: fr },
  ];
}

/** Default CMS content — inserted by seed script only when missing */
export const CONTENT_SEED_ROWS: ContentSeedRow[] = [
  // ── Main App: Home ──
  ...tri("main", "home", "hero", "eyebrow", "label", "Premium AAA Game Universe", "عالم ألعاب AAA متميز", "Univers de jeu AAA premium"),
  ...tri("main", "home", "hero", "titleLine1", "title", "Enter The", "ادخل", "Entrez dans"),
  ...tri("main", "home", "hero", "titleLine2", "title", "Dimensional Portal", "البوابة الأبعادية", "le Portail Dimensionnel"),
  ...tri(
    "main",
    "home",
    "hero",
    "description",
    "description",
    "Complete epic missions. Earn legendary rewards. Ascend through infinite worlds. The first million explorers claim founder status.",
    "أكمل مهامًا أسطورية. اربح مكافآت أسطورية. تصاعد عبر عوالم لا نهائية. أول مليون مستكشف يحصلون على مكانة المؤسس.",
    "Accomplissez des missions épiques. Gagnez des récompenses légendaires. Montez à travers des mondes infinis. Le premier million d'explorateurs obtient le statut fondateur."
  ),
  ...tri("main", "home", "hero", "primaryButton", "button", "Start Your Journey", "ابدأ رحلتك", "Commencer votre aventure"),
  ...tri("main", "home", "hero", "secondaryButton", "button", "Explore Worlds", "استكشف العوالم", "Explorer les mondes"),
  ...tri("main", "home", "buttons", "enterPortal", "button", "Enter The Portal", "ادخل البوابة", "Entrer dans le portail"),
  ...tri("main", "home", "buttons", "login", "button", "Login", "تسجيل الدخول", "Connexion"),

  // ── Main App: Dashboard ──
  ...tri("main", "dashboard", "hero", "title", "title", "Explorer Command Center", "مركز قيادة المستكشف", "Centre de Commande Explorateur"),
  ...tri(
    "main",
    "dashboard",
    "hero",
    "subtitle",
    "subtitle",
    "Your RPG progression hub — currencies, levels, challenges, and secrets.",
    "مركز تقدمك في اللعب — العملات والمستويات والتحديات والأسرار.",
    "Votre hub de progression RPG — devises, niveaux, défis et secrets."
  ),
  ...tri("main", "dashboard", "hero", "badge", "badge", "Player Dashboard", "لوحة اللاعب", "Tableau de bord joueur"),
  ...tri("main", "dashboard", "cards", "currencyVault", "title", "Currency Vault", "خزنة العملات", "Coffre de devises"),
  ...tri("main", "dashboard", "cards", "playerLevels", "title", "Player Levels", "مستويات اللاعب", "Niveaux du joueur"),
  ...tri("main", "dashboard", "messages", "dailyReward", "label", "Daily Mystery Reward Ready", "مكافأة يومية غامضة جاهزة", "Récompense mystère quotidienne prête"),
  ...tri("main", "dashboard", "buttons", "claimDailyReward", "button", "Claim Daily Reward", "استلام المكافأة اليومية", "Réclamer la récompense quotidienne"),
  ...tri("main", "dashboard", "messages", "syncing", "label", "Syncing Command Center...", "مزامنة مركز القيادة...", "Synchronisation du centre de commande..."),

  // ── Main App: Login ──
  ...tri("main", "login", "hero", "title", "title", "Return to Portal", "العودة إلى البوابة", "Retour au portail"),
  ...tri("main", "login", "hero", "subtitle", "subtitle", "Authenticate to enter your command center", "صادق للدخول إلى مركز القيادة", "Authentifiez-vous pour entrer dans votre centre de commande"),
  ...tri("main", "login", "forms", "emailLabel", "label", "Email", "البريد الإلكتروني", "E-mail"),
  ...tri("main", "login", "forms", "passwordLabel", "label", "Password", "كلمة المرور", "Mot de passe"),
  ...tri("main", "login", "forms", "emailPlaceholder", "placeholder", "warrior@portal.io", "warrior@portal.io", "warrior@portal.io"),
  ...tri("main", "login", "buttons", "submit", "button", "Enter The Portal", "ادخل البوابة", "Entrer dans le portail"),
  ...tri("main", "login", "buttons", "submitLoading", "button", "Opening Portal...", "فتح البوابة...", "Ouverture du portail..."),
  ...tri("main", "login", "messages", "noAccount", "label", "No account?", "ليس لديك حساب؟", "Pas de compte ?"),
  ...tri("main", "login", "buttons", "createAccount", "button", "Create Account", "إنشاء حساب", "Créer un compte"),
  ...tri("main", "login", "buttons", "forgotPassword", "button", "Forgot password?", "نسيت كلمة المرور؟", "Mot de passe oublié ?"),
  ...tri("main", "login", "errors", "invalidCredentials", "error_message", "Invalid credentials", "بيانات اعتماد غير صالحة", "Identifiants invalides"),

  // ── Main App: Register ──
  ...tri("main", "register", "hero", "title", "title", "Join the Portal", "انضم إلى البوابة", "Rejoindre le portail"),
  ...tri("main", "register", "hero", "subtitle", "subtitle", "Create your explorer identity and enter the arena", "أنشئ هويتك كمستكشف وادخل الساحة", "Créez votre identité d'explorateur et entrez dans l'arène"),
  ...tri("main", "register", "forms", "usernameLabel", "label", "Username", "اسم المستخدم", "Nom d'utilisateur"),
  ...tri("main", "register", "forms", "emailLabel", "label", "Email", "البريد الإلكتروني", "E-mail"),
  ...tri("main", "register", "forms", "passwordLabel", "label", "Password", "كلمة المرور", "Mot de passe"),
  ...tri("main", "register", "forms", "referralLabel", "label", "Who invited you? / Invite code", "من دعاك؟ / رمز الدعوة", "Qui vous a invité ? / Code d'invitation"),
  ...tri("main", "register", "buttons", "submit", "button", "Create Account", "إنشاء حساب", "Créer un compte"),
  ...tri("main", "register", "buttons", "submitLoading", "button", "Creating Account...", "جاري إنشاء الحساب...", "Création du compte..."),
  ...tri("main", "register", "buttons", "exploreFirst", "button", "Explore Worlds First", "استكشف العوالم أولاً", "Explorer les mondes d'abord"),
  ...tri("main", "register", "messages", "hasAccount", "label", "Already a warrior?", "هل أنت محارب بالفعل؟", "Déjà un guerrier ?"),
  ...tri("main", "register", "buttons", "login", "button", "Login", "تسجيل الدخول", "Connexion"),

  // ── Main App: Profile / Settings / Wallet / Notifications ──
  ...tri("main", "profile", "hero", "title", "title", "Profile", "الملف الشخصي", "Profil"),
  ...tri("main", "profile", "hero", "subtitle", "subtitle", "Manage your explorer identity and stats.", "إدارة هويتك كمستكشف وإحصائياتك.", "Gérez votre identité d'explorateur et vos statistiques."),
  ...tri("main", "settings", "hero", "title", "title", "Settings", "الإعدادات", "Paramètres"),
  ...tri("main", "settings", "hero", "subtitle", "subtitle", "Configure your portal preferences and security.", "اضبط تفضيلات البوابة والأمان.", "Configurez vos préférences et la sécurité du portail."),
  ...tri("main", "wallet", "hero", "title", "title", "Wallet", "المحفظة", "Portefeuille"),
  ...tri("main", "wallet", "hero", "subtitle", "subtitle", "View balances, transactions, and currency exchange.", "عرض الأرصدة والمعاملات وصرف العملات.", "Consultez soldes, transactions et échange de devises."),
  ...tri("main", "notifications", "hero", "title", "title", "Notifications", "الإشعارات", "Notifications"),
  ...tri("main", "notifications", "hero", "subtitle", "subtitle", "Stay updated on missions, rewards, and portal alerts.", "ابقَ على اطلاع بالمهام والمكافآت وتنبيهات البوابة.", "Restez informé des missions, récompenses et alertes du portail."),
  ...tri("main", "notifications", "empty_states", "noAlerts", "empty_state", "No notifications yet.", "لا إشعارات بعد.", "Aucune notification pour le moment."),

  // ── Main App: Referrals ──
  ...tri("main", "referrals", "hero", "title", "title", "Referrals", "الإحالات", "Parrainages"),
  ...tri(
    "main",
    "referrals",
    "hero",
    "subtitle",
    "subtitle",
    "Invite allies, share your QR code, and earn referral rewards",
    "ادعُ الحلفاء، شارك رمز QR، واكسب مكافآت الإحالة",
    "Invitez des alliés, partagez votre QR code et gagnez des récompenses"
  ),

  // ── Challenge App: Home (Arena) ──
  ...tri("challenge", "home", "hero", "eyebrow", "label", "Challenge Arena", "ساحة التحديات", "Arène des défis"),
  ...tri("challenge", "home", "hero", "titleLine1", "title", "MYSTERY", "الغموض", "MYSTÈRE"),
  ...tri("challenge", "home", "hero", "titleLine2", "title", "CHALLENGES", "التحديات", "DÉFIS"),
  ...tri(
    "challenge",
    "home",
    "hero",
    "subtitle",
    "subtitle",
    "Join timed raids. Submit viral videos. Invite friends. Complete secret missions. Climb the rankings.",
    "انضم للغارات المحددة بوقت. أرسل فيديوهات فيروسية. ادعُ الأصدقاء. أكمل مهام سرية. تسلق التصنيفات.",
    "Rejoignez des raids chronométrés. Soumettez des vidéos virales. Invitez des amis. Accomplissez des missions secrètes. Grimpez au classement."
  ),
  ...tri("challenge", "home", "buttons", "enterArena", "button", "Enter The Arena", "ادخل الساحة", "Entrer dans l'arène"),

  // ── Challenge: Video Hunter ──
  ...tri("challenge", "video-hunter", "hero", "title", "title", "VIDEO HUNTER", "صياد الفيديو", "CHASSEUR VIDÉO"),
  ...tri(
    "challenge",
    "video-hunter",
    "hero",
    "subtitle",
    "subtitle",
    "Submit public video links, track review status, and earn coins and XP after approval.",
    "أرسل روابط فيديو عامة، تتبع حالة المراجعة، واكسب العملات ونقاط الخبرة بعد الموافقة.",
    "Soumettez des liens vidéo publics, suivez le statut de révision et gagnez des pièces et de l'XP après approbation."
  ),
  ...tri("challenge", "video-hunter", "hero", "eyebrow", "label", "Submit · Track · Earn", "أرسل · تتبع · اربح", "Soumettre · Suivre · Gagner"),
  ...tri("challenge", "video-hunter", "forms", "submitTitle", "title", "Submit New Video Link", "إرسال رابط فيديو جديد", "Soumettre un nouveau lien vidéo"),
  ...tri("challenge", "video-hunter", "buttons", "submitButton", "button", "Submit Video Link", "إرسال رابط الفيديو", "Soumettre le lien vidéo"),
  ...tri("challenge", "video-hunter", "table", "submissionsTitle", "title", "Your Submissions", "إرسالاتك", "Vos soumissions"),
  ...tri("challenge", "video-hunter", "empty_states", "noSubmissions", "empty_state", "No submissions yet.", "لا توجد إرسالات بعد.", "Aucune soumission pour le moment."),

  // ── Challenge: Referral Arena ──
  ...tri("challenge", "referral-arena", "hero", "title", "title", "Referral Arena", "ساحة الإحالة", "Arène de Parrainage"),
  ...tri(
    "challenge",
    "referral-arena",
    "hero",
    "subtitle",
    "subtitle",
    "Grow the portal network and earn rewards for every active ally you recruit.",
    "وسّع شبكة البوابة واكسب مكافآت لكل حليف نشط تجنده.",
    "Développez le réseau du portail et gagnez des récompenses pour chaque allié actif recruté."
  ),
  ...tri("challenge", "referral-arena", "cards", "yourCode", "label", "Your Referral Code", "رمز الإحالة الخاص بك", "Votre code de parrainage"),
  ...tri("challenge", "referral-arena", "buttons", "copyLink", "button", "Copy Referral Link", "نسخ رابط الإحالة", "Copier le lien de parrainage"),
  ...tri("challenge", "referral-arena", "empty_states", "noReferrals", "empty_state", "No referrals yet — share your invite link to begin.", "لا إحالات بعد — شارك رابط الدعوة للبدء.", "Aucun parrainage — partagez votre lien pour commencer."),

  // ── Challenge: Identity Challenge ──
  ...tri("challenge", "identity-challenge", "hero", "title", "title", "Identity Challenge", "تحدي الهوية", "Défi d'Identité"),
  ...tri(
    "challenge",
    "identity-challenge",
    "hero",
    "subtitle",
    "subtitle",
    "Answer portal questions to unlock classified missions and personalized rewards.",
    "أجب على أسئلة البوابة لفتح مهام سرية ومكافآت مخصصة.",
    "Répondez aux questions du portail pour débloquer des missions classifiées et des récompenses personnalisées."
  ),
  ...tri("challenge", "identity-challenge", "buttons", "startChallenge", "button", "Start Challenge", "ابدأ التحدي", "Commencer le défi"),

  // ── Challenge: Special Missions ──
  ...tri("challenge", "special-missions", "hero", "title", "title", "Special Missions", "مهام خاصة", "Missions Spéciales"),
  ...tri(
    "challenge",
    "special-missions",
    "hero",
    "subtitle",
    "subtitle",
    "Identity challenges, secret objectives, and classified portal operations.",
    "تحديات الهوية، أهداف سرية، وعمليات البوابة المصنفة.",
    "Défis d'identité, objectifs secrets et opérations classifiées du portail."
  ),
  ...tri("challenge", "special-missions", "empty_states", "noMissions", "empty_state", "No active missions right now.", "لا مهام نشطة حالياً.", "Aucune mission active pour le moment."),

  // ── Challenge: Explorer DNA ──
  ...tri("challenge", "explorer-dna", "hero", "title", "title", "Explorer DNA", "حمض المستكشف", "ADN Explorateur"),
  ...tri(
    "challenge",
    "explorer-dna",
    "hero",
    "subtitle",
    "subtitle",
    "Build your Explorer DNA profile. Answer questions to unlock better missions and rewards.",
    "ابنِ ملف حمض المستكشف. أجب على الأسئلة لفتح مهام ومكافآت أفضل.",
    "Construisez votre profil ADN Explorateur. Répondez aux questions pour débloquer de meilleures missions."
  ),

  // ── Challenge: Raid / Duel / Vault / Leaderboards / Rewards ──
  ...tri("challenge", "raid-arena", "hero", "title", "title", "Raid Arena", "ساحة الغارة", "Arène de Raid"),
  ...tri("challenge", "duel-arena", "hero", "title", "title", "Duel Arena", "ساحة المبارزة", "Arène de Duel"),
  ...tri("challenge", "mystery-vault", "hero", "title", "title", "Mystery Vault", "الخزنة الغامضة", "Coffre Mystère"),
  ...tri("challenge", "leaderboards", "hero", "title", "title", "Leaderboards", "لوحات الصدارة", "Classements"),
  ...tri("challenge", "rewards", "hero", "title", "title", "Rewards", "المكافآت", "Récompenses"),
];

export { LOCALES };

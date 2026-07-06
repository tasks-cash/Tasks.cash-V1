import type { ContentAppKey, ContentBlockType, ContentLocale } from "@tasks-cash/types";
import type { ContentSeedRow } from "./contentSeed";

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

/** Additional CMS seed rows — merged into CONTENT_SEED_ROWS */
export const CONTENT_SEED_EXTENDED: ContentSeedRow[] = [
  // ── Main: Referrals (extended) ──
  ...tri("main", "referrals", "cards", "yourCode", "label", "Your Referral Code", "رمز الإحالة الخاص بك", "Votre code de parrainage"),
  ...tri("main", "referrals", "table", "historyTitle", "title", "Referral History", "سجل الإحالات", "Historique des parrainages"),
  ...tri("main", "referrals", "buttons", "copyLink", "button", "Copy Referral Link", "نسخ رابط الإحالة", "Copier le lien de parrainage"),
  ...tri("main", "referrals", "empty_states", "noReferrals", "empty_state", "No referrals yet — share your invite link to begin.", "لا إحالات بعد — شارك رابط الدعوة للبدء.", "Aucun parrainage — partagez votre lien pour commencer."),
  ...tri("main", "referrals", "stats", "totalInvited", "label", "Total Invited", "إجمالي المدعوين", "Total invités"),
  ...tri("main", "referrals", "stats", "activeReferrals", "label", "Active Referrals", "إحالات نشطة", "Parrainages actifs"),
  ...tri("main", "referrals", "stats", "pendingRewards", "label", "Pending Rewards", "مكافآت معلقة", "Récompenses en attente"),
  ...tri("main", "referrals", "stats", "earnedRewards", "label", "Earned Rewards", "مكافآت مكتسبة", "Récompenses gagnées"),
  ...tri("main", "referrals", "table", "referredUser", "label", "Referred User", "المستخدم المُحال", "Utilisateur parrainé"),
  ...tri("main", "referrals", "table", "status", "label", "Status", "الحالة", "Statut"),
  ...tri("main", "referrals", "table", "reward", "label", "Reward", "المكافأة", "Récompense"),
  ...tri("main", "referrals", "table", "date", "label", "Date", "التاريخ", "Date"),
  ...tri("main", "referrals", "messages", "syncing", "label", "Syncing...", "جاري المزامنة...", "Synchronisation..."),

  // ── Main: Mystery Missions ──
  ...tri("main", "mystery-missions", "hero", "eyebrow", "label", "Mystery Operations", "عمليات غامضة", "Opérations mystères"),
  ...tri("main", "mystery-missions", "hero", "title", "title", "Special Missions", "مهام خاصة", "Missions Spéciales"),
  ...tri(
    "main",
    "mystery-missions",
    "hero",
    "subtitle",
    "subtitle",
    "Identity challenges, secret objectives, and classified portal operations.",
    "تحديات الهوية، أهداف سرية، وعمليات البوابة المصنفة.",
    "Défis d'identité, objectifs secrets et opérations classifiées du portail."
  ),
  ...tri("main", "mystery-missions", "stats", "locked", "label", "Locked", "مقفل", "Verrouillé"),
  ...tri("main", "mystery-missions", "stats", "revealed", "label", "Revealed", "مكشوف", "Révélé"),
  ...tri("main", "mystery-missions", "empty_states", "noMissions", "empty_state", "No mystery missions available.", "لا مهام غامضة متاحة.", "Aucune mission mystère disponible."),
  ...tri("main", "mystery-missions", "buttons", "enterPortal", "button", "Enter The Portal", "ادخل البوابة", "Entrer dans le portail"),

  // ── Main: Wallet (extended) ──
  ...tri("main", "wallet", "hero", "badge", "badge", "Economy System", "نظام الاقتصاد", "Système économique"),
  ...tri("main", "wallet", "hero", "title", "title", "Multi-Currency Wallet", "محفظة متعددة العملات", "Portefeuille multi-devises"),
  ...tri(
    "main",
    "wallet",
    "hero",
    "subtitle",
    "subtitle",
    "Bronze, silver, gold, gems, crystals, tokens, and portal energy.",
    "برونز، فضة، ذهب، جواهر، بلورات، رموز، وطاقة البوابة.",
    "Bronze, argent, or, gemmes, cristaux, jetons et énergie du portail."
  ),
  ...tri("main", "wallet", "cards", "allCurrencies", "title", "All Currencies", "جميع العملات", "Toutes les devises"),
  ...tri("main", "wallet", "cards", "exchange", "title", "Currency Exchange", "صرف العملات", "Échange de devises"),
  ...tri("main", "wallet", "messages", "exchangeDesc", "description", "Convert between portal currencies at live rates.", "حوّل بين عملات البوابة بأسعار مباشرة.", "Convertissez entre les devises du portail aux taux en direct."),
  ...tri("main", "wallet", "messages", "loading", "label", "Loading wallet...", "جاري تحميل المحفظة...", "Chargement du portefeuille..."),
  ...tri("main", "wallet", "errors", "exchangeFailed", "error_message", "Exchange failed", "فشل الصرف", "Échange échoué"),

  // ── Main: Public pages ──
  ...tri("main", "missions", "hero", "title", "title", "Missions", "المهام", "Missions"),
  ...tri("main", "missions", "hero", "subtitle", "subtitle", "Complete missions across the portal and earn legendary rewards.", "أكمل المهام عبر البوابة واكسب مكافآت أسطورية.", "Accomplissez des missions et gagnez des récompenses légendaires."),
  ...tri("main", "worlds", "hero", "title", "title", "Portal Worlds", "عوالم البوابة", "Mondes du Portail"),
  ...tri("main", "worlds", "hero", "subtitle", "subtitle", "Explore dimensional realms and unlock new challenges.", "استكشف العوالم الأبعادية وافتح تحديات جديدة.", "Explorez des royaumes dimensionnels et débloquez de nouveaux défis."),
  ...tri("main", "treasure", "hero", "title", "title", "Treasure Vault", "خزنة الكنوز", "Coffre au Trésor"),
  ...tri("main", "treasure", "hero", "subtitle", "subtitle", "Open chests, discover loot, and claim portal treasures.", "افتح الصناديق واكتشف الغنائم واستلم كنوز البوابة.", "Ouvrez des coffres, découvrez du butin et réclamez des trésors."),
  ...tri("main", "forgot-password", "hero", "title", "title", "Reset Portal Access", "إعادة تعيين الوصول للبوابة", "Réinitialiser l'accès au portail"),
  ...tri("main", "forgot-password", "hero", "subtitle", "subtitle", "Enter your email to receive a password reset link.", "أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور.", "Entrez votre e-mail pour recevoir un lien de réinitialisation."),
  ...tri("main", "forgot-password", "buttons", "submit", "button", "Send Reset Link", "إرسال رابط إعادة التعيين", "Envoyer le lien"),
  ...tri("main", "reset-password", "hero", "title", "title", "Set New Password", "تعيين كلمة مرور جديدة", "Nouveau mot de passe"),
  ...tri("main", "reset-password", "buttons", "submit", "button", "Update Password", "تحديث كلمة المرور", "Mettre à jour le mot de passe"),
  ...tri("main", "verify-email", "hero", "title", "title", "Verify Your Email", "تحقق من بريدك الإلكتروني", "Vérifiez votre e-mail"),
  ...tri("main", "verify-email", "messages", "checkInbox", "notice", "Check your inbox for the verification link.", "تحقق من صندوق الوارد لرابط التحقق.", "Vérifiez votre boîte de réception pour le lien de vérification."),

  // ── Main: Dashboard sub-pages ──
  ...tri("main", "dashboard-missions", "hero", "title", "title", "Missions", "المهام", "Missions"),
  ...tri("main", "dashboard-missions", "hero", "subtitle", "subtitle", "Track active missions and submit proof of completion.", "تتبع المهام النشطة وأرسل إثبات الإكمال.", "Suivez les missions actives et soumettez vos preuves."),
  ...tri("main", "dashboard-rewards", "hero", "title", "title", "Rewards", "المكافآت", "Récompenses"),
  ...tri("main", "dashboard-rewards", "hero", "subtitle", "subtitle", "Claim earned rewards and track your loot history.", "استلم المكافآت المكتسبة وتتبع سجل الغنائم.", "Réclamez vos récompenses et suivez votre historique."),
  ...tri("main", "dashboard-withdrawals", "hero", "title", "title", "Withdrawals", "السحوبات", "Retraits"),
  ...tri("main", "dashboard-withdrawals", "hero", "subtitle", "subtitle", "Request payouts and track withdrawal status.", "اطلب المدفوعات وتتبع حالة السحب.", "Demandez des paiements et suivez le statut des retraits."),
  ...tri("main", "dashboard-support", "hero", "title", "title", "Support", "الدعم", "Support"),
  ...tri("main", "dashboard-support", "hero", "subtitle", "subtitle", "Open tickets and get help from the portal team.", "افتح تذاكر واحصل على مساعدة من فريق البوابة.", "Ouvrez des tickets et obtenez l'aide de l'équipe."),
  ...tri("main", "dashboard-security", "hero", "title", "title", "Security", "الأمان", "Sécurité"),
  ...tri("main", "dashboard-security", "hero", "subtitle", "subtitle", "Manage passwords, sessions, and account protection.", "إدارة كلمات المرور والجلسات وحماية الحساب.", "Gérez mots de passe, sessions et protection du compte."),
  ...tri("main", "dashboard-level", "hero", "title", "title", "Level & XP", "المستوى ونقاط الخبرة", "Niveau et XP"),
  ...tri("main", "dashboard-level", "hero", "subtitle", "subtitle", "Track RPG progression and stat growth.", "تتبع تقدم اللعب ونمو الإحصائيات.", "Suivez la progression RPG et la croissance des stats."),
  ...tri("main", "dashboard-leaderboard", "hero", "title", "title", "Rank", "الترتيب", "Classement"),
  ...tri("main", "dashboard-leaderboard", "hero", "subtitle", "subtitle", "See where you stand among portal explorers.", "اعرف مكانك بين مستكشفي البوابة.", "Voyez votre position parmi les explorateurs."),

  // ── Challenge: Raid / Duel / Vault / Leaderboards / Rewards (extended) ──
  ...tri("challenge", "raid-arena", "hero", "subtitle", "subtitle", "Join timed raids with your alliance. Coordinate attacks and share prize pools.", "انضم للغارات المحددة بوقت مع تحالفك. نسّق الهجمات وشارك جوائز المجموعة.", "Rejoignez des raids chronométrés avec votre alliance. Coordonnez les attaques et partagez les prix."),
  ...tri("challenge", "raid-arena", "cards", "liveRaids", "title", "Live Raids", "غارات مباشرة", "Raids en direct"),
  ...tri("challenge", "raid-arena", "cards", "liveRaidsDesc", "description", "Portal raids open on a schedule. Enter before the gate closes to compete for massive coin pools.", "تفتح غارات البوابة وفق جدول. ادخل قبل إغلاق البوابة للمنافسة على مجمعات عملات ضخمة.", "Les raids s'ouvrent selon un calendrier. Entrez avant la fermeture pour concourir pour d'énormes pools de pièces."),
  ...tri("challenge", "raid-arena", "buttons", "browseRaids", "button", "Browse Live Raids", "تصفح الغارات المباشرة", "Parcourir les raids"),
  ...tri("challenge", "raid-arena", "cards", "raidStats", "title", "Your Raid Stats", "إحصائيات غاراتك", "Vos stats de raid"),
  ...tri("challenge", "raid-arena", "buttons", "viewRankings", "button", "View Rankings", "عرض التصنيفات", "Voir le classement"),

  ...tri("challenge", "duel-arena", "hero", "subtitle", "subtitle", "Challenge rivals in head-to-head combat. Win duels to climb the arena ladder.", "تحدَّ الخصوم في قتال مباشر. اربح المبارزات لتسلق سلم الساحة.", "Défiez des rivaux en combat direct. Gagnez des duels pour grimper l'échelle."),
  ...tri("challenge", "duel-arena", "cards", "enterDuel", "title", "Enter Duel", "ادخل المبارزة", "Entrer en duel"),
  ...tri("challenge", "duel-arena", "buttons", "findOpponent", "button", "Find Opponent", "ابحث عن خصم", "Trouver un adversaire"),

  ...tri("challenge", "mystery-vault", "hero", "subtitle", "subtitle", "Unlock classified vaults with secret keys earned from missions.", "افتح الخزائن السرية بمفاتيح تكسبها من المهام.", "Débloquez des coffres classifiés avec des clés secrètes gagnées en missions."),
  ...tri("challenge", "mystery-vault", "cards", "vaultAccess", "title", "Vault Access", "الوصول للخزنة", "Accès au coffre"),
  ...tri("challenge", "mystery-vault", "buttons", "openVault", "button", "Open Vault", "افتح الخزنة", "Ouvrir le coffre"),

  ...tri("challenge", "leaderboards", "hero", "subtitle", "subtitle", "Top explorers ranked by XP, wins, and portal contribution.", "أفضل المستكشفين مصنفون حسب نقاط الخبرة والانتصارات والمساهمة.", "Meilleurs explorateurs classés par XP, victoires et contribution."),
  ...tri("challenge", "leaderboards", "table", "rank", "label", "Rank", "الترتيب", "Rang"),
  ...tri("challenge", "leaderboards", "table", "explorer", "label", "Explorer", "المستكشف", "Explorateur"),
  ...tri("challenge", "leaderboards", "table", "score", "label", "Score", "النقاط", "Score"),
  ...tri("challenge", "leaderboards", "empty_states", "noEntries", "empty_state", "No leaderboard entries yet.", "لا إدخالات في لوحة الصدارة بعد.", "Aucune entrée au classement pour le moment."),

  ...tri("challenge", "rewards", "hero", "subtitle", "subtitle", "Claim challenge rewards, bonus pools, and seasonal prizes.", "استلم مكافآت التحديات ومجمعات المكافآت والجوائز الموسمية.", "Réclamez récompenses de défi, pools bonus et prix saisonniers."),
  ...tri("challenge", "rewards", "empty_states", "noRewards", "empty_state", "No rewards available right now.", "لا مكافآت متاحة حالياً.", "Aucune récompense disponible pour le moment."),

  ...tri("challenge", "explorer-dna", "cards", "signInTitle", "title", "Sign in to access Explorer DNA", "سجّل الدخول للوصول لحمض المستكشف", "Connectez-vous pour accéder à l'ADN Explorateur"),
  ...tri(
    "challenge",
    "explorer-dna",
    "cards",
    "signInDesc",
    "description",
    "Explorer DNA lives on your main Tasks.cash account. Log in to answer DNA questions and improve mission recommendations.",
    "حمض المستكشف على حساب Tasks.cash الرئيسي. سجّل الدخول للإجابة على الأسئلة وتحسين توصيات المهام.",
    "L'ADN Explorateur est sur votre compte Tasks.cash principal. Connectez-vous pour répondre aux questions."
  ),
  ...tri("challenge", "explorer-dna", "buttons", "openDna", "button", "Open Explorer DNA", "افتح حمض المستكشف", "Ouvrir l'ADN Explorateur"),

  // ── Challenge: Video Hunter (extended) ──
  ...tri("challenge", "video-hunter", "forms", "addVideoTitle", "title", "Add New Video", "إضافة فيديو جديد", "Ajouter une vidéo"),
  ...tri("challenge", "video-hunter", "forms", "videoUrlLabel", "label", "Video URL", "رابط الفيديو", "URL de la vidéo"),
  ...tri("challenge", "video-hunter", "forms", "viewsLabel", "label", "Visible Views", "المشاهدات المرئية", "Vues visibles"),
  ...tri("challenge", "video-hunter", "forms", "ideaTitleLabel", "label", "Idea Title", "عنوان الفكرة", "Titre de l'idée"),
  ...tri("challenge", "video-hunter", "forms", "descriptionLabel", "label", "Description / Note", "الوصف / ملاحظة", "Description / Note"),
  ...tri("challenge", "video-hunter", "buttons", "submitVideo", "button", "Submit Video", "إرسال الفيديو", "Soumettre la vidéo"),
  ...tri("challenge", "video-hunter", "buttons", "submitting", "button", "Submitting…", "جاري الإرسال…", "Envoi en cours…"),
  ...tri("challenge", "video-hunter", "messages", "loading", "label", "Loading your video submissions from database…", "جاري تحميل إرسالات الفيديو…", "Chargement de vos soumissions vidéo…"),
  ...tri("challenge", "video-hunter", "messages", "submitSuccess", "success_message", "Video submitted — saved to your database.", "تم إرسال الفيديو — حُفظ في قاعدة البيانات.", "Vidéo soumise — enregistrée dans votre base de données."),
  ...tri("challenge", "video-hunter", "buttons", "retry", "button", "Retry", "إعادة المحاولة", "Réessayer"),
  ...tri("challenge", "video-hunter", "table", "allVideos", "title", "All Videos", "جميع الفيديوهات", "Toutes les vidéos"),
  ...tri("challenge", "video-hunter", "table", "approvedVideos", "title", "Approved Videos", "فيديوهات معتمدة", "Vidéos approuvées"),
  ...tri("challenge", "video-hunter", "table", "pendingVideos", "title", "Pending Videos", "فيديوهات معلقة", "Vidéos en attente"),
  ...tri("challenge", "video-hunter", "table", "rejectedVideos", "title", "Rejected Videos", "فيديوهات مرفوضة", "Vidéos rejetées"),
  ...tri("challenge", "video-hunter", "empty_states", "noVideos", "empty_state", "No videos yet — submit your first link above.", "لا فيديوهات بعد — أرسل أول رابط أعلاه.", "Aucune vidéo — soumettez votre premier lien ci-dessus."),

  // ── Challenge: Navigation labels ──
  ...tri("challenge", "nav", "nav", "hub", "nav", "Hub", "المركز", "Hub"),
  ...tri("challenge", "nav", "nav", "videoHunter", "nav", "Video Hunter", "صياد الفيديو", "Chasseur Vidéo"),
  ...tri("challenge", "nav", "nav", "referralArena", "nav", "Referral Arena", "ساحة الإحالة", "Arène de Parrainage"),
  ...tri("challenge", "nav", "nav", "identityChallenge", "nav", "Identity Challenge", "تحدي الهوية", "Défi d'Identité"),
  ...tri("challenge", "nav", "nav", "specialMissions", "nav", "Special Missions", "مهام خاصة", "Missions Spéciales"),
  ...tri("challenge", "nav", "nav", "raidArena", "nav", "Raid Arena", "ساحة الغارة", "Arène de Raid"),
  ...tri("challenge", "nav", "nav", "duelArena", "nav", "Duel Arena", "ساحة المبارزة", "Arène de Duel"),
  ...tri("challenge", "nav", "nav", "mysteryVault", "nav", "Mystery Vault", "الخزنة الغامضة", "Coffre Mystère"),
  ...tri("challenge", "nav", "nav", "leaderboards", "nav", "Leaderboards", "لوحات الصدارة", "Classements"),
  ...tri("challenge", "nav", "nav", "rewards", "nav", "Rewards", "المكافآت", "Récompenses"),
  ...tri("challenge", "nav", "nav", "explorerDna", "nav", "Explorer DNA", "حمض المستكشف", "ADN Explorateur"),
  ...tri("challenge", "nav", "nav", "dashboard", "nav", "Dashboard", "لوحة التحكم", "Tableau de bord"),

  // ── Admin app ──
  ...tri("admin", "dashboard", "hero", "title", "title", "Command Center", "مركز القيادة", "Centre de Commande"),
  ...tri("admin", "dashboard", "hero", "subtitle", "subtitle", "Real-time platform metrics and system health", "مقاييس المنصة وصحة النظام في الوقت الفعلي", "Métriques de la plateforme et santé du système en temps réel"),
  ...tri("admin", "dashboard", "hero", "badge", "badge", "Admin Control", "تحكم المسؤول", "Contrôle Admin"),
  ...tri("admin", "content", "hero", "title", "title", "Content Management", "إدارة المحتوى", "Gestion du contenu"),
  ...tri("admin", "content", "hero", "subtitle", "subtitle", "Edit live copy for Main (3000), Challenge (3001), and Admin (3002) apps", "تحرير النصوص المباشرة لتطبيقات Main و Challenge و Admin", "Modifier le texte en direct pour les apps Main, Challenge et Admin"),
  ...tri("admin", "settings", "hero", "title", "title", "System Settings", "إعدادات النظام", "Paramètres système"),
  ...tri("admin", "settings", "hero", "subtitle", "subtitle", "Configure platform-wide settings and feature flags.", "اضبط إعدادات المنصة وأعلام الميزات.", "Configurez les paramètres globaux et les fonctionnalités."),
];

import type { ContentAppKey, ContentBlockType } from "@tasks-cash/types";
import type { ContentSeedRow } from "./contentSeed";

/**
 * Full CMS inventory for pages/shared surfaces not fully covered by base+extended seeds.
 * Deterministic keys: appKey / pageKey / sectionKey / contentKey
 * AR/FR are real translations. Uncertain copy uses [translation_required] prefix.
 */
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

/** Mark uncertain translations clearly for CMS audit — reserved for future inventory rows */
export function needsTranslation(en: string): { ar: string; fr: string } {
  return {
    ar: `[translation_required] ${en}`,
    fr: `[translation_required] ${en}`,
  };
}

export const CONTENT_SEED_INVENTORY: ContentSeedRow[] = [
  // ═══════════════════════════════════════════
  // SHARED — Main App
  // ═══════════════════════════════════════════
  ...tri("main", "global", "navigation", "home", "nav", "Home", "الرئيسية", "Accueil"),
  ...tri("main", "global", "navigation", "dashboard", "nav", "Dashboard", "لوحة التحكم", "Tableau de bord"),
  ...tri("main", "global", "navigation", "missions", "nav", "Missions", "المهام", "Missions"),
  ...tri("main", "global", "navigation", "wallet", "nav", "Wallet", "المحفظة", "Portefeuille"),
  ...tri("main", "global", "navigation", "referrals", "nav", "Referrals", "الإحالات", "Parrainages"),
  ...tri("main", "global", "navigation", "notifications", "nav", "Notifications", "الإشعارات", "Notifications"),
  ...tri("main", "global", "navigation", "profile", "nav", "Profile", "الملف الشخصي", "Profil"),
  ...tri("main", "global", "navigation", "logout", "nav", "Logout", "تسجيل الخروج", "Déconnexion"),
  ...tri("main", "global", "navigation", "login", "nav", "Login", "تسجيل الدخول", "Connexion"),
  ...tri("main", "global", "navigation", "register", "nav", "Register", "إنشاء حساب", "S'inscrire"),
  ...tri("main", "global", "navigation", "explorerDna", "nav", "Explorer DNA", "حمض المستكشف", "ADN Explorateur"),
  ...tri("main", "global", "navigation", "mysteryChallenges", "nav", "Mystery Challenges", "تحديات غامضة", "Défis Mystères"),

  ...tri("main", "global", "footer", "privacy", "nav", "Privacy", "الخصوصية", "Confidentialité"),
  ...tri("main", "global", "footer", "terms", "nav", "Terms", "الشروط", "Conditions"),
  ...tri("main", "global", "footer", "cookies", "nav", "Cookies", "ملفات تعريف الارتباط", "Cookies"),
  ...tri("main", "global", "footer", "refund", "nav", "Refund Policy", "سياسة الاسترداد", "Politique de remboursement"),
  ...tri("main", "global", "footer", "help", "nav", "Help", "المساعدة", "Aide"),
  ...tri("main", "global", "footer", "contact", "nav", "Contact", "اتصل بنا", "Contact"),
  ...tri("main", "global", "footer", "copyright", "label", "© Tasks.cash — All rights reserved.", "© Tasks.cash — جميع الحقوق محفوظة.", "© Tasks.cash — Tous droits réservés."),

  ...tri("main", "global", "errors", "generic", "error_message", "Something went wrong", "حدث خطأ ما", "Une erreur s'est produite"),
  ...tri("main", "global", "errors", "notFound", "error_message", "Page not found", "الصفحة غير موجودة", "Page introuvable"),
  ...tri("main", "global", "errors", "unauthorized", "error_message", "Please sign in to continue", "يرجى تسجيل الدخول للمتابعة", "Veuillez vous connecter pour continuer"),
  ...tri("main", "global", "errors", "network", "error_message", "Network error — please try again", "خطأ في الشبكة — حاول مرة أخرى", "Erreur réseau — réessayez"),
  ...tri("main", "global", "validation", "required", "error_message", "This field is required", "هذا الحقل مطلوب", "Ce champ est obligatoire"),
  ...tri("main", "global", "validation", "invalidEmail", "error_message", "Enter a valid email address", "أدخل بريداً إلكترونياً صالحاً", "Entrez une adresse e-mail valide"),
  ...tri("main", "global", "empty_states", "loading", "label", "Loading…", "جاري التحميل…", "Chargement…"),
  ...tri("main", "global", "buttons", "save", "button", "Save", "حفظ", "Enregistrer"),
  ...tri("main", "global", "buttons", "cancel", "button", "Cancel", "إلغاء", "Annuler"),
  ...tri("main", "global", "buttons", "confirm", "button", "Confirm", "تأكيد", "Confirmer"),
  ...tri("main", "global", "buttons", "back", "button", "Back", "رجوع", "Retour"),
  ...tri("main", "global", "accessibility", "toggleMenu", "label", "Toggle menu", "تبديل القائمة", "Basculer le menu"),
  ...tri("main", "global", "accessibility", "closeDialog", "label", "Close dialog", "إغلاق الحوار", "Fermer la boîte de dialogue"),

  // ── Auth pages (full form copy) ──
  ...tri("main", "forgot-password", "forms", "emailLabel", "label", "Email", "البريد الإلكتروني", "E-mail"),
  ...tri("main", "forgot-password", "forms", "emailPlaceholder", "placeholder", "warrior@portal.io", "warrior@portal.io", "warrior@portal.io"),
  ...tri("main", "forgot-password", "buttons", "submitLoading", "button", "Sending…", "جاري الإرسال…", "Envoi…"),
  ...tri("main", "forgot-password", "buttons", "backToLogin", "button", "Back to login", "العودة لتسجيل الدخول", "Retour à la connexion"),
  ...tri("main", "forgot-password", "messages", "success", "success_message", "If an account exists, a recovery link was sent.", "إذا كان الحساب موجوداً، تم إرسال رابط الاسترداد.", "Si un compte existe, un lien de récupération a été envoyé."),

  ...tri("main", "reset-password", "hero", "subtitle", "subtitle", "Choose a new password for your portal account.", "اختر كلمة مرور جديدة لحساب البوابة.", "Choisissez un nouveau mot de passe pour votre compte."),
  ...tri("main", "reset-password", "forms", "passwordLabel", "label", "New Password", "كلمة المرور الجديدة", "Nouveau mot de passe"),
  ...tri("main", "reset-password", "forms", "confirmLabel", "label", "Confirm Password", "تأكيد كلمة المرور", "Confirmer le mot de passe"),
  ...tri("main", "reset-password", "buttons", "submitLoading", "button", "Updating…", "جاري التحديث…", "Mise à jour…"),
  ...tri("main", "reset-password", "messages", "success", "success_message", "Password updated. You can sign in now.", "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.", "Mot de passe mis à jour. Vous pouvez vous connecter."),

  ...tri("main", "verify-email", "hero", "subtitle", "subtitle", "Confirm your email to unlock full portal access.", "أكد بريدك لفتح الوصول الكامل للبوابة.", "Confirmez votre e-mail pour débloquer l'accès complet."),
  ...tri("main", "verify-email", "buttons", "resend", "button", "Resend verification", "إعادة إرسال التحقق", "Renvoyer la vérification"),
  ...tri("main", "verify-email", "buttons", "continue", "button", "Continue to Dashboard", "المتابعة إلى لوحة التحكم", "Continuer vers le tableau de bord"),

  // ── Public marketing pages ──
  ...tri("main", "about", "hero", "eyebrow", "label", "Our Story", "قصتنا", "Notre histoire"),
  ...tri("main", "about", "hero", "title", "title", "About the Portal", "عن البوابة", "À propos du Portail"),
  ...tri("main", "about", "hero", "subtitle", "subtitle", "Where real tasks become epic quests across the multiverse.", "حيث تتحول المهام الحقيقية إلى مغامرات أسطورية عبر الأكوان.", "Là où les tâches réelles deviennent des quêtes épiques."),
  ...tri("main", "about", "cards", "missionTitle", "title", "Our Mission", "مهمتنا", "Notre mission"),
  ...tri(
    "main",
    "about",
    "cards",
    "missionBody",
    "description",
    "Tasks.cash transforms everyday productivity into an epic journey. We blend dark fantasy aesthetics with sci-fi portal mechanics to make completing real tasks feel like conquering dimensions.",
    "تحوّل Tasks.cash الإنتاجية اليومية إلى رحلة أسطورية. نمزج جماليات الفانتازيا الداكنة مع آليات البوابة العلمية لجعل إنجاز المهام الحقيقية شعوراً بغزو الأبعاد.",
    "Tasks.cash transforme la productivité quotidienne en une aventure épique. Nous mêlons esthétique dark fantasy et mécaniques de portail sci-fi."
  ),
  ...tri("main", "about", "cards", "visionTitle", "title", "The Vision", "الرؤية", "La vision"),
  ...tri(
    "main",
    "about",
    "cards",
    "visionBody",
    "description",
    "Build the most immersive gamified task platform — where discipline meets adventure, and every completed mission brings you closer to legendary status.",
    "بناء أكثر منصات المهام غمراً — حيث يلتقي الانضباط بالمغامرة، وكل مهمة مكتملة تقربك من المكانة الأسطورية.",
    "Construire la plateforme de tâches la plus immersive — où discipline et aventure se rencontrent."
  ),
  ...tri("main", "about", "stats", "explorers", "label", "Explorers", "المستكشفون", "Explorateurs"),
  ...tri("main", "about", "stats", "missionsCompleted", "label", "Missions Completed", "المهام المكتملة", "Missions accomplies"),
  ...tri("main", "about", "stats", "worlds", "label", "Worlds", "العوالم", "Mondes"),
  ...tri("main", "about", "stats", "team", "label", "Team Members", "أعضاء الفريق", "Membres de l'équipe"),
  ...tri("main", "about", "hero", "timelineEyebrow", "label", "Timeline", "الجدول الزمني", "Chronologie"),
  ...tri("main", "about", "hero", "timelineTitle", "title", "Portal History", "تاريخ البوابة", "Histoire du Portail"),
  ...tri("main", "about", "hero", "teamEyebrow", "label", "Team", "الفريق", "Équipe"),
  ...tri("main", "about", "hero", "teamTitle", "title", "The Void Council", "مجلس الفراغ", "Le Conseil du Vide"),

  ...tri("main", "faq", "hero", "title", "title", "FAQ", "الأسئلة الشائعة", "FAQ"),
  ...tri("main", "faq", "hero", "subtitle", "subtitle", "Answers to the most common portal questions.", "إجابات لأكثر أسئلة البوابة شيوعاً.", "Réponses aux questions les plus fréquentes."),
  ...tri("main", "faq", "empty_states", "noResults", "empty_state", "No matching questions found.", "لم يتم العثور على أسئلة مطابقة.", "Aucune question correspondante."),

  ...tri("main", "contact", "hero", "title", "title", "Contact", "اتصل بنا", "Contact"),
  ...tri("main", "contact", "hero", "subtitle", "subtitle", "Reach the portal support team.", "تواصل مع فريق دعم البوابة.", "Contactez l'équipe de support du portail."),
  ...tri("main", "contact", "forms", "nameLabel", "label", "Name", "الاسم", "Nom"),
  ...tri("main", "contact", "forms", "emailLabel", "label", "Email", "البريد الإلكتروني", "E-mail"),
  ...tri("main", "contact", "forms", "messageLabel", "label", "Message", "الرسالة", "Message"),
  ...tri("main", "contact", "buttons", "submit", "button", "Send Message", "إرسال الرسالة", "Envoyer le message"),
  ...tri("main", "contact", "messages", "success", "success_message", "Message sent. We'll reply soon.", "تم إرسال الرسالة. سنرد قريباً.", "Message envoyé. Nous répondrons bientôt."),

  ...tri("main", "help", "hero", "title", "title", "Help Center", "مركز المساعدة", "Centre d'aide"),
  ...tri("main", "help", "hero", "subtitle", "subtitle", "Guides, tutorials, and portal support resources.", "أدلة ودروس وموارد دعم البوابة.", "Guides, tutoriels et ressources de support."),
  ...tri("main", "help", "empty_states", "noArticles", "empty_state", "No help articles in this category.", "لا مقالات مساعدة في هذه الفئة.", "Aucun article d'aide dans cette catégorie."),

  ...tri("main", "community", "hero", "title", "title", "Community", "المجتمع", "Communauté"),
  ...tri("main", "community", "hero", "subtitle", "subtitle", "Join explorers across the multiverse.", "انضم إلى المستكشفين عبر الأكوان.", "Rejoignez les explorateurs à travers le multivers."),

  ...tri("main", "marketplace", "hero", "title", "title", "Marketplace", "السوق", "Marché"),
  ...tri("main", "marketplace", "hero", "subtitle", "subtitle", "Trade items, boosts, and portal cosmetics.", "تداول العناصر والتعزيزات ومستحضرات البوابة.", "Échangez objets, boosts et cosmétiques du portail."),
  ...tri("main", "marketplace", "empty_states", "noItems", "empty_state", "No marketplace items available.", "لا عناصر متاحة في السوق.", "Aucun article disponible sur le marché."),

  ...tri("main", "leaderboards", "hero", "title", "title", "Leaderboards", "لوحات الصدارة", "Classements"),
  ...tri("main", "leaderboards", "hero", "subtitle", "subtitle", "Top explorers ranked by XP and achievements.", "أفضل المستكشفين حسب نقاط الخبرة والإنجازات.", "Meilleurs explorateurs classés par XP et succès."),
  ...tri("main", "leaderboards", "table", "rank", "label", "Rank", "الترتيب", "Rang"),
  ...tri("main", "leaderboards", "table", "explorer", "label", "Explorer", "المستكشف", "Explorateur"),
  ...tri("main", "leaderboards", "table", "score", "label", "Score", "النقاط", "Score"),

  ...tri("main", "rewards", "hero", "title", "title", "Rewards", "المكافآت", "Récompenses"),
  ...tri("main", "rewards", "hero", "subtitle", "subtitle", "Claim badges, coins, and legendary loot.", "استلم الشارات والعملات والغنائم الأسطورية.", "Réclamez badges, pièces et butin légendaire."),

  ...tri("main", "challenges", "hero", "title", "title", "Challenges", "التحديات", "Défis"),
  ...tri("main", "challenges", "hero", "subtitle", "subtitle", "Compete in portal challenges and seasonal events.", "تنافس في تحديات البوابة والفعاليات الموسمية.", "Participez aux défis du portail et aux événements saisonniers."),

  ...tri("main", "privacy", "hero", "title", "title", "Privacy Policy", "سياسة الخصوصية", "Politique de confidentialité"),
  ...tri("main", "privacy", "hero", "subtitle", "subtitle", "How we collect, use, and protect your data.", "كيف نجمع بياناتك ونستخدمها ونحميها.", "Comment nous collectons, utilisons et protégeons vos données."),
  ...tri("main", "terms", "hero", "title", "title", "Terms of Service", "شروط الخدمة", "Conditions d'utilisation"),
  ...tri("main", "terms", "hero", "subtitle", "subtitle", "Rules for using the Tasks.cash portal.", "قواعد استخدام بوابة Tasks.cash.", "Règles d'utilisation du portail Tasks.cash."),
  ...tri("main", "cookies", "hero", "title", "title", "Cookie Policy", "سياسة ملفات تعريف الارتباط", "Politique de cookies"),
  ...tri("main", "cookies", "hero", "subtitle", "subtitle", "How cookies and similar technologies are used.", "كيف تُستخدم ملفات تعريف الارتباط والتقنيات المشابهة.", "Comment les cookies et technologies similaires sont utilisés."),
  ...tri("main", "refund", "hero", "title", "title", "Refund Policy", "سياسة الاسترداد", "Politique de remboursement"),
  ...tri("main", "refund", "hero", "subtitle", "subtitle", "Eligibility and process for refunds.", "الأهلية وعملية الاسترداد.", "Éligibilité et processus de remboursement."),

  ...tri("main", "blog", "hero", "title", "title", "Portal Blog", "مدونة البوابة", "Blog du Portail"),
  ...tri("main", "blog", "hero", "subtitle", "subtitle", "News, updates, and explorer stories.", "أخبار وتحديثات وقصص المستكشفين.", "Actualités, mises à jour et histoires d'explorateurs."),
  ...tri("main", "blog", "empty_states", "noPosts", "empty_state", "No blog posts yet.", "لا مقالات بعد.", "Aucun article pour le moment."),

  ...tri("main", "not-found", "hero", "title", "title", "Lost in the Void", "ضائع في الفراغ", "Perdu dans le Vide"),
  ...tri("main", "not-found", "hero", "subtitle", "subtitle", "This page does not exist in any known dimension.", "هذه الصفحة غير موجودة في أي بُعد معروف.", "Cette page n'existe dans aucune dimension connue."),
  ...tri("main", "not-found", "buttons", "home", "button", "Return Home", "العودة للرئيسية", "Retour à l'accueil"),
  ...tri("main", "not-found", "buttons", "dashboard", "button", "Go to Dashboard", "الذهاب للوحة التحكم", "Aller au tableau de bord"),

  // ── Dashboard extras ──
  ...tri("main", "dashboard-rewards", "buttons", "claim", "button", "Claim Reward", "استلام المكافأة", "Réclamer la récompense"),
  ...tri("main", "dashboard-rewards", "empty_states", "noRewards", "empty_state", "No rewards to claim yet.", "لا مكافآت للاستلام بعد.", "Aucune récompense à réclamer."),
  ...tri("main", "dashboard-withdrawals", "forms", "amountLabel", "label", "Amount", "المبلغ", "Montant"),
  ...tri("main", "dashboard-withdrawals", "buttons", "request", "button", "Request Withdrawal", "طلب سحب", "Demander un retrait"),
  ...tri("main", "dashboard-withdrawals", "empty_states", "noHistory", "empty_state", "No withdrawal history.", "لا سجل سحوبات.", "Aucun historique de retrait."),
  ...tri("main", "dashboard-support", "forms", "subjectLabel", "label", "Subject", "الموضوع", "Sujet"),
  ...tri("main", "dashboard-support", "forms", "messageLabel", "label", "Message", "الرسالة", "Message"),
  ...tri("main", "dashboard-support", "buttons", "openTicket", "button", "Open Ticket", "فتح تذكرة", "Ouvrir un ticket"),
  ...tri("main", "dashboard-support", "empty_states", "noTickets", "empty_state", "No support tickets yet.", "لا تذاكر دعم بعد.", "Aucun ticket de support."),
  ...tri("main", "dashboard-security", "cards", "passwordTitle", "title", "Change Password", "تغيير كلمة المرور", "Changer le mot de passe"),
  ...tri("main", "dashboard-security", "cards", "sessionsTitle", "title", "Active Sessions", "الجلسات النشطة", "Sessions actives"),
  ...tri("main", "dashboard-security", "buttons", "revoke", "button", "Revoke Session", "إلغاء الجلسة", "Révoquer la session"),
  ...tri("main", "profile", "forms", "usernameLabel", "label", "Username", "اسم المستخدم", "Nom d'utilisateur"),
  ...tri("main", "profile", "forms", "emailLabel", "label", "Email", "البريد الإلكتروني", "E-mail"),
  ...tri("main", "profile", "buttons", "save", "button", "Save Profile", "حفظ الملف", "Enregistrer le profil"),
  ...tri("main", "settings", "cards", "notifications", "title", "Notification Preferences", "تفضيلات الإشعارات", "Préférences de notification"),
  ...tri("main", "settings", "cards", "language", "title", "Language", "اللغة", "Langue"),
  ...tri("main", "settings", "buttons", "save", "button", "Save Settings", "حفظ الإعدادات", "Enregistrer les paramètres"),

  // ═══════════════════════════════════════════
  // SHARED — Challenge App
  // ═══════════════════════════════════════════
  ...tri("challenge", "global", "navigation", "hub", "nav", "Hub", "المركز", "Hub"),
  ...tri("challenge", "global", "navigation", "videoHunter", "nav", "Video Hunter", "صياد الفيديو", "Chasseur Vidéo"),
  ...tri("challenge", "global", "navigation", "referralArena", "nav", "Referral Arena", "ساحة الإحالة", "Arène de Parrainage"),
  ...tri("challenge", "global", "navigation", "identityChallenge", "nav", "Identity Challenge", "تحدي الهوية", "Défi d'Identité"),
  ...tri("challenge", "global", "navigation", "specialMissions", "nav", "Special Missions", "مهام خاصة", "Missions Spéciales"),
  ...tri("challenge", "global", "navigation", "raidArena", "nav", "Raid Arena", "ساحة الغارة", "Arène de Raid"),
  ...tri("challenge", "global", "navigation", "duelArena", "nav", "Duel Arena", "ساحة المبارزة", "Arène de Duel"),
  ...tri("challenge", "global", "navigation", "mysteryVault", "nav", "Mystery Vault", "الخزنة الغامضة", "Coffre Mystère"),
  ...tri("challenge", "global", "navigation", "leaderboards", "nav", "Leaderboards", "لوحات الصدارة", "Classements"),
  ...tri("challenge", "global", "navigation", "rewards", "nav", "Rewards", "المكافآت", "Récompenses"),
  ...tri("challenge", "global", "navigation", "explorerDna", "nav", "Explorer DNA", "حمض المستكشف", "ADN Explorateur"),
  ...tri("challenge", "global", "errors", "generic", "error_message", "Something went wrong", "حدث خطأ ما", "Une erreur s'est produite"),
  ...tri("challenge", "global", "empty_states", "loading", "label", "Loading arena…", "جاري تحميل الساحة…", "Chargement de l'arène…"),
  ...tri("challenge", "global", "buttons", "back", "button", "Back", "رجوع", "Retour"),

  ...tri("challenge", "special-mission-detail", "hero", "title", "title", "Mission Details", "تفاصيل المهمة", "Détails de la mission"),
  ...tri("challenge", "special-mission-detail", "buttons", "submitProof", "button", "Submit Proof", "إرسال الإثبات", "Soumettre la preuve"),
  ...tri("challenge", "special-mission-detail", "buttons", "back", "button", "Back to Missions", "العودة للمهام", "Retour aux missions"),
  ...tri("challenge", "special-mission-detail", "empty_states", "notFound", "empty_state", "Mission not found.", "المهمة غير موجودة.", "Mission introuvable."),

  ...tri("challenge", "leaderboards", "buttons", "refresh", "button", "Refresh Rankings", "تحديث التصنيفات", "Actualiser le classement"),
  ...tri("challenge", "rewards", "buttons", "claim", "button", "Claim", "استلام", "Réclamer"),
  ...tri("challenge", "rewards", "cards", "poolsTitle", "title", "Reward Pools", "مجمعات المكافآت", "Pools de récompenses"),

  // ═══════════════════════════════════════════
  // SHARED — Admin App
  // ═══════════════════════════════════════════
  ...tri("admin", "global", "sidebar", "dashboard", "nav", "Overview", "نظرة عامة", "Aperçu"),
  ...tri("admin", "global", "sidebar", "users", "nav", "Users", "المستخدمون", "Utilisateurs"),
  ...tri("admin", "global", "sidebar", "content", "nav", "Content", "المحتوى", "Contenu"),
  ...tri("admin", "global", "sidebar", "missions", "nav", "Missions", "المهام", "Missions"),
  ...tri("admin", "global", "sidebar", "rewards", "nav", "Rewards", "المكافآت", "Récompenses"),
  ...tri("admin", "global", "sidebar", "settings", "nav", "Settings", "الإعدادات", "Paramètres"),
  ...tri("admin", "global", "sidebar", "logout", "nav", "Logout", "تسجيل الخروج", "Déconnexion"),
  ...tri("admin", "global", "buttons", "save", "button", "Save", "حفظ", "Enregistrer"),
  ...tri("admin", "global", "buttons", "delete", "button", "Delete", "حذف", "Supprimer"),
  ...tri("admin", "global", "buttons", "edit", "button", "Edit", "تعديل", "Modifier"),
  ...tri("admin", "global", "buttons", "create", "button", "Create", "إنشاء", "Créer"),
  ...tri("admin", "global", "empty_states", "noResults", "empty_state", "No results found.", "لا نتائج.", "Aucun résultat."),
  ...tri("admin", "global", "errors", "generic", "error_message", "Request failed", "فشل الطلب", "Échec de la requête"),
  ...tri("admin", "global", "messages", "saved", "success_message", "Changes saved", "تم حفظ التغييرات", "Modifications enregistrées"),

  ...tri("admin", "login", "hero", "title", "title", "Command Center Access", "الوصول لمركز القيادة", "Accès au Centre de Commande"),
  ...tri("admin", "login", "hero", "subtitle", "subtitle", "Admin authentication required", "مطلوب مصادقة المسؤول", "Authentification admin requise"),
  ...tri("admin", "login", "forms", "emailPlaceholder", "placeholder", "admin@tasks.cash", "admin@tasks.cash", "admin@tasks.cash"),
  ...tri("admin", "login", "buttons", "submit", "button", "Enter Command Center", "ادخل مركز القيادة", "Entrer dans le Centre de Commande"),
  ...tri("admin", "login", "errors", "invalid", "error_message", "Admin access denied", "تم رفض وصول المسؤول", "Accès admin refusé"),

  ...tri("admin", "users", "hero", "title", "title", "Users", "المستخدمون", "Utilisateurs"),
  ...tri("admin", "users", "hero", "subtitle", "subtitle", "Manage platform explorers and accounts.", "إدارة مستكشفي المنصة والحسابات.", "Gérer les explorateurs et comptes de la plateforme."),
  ...tri("admin", "users", "buttons", "add", "button", "Add User", "إضافة مستخدم", "Ajouter un utilisateur"),
  ...tri("admin", "users", "table", "email", "label", "Email", "البريد", "E-mail"),
  ...tri("admin", "users", "table", "role", "label", "Role", "الدور", "Rôle"),
  ...tri("admin", "users", "table", "status", "label", "Status", "الحالة", "Statut"),

  ...tri("admin", "missions", "hero", "title", "title", "Missions", "المهام", "Missions"),
  ...tri("admin", "missions", "hero", "subtitle", "subtitle", "Create and manage portal missions.", "إنشاء وإدارة مهام البوابة.", "Créer et gérer les missions du portail."),
  ...tri("admin", "missions", "buttons", "add", "button", "Add Mission", "إضافة مهمة", "Ajouter une mission"),

  ...tri("admin", "rewards", "hero", "title", "title", "Rewards", "المكافآت", "Récompenses"),
  ...tri("admin", "rewards", "hero", "subtitle", "subtitle", "Configure reward catalogs and payouts.", "ضبط كتالوج المكافآت والمدفوعات.", "Configurer le catalogue de récompenses."),

  ...tri("admin", "referrals", "hero", "title", "title", "Referrals", "الإحالات", "Parrainages"),
  ...tri("admin", "referrals", "hero", "subtitle", "subtitle", "Monitor referral program performance.", "مراقبة أداء برنامج الإحالة.", "Surveiller les performances du programme de parrainage."),

  ...tri("admin", "video-submissions", "hero", "title", "title", "Video Review", "مراجعة الفيديو", "Revue vidéo"),
  ...tri("admin", "video-submissions", "hero", "subtitle", "subtitle", "Approve or reject Video Hunter submissions.", "الموافقة على إرسالات صياد الفيديو أو رفضها.", "Approuver ou rejeter les soumissions Video Hunter."),
  ...tri("admin", "video-submissions", "buttons", "approve", "button", "Approve", "موافقة", "Approuver"),
  ...tri("admin", "video-submissions", "buttons", "reject", "button", "Reject", "رفض", "Rejeter"),

  ...tri("admin", "explorer-dna", "hero", "title", "title", "Explorer DNA", "حمض المستكشف", "ADN Explorateur"),
  ...tri("admin", "explorer-dna", "hero", "subtitle", "subtitle", "Manage DNA questions and intelligence modules.", "إدارة أسئلة الحمض ووحدات الذكاء.", "Gérer les questions ADN et modules d'intelligence."),

  ...tri("admin", "mystery-missions", "hero", "title", "title", "Mystery Missions", "المهام الغامضة", "Missions Mystères"),
  ...tri("admin", "mystery-missions", "hero", "subtitle", "subtitle", "Configure hidden and special missions.", "ضبط المهام المخفية والخاصة.", "Configurer les missions cachées et spéciales."),

  ...tri("admin", "dna-questions", "hero", "title", "title", "DNA Questions", "أسئلة الحمض", "Questions ADN"),
  ...tri("admin", "dna-questions", "hero", "subtitle", "subtitle", "Create and reorder continuous DNA questions.", "إنشاء وإعادة ترتيب أسئلة الحمض المستمرة.", "Créer et réordonner les questions ADN continues."),

  ...tri("admin", "notifications", "hero", "title", "title", "Notifications", "الإشعارات", "Notifications"),
  ...tri("admin", "notifications", "hero", "subtitle", "subtitle", "Broadcast portal alerts to explorers.", "بث تنبيهات البوابة للمستكشفين.", "Diffuser des alertes aux explorateurs."),

  ...tri("admin", "roles", "hero", "title", "title", "Roles", "الأدوار", "Rôles"),
  ...tri("admin", "roles", "hero", "subtitle", "subtitle", "Define admin roles and access levels.", "تعريف أدوار المسؤول ومستويات الوصول.", "Définir les rôles admin et niveaux d'accès."),

  ...tri("admin", "permissions", "hero", "title", "title", "Permissions", "الصلاحيات", "Permissions"),
  ...tri("admin", "permissions", "hero", "subtitle", "subtitle", "Fine-grained permission catalog.", "كتالوج الصلاحيات التفصيلي.", "Catalogue de permissions détaillées."),

  ...tri("admin", "audit-logs", "hero", "title", "title", "Audit Logs", "سجلات التدقيق", "Journaux d'audit"),
  ...tri("admin", "audit-logs", "hero", "subtitle", "subtitle", "Track administrative actions across the platform.", "تتبع إجراءات الإدارة عبر المنصة.", "Suivre les actions administratives."),

  ...tri("admin", "support", "hero", "title", "title", "Support", "الدعم", "Support"),
  ...tri("admin", "support", "hero", "subtitle", "subtitle", "Review and respond to support tickets.", "مراجعة تذاكر الدعم والرد عليها.", "Examiner et répondre aux tickets de support."),

  ...tri("admin", "withdrawals", "hero", "title", "title", "Withdrawals", "السحوبات", "Retraits"),
  ...tri("admin", "withdrawals", "hero", "subtitle", "subtitle", "Approve payout requests.", "الموافقة على طلبات الدفع.", "Approuver les demandes de paiement."),

  ...tri("admin", "employees", "hero", "title", "title", "Employees", "الموظفون", "Employés"),
  ...tri("admin", "employees", "hero", "subtitle", "subtitle", "Manage internal staff accounts.", "إدارة حسابات الموظفين الداخليين.", "Gérer les comptes du personnel interne."),

  ...tri("admin", "levels", "hero", "title", "title", "Levels", "المستويات", "Niveaux"),
  ...tri("admin", "levels", "hero", "subtitle", "subtitle", "Configure XP thresholds and level rewards.", "ضبط عتبات نقاط الخبرة ومكافآت المستوى.", "Configurer les seuils XP et récompenses de niveau."),

  ...tri("admin", "challenges", "hero", "title", "title", "Challenges", "التحديات", "Défis"),
  ...tri("admin", "challenges", "hero", "subtitle", "subtitle", "Manage challenge definitions.", "إدارة تعريفات التحديات.", "Gérer les définitions de défis."),

  ...tri("admin", "treasures", "hero", "title", "title", "Treasures", "الكنوز", "Trésors"),
  ...tri("admin", "treasures", "hero", "subtitle", "subtitle", "Configure treasure chests and loot tables.", "ضبط صناديق الكنوز وجداول الغنائم.", "Configurer coffres et tables de butin."),

  ...tri("admin", "leaderboards", "hero", "title", "title", "Leaderboards", "لوحات الصدارة", "Classements"),
  ...tri("admin", "leaderboards", "hero", "subtitle", "subtitle", "Monitor ranking boards.", "مراقبة لوحات الترتيب.", "Surveiller les classements."),

  ...tri("admin", "counters", "hero", "title", "title", "Counters", "العدادات", "Compteurs"),
  ...tri("admin", "counters", "hero", "subtitle", "subtitle", "Platform counter settings.", "إعدادات عدادات المنصة.", "Paramètres des compteurs de la plateforme."),

  ...tri("admin", "content", "buttons", "importMissing", "button", "Import Missing Content", "استيراد المحتوى المفقود", "Importer le contenu manquant"),
  ...tri("admin", "content", "buttons", "syncDefaults", "button", "Sync Defaults", "مزامنة القيم الافتراضية", "Synchroniser les valeurs par défaut"),
  ...tri("admin", "content", "buttons", "saveAll", "button", "Save All", "حفظ الكل", "Tout enregistrer"),
  ...tri("admin", "content", "messages", "unsaved", "notice", "Unsaved changes", "تغييرات غير محفوظة", "Modifications non enregistrées"),
  ...tri("admin", "content", "messages", "upToDate", "notice", "Up to date", "محدّث", "À jour"),
  ...tri("admin", "content", "labels", "auditTitle", "title", "CMS Audit Report", "تقرير تدقيق نظام المحتوى", "Rapport d'audit CMS"),
];

import type { ContentBlockInput, ContentLocale, IContentBlock, PageContentMap } from "@tasks-cash/types";

type SeedRow = Omit<ContentBlockInput, "isActive">;

const SEED_ROWS: SeedRow[] = [
  // Dashboard
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "title", type: "title", locale: "en", value: "Explorer Command Center" },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "en", value: "Your RPG progression hub — currencies, levels, challenges, and secrets." },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "badge", type: "label", locale: "en", value: "Player Dashboard" },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "title", type: "title", locale: "ar", value: "مركز قيادة المستكشف" },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "ar", value: "مركز تقدمك في اللعب — العملات والمستويات والتحديات والأسرار." },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "badge", type: "label", locale: "ar", value: "لوحة اللاعب" },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "title", type: "title", locale: "fr", value: "Centre de Commande Explorateur" },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "fr", value: "Votre hub de progression RPG — devises, niveaux, défis et secrets." },
  { pageKey: "dashboard", sectionKey: "hero", contentKey: "badge", type: "label", locale: "fr", value: "Tableau de bord joueur" },

  // Referrals
  { pageKey: "referrals", sectionKey: "hero", contentKey: "title", type: "title", locale: "en", value: "Referrals" },
  { pageKey: "referrals", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "en", value: "Invite allies, share your QR code, and earn referral rewards" },
  { pageKey: "referrals", sectionKey: "hero", contentKey: "title", type: "title", locale: "ar", value: "الإحالات" },
  { pageKey: "referrals", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "ar", value: "ادعُ الحلفاء، شارك رمز QR، واكسب مكافآت الإحالة" },
  { pageKey: "referrals", sectionKey: "hero", contentKey: "title", type: "title", locale: "fr", value: "Parrainages" },
  { pageKey: "referrals", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "fr", value: "Invitez des alliés, partagez votre QR code et gagnez des récompenses" },

  // Video Hunter
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "title", type: "title", locale: "en", value: "VIDEO HUNTER" },
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "en", value: "Submit public video links, track review status, and earn coins and XP after approval." },
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "eyebrow", type: "label", locale: "en", value: "Submit · Track · Earn" },
  { pageKey: "video-hunter", sectionKey: "form", contentKey: "submitButton", type: "button", locale: "en", value: "Submit Video Link" },
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "title", type: "title", locale: "ar", value: "صياد الفيديو" },
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "ar", value: "أرسل روابط فيديو عامة، تتبع حالة المراجعة، واكسب العملات ونقاط الخبرة بعد الموافقة." },
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "title", type: "title", locale: "fr", value: "CHASSEUR VIDÉO" },
  { pageKey: "video-hunter", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "fr", value: "Soumettez des liens vidéo publics, suivez le statut de révision et gagnez des pièces et de l'XP après approbation." },
  { pageKey: "video-hunter", sectionKey: "form", contentKey: "submitButton", type: "button", locale: "fr", value: "Soumettre le lien vidéo" },

  // Mystery Missions / Identity Challenge
  { pageKey: "mystery-missions", sectionKey: "hero", contentKey: "title", type: "title", locale: "en", value: "Special Missions" },
  { pageKey: "mystery-missions", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "en", value: "Identity challenges, secret objectives, and classified portal operations." },
  { pageKey: "mystery-missions", sectionKey: "hero", contentKey: "title", type: "title", locale: "ar", value: "مهام خاصة" },
  { pageKey: "mystery-missions", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "ar", value: "تحديات الهوية، أهداف سرية، وعمليات البوابة المصنفة." },
  { pageKey: "mystery-missions", sectionKey: "hero", contentKey: "title", type: "title", locale: "fr", value: "Missions Spéciales" },
  { pageKey: "mystery-missions", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "fr", value: "Défis d'identité, objectifs secrets et opérations classifiées du portail." },

  // Explorer DNA
  { pageKey: "explorer-dna", sectionKey: "hero", contentKey: "title", type: "title", locale: "en", value: "Explorer DNA" },
  { pageKey: "explorer-dna", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "en", value: "Build your Explorer DNA. The more we understand your skills, interests, experience, and goals, the better we can recommend missions and rewards designed specifically for you." },
  { pageKey: "explorer-dna", sectionKey: "hero", contentKey: "title", type: "title", locale: "ar", value: "حمض المستكشف" },
  { pageKey: "explorer-dna", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "ar", value: "ابنِ حمض المستكشف الخاص بك. كلما فهمنا مهاراتك واهتماماتك وخبرتك وأهدافك بشكل أفضل، كلما استطعنا التوصية بمهام ومكافآت مصممة خصيصاً لك." },
  { pageKey: "explorer-dna", sectionKey: "hero", contentKey: "title", type: "title", locale: "fr", value: "ADN Explorateur" },
  { pageKey: "explorer-dna", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "fr", value: "Construisez votre ADN Explorateur. Plus nous comprenons vos compétences, intérêts, expérience et objectifs, mieux nous pouvons recommander des missions et récompenses conçues pour vous." },

  // Referral Arena label
  { pageKey: "referral-arena", sectionKey: "hero", contentKey: "title", type: "title", locale: "en", value: "Referral Arena" },
  { pageKey: "referral-arena", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "en", value: "Grow the portal network and earn rewards for every active ally you recruit." },
  { pageKey: "referral-arena", sectionKey: "hero", contentKey: "title", type: "title", locale: "fr", value: "Arène de Parrainage" },
  { pageKey: "referral-arena", sectionKey: "hero", contentKey: "subtitle", type: "subtitle", locale: "fr", value: "Développez le réseau du portail et gagnez des récompenses pour chaque allié actif recruté." },
];

let blocks: IContentBlock[] = SEED_ROWS.map((row, index) => ({
  id: `content_${index + 1}`,
  ...row,
  isActive: true,
  updatedAt: new Date().toISOString(),
}));

function toMap(rows: IContentBlock[]): PageContentMap {
  const map: PageContentMap = {};
  for (const row of rows) {
    if (row.isActive) map[row.contentKey] = row.value;
  }
  return map;
}

export function listContentBlocks(filters?: {
  pageKey?: string;
  locale?: ContentLocale;
}): IContentBlock[] {
  return blocks.filter((b) => {
    if (filters?.pageKey && b.pageKey !== filters.pageKey) return false;
    if (filters?.locale && b.locale !== filters.locale) return false;
    return true;
  });
}

export function getPageContent(pageKey: string, locale: ContentLocale): PageContentMap {
  const rows = blocks.filter((b) => b.pageKey === pageKey && b.locale === locale && b.isActive);
  if (rows.length === 0 && locale !== "en") {
    return toMap(blocks.filter((b) => b.pageKey === pageKey && b.locale === "en" && b.isActive));
  }
  return toMap(rows);
}

export function createContentBlock(input: ContentBlockInput): IContentBlock {
  const block: IContentBlock = {
    id: `content_${Date.now()}`,
    pageKey: input.pageKey,
    sectionKey: input.sectionKey,
    contentKey: input.contentKey,
    type: input.type,
    value: input.value,
    locale: input.locale,
    isActive: input.isActive ?? true,
    updatedAt: new Date().toISOString(),
  };
  blocks.push(block);
  return block;
}

export function updateContentBlock(id: string, patch: Partial<ContentBlockInput>): IContentBlock | null {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  blocks[idx] = {
    ...blocks[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return blocks[idx];
}

export function deleteContentBlock(id: string): boolean {
  const before = blocks.length;
  blocks = blocks.filter((b) => b.id !== id);
  return blocks.length < before;
}

export function listPageKeys(): string[] {
  return [...new Set(blocks.map((b) => b.pageKey))].sort();
}

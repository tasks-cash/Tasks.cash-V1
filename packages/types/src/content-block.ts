/** Editable CMS content blocks */

export type ContentBlockType =
  | "title"
  | "subtitle"
  | "description"
  | "button"
  | "label"
  | "notice";

export type ContentLocale = "en" | "ar" | "fr";

export interface IContentBlock {
  id: string;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  value: string;
  locale: ContentLocale;
  isActive: boolean;
  updatedAt: string;
}

export interface ContentBlockInput {
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  value: string;
  locale: ContentLocale;
  isActive?: boolean;
}

export type PageContentMap = Record<string, string>;

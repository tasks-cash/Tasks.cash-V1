/** Editable CMS content blocks */

export type ContentAppKey = "main" | "challenge" | "admin";

export type ContentBlockType =
  | "title"
  | "subtitle"
  | "description"
  | "button"
  | "label"
  | "placeholder"
  | "empty_state"
  | "error_message"
  | "success_message"
  | "badge"
  | "nav"
  | "notice";

export type ContentLocale = "en" | "ar" | "fr";

export interface IContentBlock {
  id: string;
  appKey: ContentAppKey;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  value: string;
  defaultValue: string;
  locale: ContentLocale;
  isActive: boolean;
  createdAt?: string;
  updatedAt: string;
}

export interface ContentBlockInput {
  appKey: ContentAppKey;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  value: string;
  defaultValue?: string;
  locale: ContentLocale;
  isActive?: boolean;
}

export type SectionContentMap = Record<string, string>;
export type PageSectionsMap = Record<string, SectionContentMap>;

export interface PageContentResponse {
  appKey: ContentAppKey;
  pageKey: string;
  locale: ContentLocale;
  sections: PageSectionsMap;
}

/** @deprecated Use PageSectionsMap via useContent */
export type PageContentMap = Record<string, string>;

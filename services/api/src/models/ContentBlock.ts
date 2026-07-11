import mongoose, { Document, Schema } from "mongoose";
import type { ContentAppKey, ContentBlockType, ContentLocale } from "@tasks-cash/types";

export interface IContentBlockDocument extends Document {
  appKey: ContentAppKey;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  value: string;
  defaultValue: string;
  description?: string;
  locale: ContentLocale;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CONTENT_TYPES = [
  "title",
  "subtitle",
  "description",
  "button",
  "label",
  "placeholder",
  "empty_state",
  "error_message",
  "success_message",
  "badge",
  "nav",
  "notice",
] as const;

const contentBlockSchema = new Schema<IContentBlockDocument>(
  {
    appKey: { type: String, enum: ["main", "challenge", "admin"], required: true, index: true, default: "main" },
    pageKey: { type: String, required: true, trim: true, index: true },
    sectionKey: { type: String, required: true, trim: true, default: "main" },
    contentKey: { type: String, required: true, trim: true },
    type: { type: String, enum: CONTENT_TYPES, required: true },
    // Do not trim value — multiline / intentional whitespace must persist
    value: { type: String, required: true, default: "" },
    defaultValue: { type: String, required: true, default: "" },
    description: { type: String, default: "" },
    locale: { type: String, enum: ["en", "ar", "fr"], required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

contentBlockSchema.index(
  { appKey: 1, pageKey: 1, sectionKey: 1, contentKey: 1, locale: 1 },
  { unique: true }
);

export const ContentBlock =
  mongoose.models.ContentBlock ??
  mongoose.model<IContentBlockDocument>("ContentBlock", contentBlockSchema);

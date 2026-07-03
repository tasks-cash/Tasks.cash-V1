import mongoose, { Document, Schema } from "mongoose";
import type { ContentBlockType, ContentLocale } from "@tasks-cash/types";

export interface IContentBlockDocument extends Document {
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: ContentBlockType;
  value: string;
  locale: ContentLocale;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contentBlockSchema = new Schema<IContentBlockDocument>(
  {
    pageKey: { type: String, required: true, trim: true, index: true },
    sectionKey: { type: String, required: true, trim: true, default: "main" },
    contentKey: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["title", "subtitle", "description", "button", "label", "notice"],
      required: true,
    },
    value: { type: String, required: true, trim: true },
    locale: { type: String, enum: ["en", "ar", "fr"], required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

contentBlockSchema.index({ pageKey: 1, locale: 1, contentKey: 1 }, { unique: true });

export const ContentBlock =
  mongoose.models.ContentBlock ??
  mongoose.model<IContentBlockDocument>("ContentBlock", contentBlockSchema);

"use client";

import { useEffect } from "react";
import { useI18n } from "./I18nProvider";

export function LocaleHtmlAttributes() {
  const { locale, dir } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}

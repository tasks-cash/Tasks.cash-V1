"use client";

import { useEffect } from "react";
import { useI18n } from "./I18nProvider";

/** Sets document lang and dir from route-based locale */
export function LocaleHtmlAttributes() {
  const { locale, dir } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}

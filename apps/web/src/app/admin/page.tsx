"use client";

import { useEffect } from "react";
import { ADMIN_APP_URL } from "@/config/routes";

/** Redirect to the admin app (runs on port 3002 by default). */
export default function AdminRedirectPage() {
  useEffect(() => {
    window.location.href = ADMIN_APP_URL;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-purple-200">
      <p className="text-sm">Redirecting to admin panel...</p>
    </div>
  );
}

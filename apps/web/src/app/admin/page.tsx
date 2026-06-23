"use client";

import { useEffect } from "react";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

/** Redirect to the admin app (runs on port 3001 by default). */
export default function AdminRedirectPage() {
  useEffect(() => {
    window.location.href = ADMIN_URL;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-purple-200">
      <p className="text-sm">Redirecting to admin panel...</p>
    </div>
  );
}

/** Admin app runs on :3001; main web app on :3000 */
export const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";
export const EXPLORER_DNA_PATH = "/explorer-dna";
export const EXPLORER_DNA_URL = `${process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001"}${EXPLORER_DNA_PATH}`;
export const MAIN_APP_DASHBOARD_URL = `${WEB_APP_URL}/dashboard`;

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const required = (value: string | undefined, name: string) => {
  if (!value) throw new Error(`${name} is missing`);
  return value;
};

export const APP_URL = required(process.env.NEXT_PUBLIC_MAIN_APP_URL, "APP_URL");
export const ADMIN_URL = required(process.env.NEXT_PUBLIC_ADMIN_APP_URL, "ADMIN_URL");
export const CHALLENGE_APP_URL = required(process.env.NEXT_PUBLIC_CHALLENGE_APP_URL,
  "CHALLENGE_APP_URL");
export const API_PUBLIC_URL = required(process.env.API_URL, "API_URL");

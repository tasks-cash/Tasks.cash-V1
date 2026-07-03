const required = (value: string | undefined, name: string) => {
  if (!value) throw new Error(`${name} is missing`);
  return value;
};

export const MAIN_APP_URL = required(process.env.NEXT_PUBLIC_MAIN_APP_URL, "NEXT_PUBLIC_MAIN_APP_URL");
export const API_URL = required(process.env.NEXT_PUBLIC_API_URL, "NEXT_PUBLIC_API_URL");
export const CHALLENGE_APP_URL = required(process.env.NEXT_PUBLIC_CHALLENGE_APP_URL, "NEXT_PUBLIC_CHALLENGE_APP_URL");
export const ADMIN_APP_URL = required(process.env.NEXT_PUBLIC_ADMIN_APP_URL, "NEXT_PUBLIC_ADMIN_APP_URL");

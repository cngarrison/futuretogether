/** True when running in production. */
export function isProduction(): boolean {
  return Deno.env.get("APP_ENV") === "production";
}

/** True when not running in production. */
export function isLocalDev(): boolean {
  return Deno.env.get("APP_ENV") !== "production";
}

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const errorMessage = (error: unknown): string => {
  if (isError(error)) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

export const errorName = (error: unknown): string => {
  return isError(error) ? error.name : String(error);
};

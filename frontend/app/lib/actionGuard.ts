/** True when an async action is already in flight and should block duplicate submits. */
export function isActionBusy(flag: string | null | boolean | undefined): boolean {
  return flag === true || (typeof flag === "string" && flag.length > 0);
}

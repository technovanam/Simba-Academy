import type { AccountStatus, User } from "@prisma/client";
import { ForbiddenError } from "./errors.js";

type AuthCheckUser = Pick<User, "status" | "isDeleted">;

export function assertAccountCanAuthenticate(user: AuthCheckUser): void {
  if (user.isDeleted) {
    throw new ForbiddenError("Account is deactivated");
  }
  if (user.status !== "ACTIVE") {
    throw new ForbiddenError("Account is deactivated");
  }
}

export function isAccountActive(status: AccountStatus): boolean {
  return status === "ACTIVE";
}

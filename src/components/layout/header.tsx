import { HeaderClient } from "@/components/layout/header-client";
import { getSession } from "@/server/auth/session";

export async function Header() {
  const user = await getSession();

  return (
    <HeaderClient
      user={
        user
          ? {
              firstName: user.name.trim().split(/\s+/)[0] || user.name,
              isAdmin: user.role === "ADMIN",
            }
          : null
      }
    />
  );
}

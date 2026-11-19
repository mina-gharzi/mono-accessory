import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  prisma: {},
}));

import {
  buildAdminCustomersHref,
  parseAdminCustomersQuery,
} from "@/server/admin-customers";

describe("parseAdminCustomersQuery", () => {
  it("defaults to the customers filter", () => {
    expect(parseAdminCustomersQuery({})).toEqual({
      q: null,
      page: 1,
      role: "customers",
    });
  });

  it("accepts the three role filters", () => {
    expect(parseAdminCustomersQuery({ role: "customers" }).role).toBe(
      "customers"
    );
    expect(parseAdminCustomersQuery({ role: "admins" }).role).toBe("admins");
    expect(parseAdminCustomersQuery({ role: "all" }).role).toBe("all");
  });

  it("falls back to customers for an unknown or repeated role", () => {
    expect(parseAdminCustomersQuery({ role: "owner" }).role).toBe("customers");
    expect(parseAdminCustomersQuery({ role: ["admins"] }).role).toBe(
      "customers"
    );
  });

  it("normalizes the search term and parses the page", () => {
    expect(parseAdminCustomersQuery({ q: "  كيف  ", page: "۲" })).toEqual({
      q: "کیف",
      page: 2,
      role: "customers",
    });
  });
});

describe("buildAdminCustomersHref", () => {
  it("omits the default role and the first page", () => {
    expect(
      buildAdminCustomersHref({ q: null, page: 1, role: "customers" })
    ).toBe("/admin/customers");
  });

  it("keeps a non-default role and the search term", () => {
    expect(
      buildAdminCustomersHref({ q: "علی", page: 3, role: "admins" })
    ).toBe("/admin/customers?q=%D8%B9%D9%84%DB%8C&role=admins");
  });

  it("resets the page unless the override sets it", () => {
    expect(
      buildAdminCustomersHref(
        { q: null, page: 4, role: "all" },
        { role: "admins" }
      )
    ).toBe("/admin/customers?role=admins");

    expect(
      buildAdminCustomersHref({ q: null, page: 4, role: "all" }, { page: 5 })
    ).toBe("/admin/customers?role=all&page=5");
  });
});

import { describe, expect, it } from "vitest";
import { normalizeSearchTerm, parseShopQuery } from "@/server/products";

describe("normalizeSearchTerm", () => {
  it("converts Arabic yeh and kaf to Persian", () => {
    expect(normalizeSearchTerm("كيف")).toBe("کیف");
    expect(normalizeSearchTerm("ي")).toBe("ی");
  });

  it("converts Persian and Arabic digits to English", () => {
    expect(normalizeSearchTerm("گردنبند ۱۲۳")).toBe("گردنبند 123");
    expect(normalizeSearchTerm("مدل ٤٥٦")).toBe("مدل 456");
  });

  it("collapses whitespace and trims", () => {
    expect(normalizeSearchTerm("  دستبند   طلا  ")).toBe("دستبند طلا");
  });
});

describe("parseShopQuery", () => {
  it("falls back to defaults for an empty query", () => {
    expect(parseShopQuery({})).toEqual({
      q: null,
      category: null,
      collection: null,
      color: null,
      minPrice: null,
      maxPrice: null,
      inStock: false,
      sort: "newest",
      page: 1,
    });
  });

  it("normalizes the search term", () => {
    expect(parseShopQuery({ q: "  كيف  " }).q).toBe("کیف");
    expect(parseShopQuery({ q: "   " }).q).toBeNull();
  });

  it("parses valid filters", () => {
    const query = parseShopQuery({
      category: "rings",
      collection: "bestsellers",
      color: "طلایی",
      minPrice: "۱۰۰۰",
      maxPrice: "50000",
      inStock: "1",
      sort: "price-asc",
      page: "2",
    });

    expect(query).toMatchObject({
      category: "rings",
      collection: "bestsellers",
      color: "طلایی",
      minPrice: 1000,
      maxPrice: 50_000,
      inStock: true,
      sort: "price-asc",
      page: 2,
    });
  });

  it("accepts the other in-stock spellings", () => {
    expect(parseShopQuery({ inStock: "true" }).inStock).toBe(true);
    expect(parseShopQuery({ inStock: "on" }).inStock).toBe(true);
    expect(parseShopQuery({ inStock: "0" }).inStock).toBe(false);
  });

  it("swaps an inverted price range", () => {
    const query = parseShopQuery({ minPrice: "500", maxPrice: "100" });

    expect(query.minPrice).toBe(100);
    expect(query.maxPrice).toBe(500);
  });

  it("falls back to defaults for invalid params", () => {
    const query = parseShopQuery({
      minPrice: "-5",
      maxPrice: "abc",
      page: "0",
      sort: "cheapest",
    });

    expect(query.minPrice).toBeNull();
    expect(query.maxPrice).toBeNull();
    expect(query.page).toBe(1);
    expect(query.sort).toBe("newest");
  });

  it("caps the page and the search term length", () => {
    expect(parseShopQuery({ page: "1001" }).page).toBe(1);
    expect(parseShopQuery({ q: "ا".repeat(100) }).q).toHaveLength(80);
  });

  it("ignores repeated query params", () => {
    const query = parseShopQuery({ category: ["rings", "earrings"] });

    expect(query.category).toBeNull();
  });
});

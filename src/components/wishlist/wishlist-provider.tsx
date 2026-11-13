"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WishlistContextValue = {
  ids: ReadonlySet<string>;
  ready: boolean;
  seed: (ids: string[]) => void;
  setWishlisted: (productId: string, wishlisted: boolean) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider.");
  }

  return context;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  const seed = useCallback((nextIds: string[]) => {
    setIds(new Set(nextIds));
    setReady(true);
  }, []);

  const setWishlisted = useCallback(
    (productId: string, wishlisted: boolean) => {
      setIds((current) => {
        const next = new Set(current);

        if (wishlisted) {
          next.add(productId);
        } else {
          next.delete(productId);
        }

        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ ids, ready, seed, setWishlisted }),
    [ids, ready, seed, setWishlisted]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function WishlistSeedClient({ ids }: { ids: string[] }) {
  const { seed } = useWishlist();

  useEffect(() => {
    seed(ids);
  }, [ids, seed]);

  return null;
}

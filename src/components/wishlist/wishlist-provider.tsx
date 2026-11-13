"use client";

import { useEffect, useSyncExternalStore } from "react";

type WishlistSnapshot = {
  ids: ReadonlySet<string>;
};

const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

// The server shell is static, so the server snapshot has to be the same for
// every request. Starting ready with an empty set keeps logged-out visitors
// from seeing a disabled heart, and useSyncExternalStore uses this snapshot
// during hydration so the first client render always matches the server HTML.
const SERVER_SNAPSHOT: WishlistSnapshot = { ids: EMPTY_IDS };

let snapshot: WishlistSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function setSnapshot(next: WishlistSnapshot) {
  snapshot = next;

  for (const listener of listeners) {
    listener();
  }
}

export function seedWishlist(ids: string[]) {
  const unchanged =
    ids.length === snapshot.ids.size &&
    ids.every((id) => snapshot.ids.has(id));

  if (unchanged) return;

  setSnapshot({ ids: new Set(ids) });
}

export function setWishlisted(productId: string, wishlisted: boolean) {
  const next = new Set(snapshot.ids);

  if (wishlisted) {
    next.add(productId);
  } else {
    next.delete(productId);
  }

  setSnapshot({ ids: next });
}

export function useWishlist() {
  const { ids } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return { ids, setWishlisted };
}

export function WishlistSeedClient({ ids }: { ids: string[] }) {
  useEffect(() => {
    seedWishlist(ids);
  }, [ids]);

  return null;
}

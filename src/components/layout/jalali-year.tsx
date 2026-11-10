"use client";

import { useSyncExternalStore } from "react";

const yearFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
});

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return yearFormatter.format(new Date());
}

function getServerSnapshot() {
  return "";
}

export function JalaliYear() {
  const year = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <>{year}</>;
}

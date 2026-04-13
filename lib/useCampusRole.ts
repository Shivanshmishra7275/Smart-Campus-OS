"use client";

import { useSyncExternalStore } from "react";

export type Role = "student" | "admin";

export const ROLE_STORAGE_KEY = "campusos-role";

type Snapshot = {
  role: Role | null;
  ready: boolean;
};

const SERVER_SNAPSHOT: Snapshot = {
  role: null,
  ready: false,
};

// Cached client snapshot so useSyncExternalStore sees a stable
// reference when the underlying role value has not changed.
let clientSnapshot: Snapshot = SERVER_SNAPSHOT;

const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

const getClientSnapshot = (): Snapshot => {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
  const role: Role | null =
    storedRole === "student" || storedRole === "admin" ? storedRole : null;

  const next: Snapshot = { role, ready: true };

  if (
    clientSnapshot.role === next.role &&
    clientSnapshot.ready === next.ready
  ) {
    return clientSnapshot;
  }

  clientSnapshot = next;
  return clientSnapshot;
};

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key === ROLE_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
};

export function useCampusRole(): Snapshot {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

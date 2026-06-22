"use client";
import { useEffect } from "react";
import { LOCAL_STORAGE_KEY } from "@/utils/constants";
import type { WorkbenchState } from "@/lib/types";

export function usePersist(state: WorkbenchState) {
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota exceeded or SSR — ignore
    }
  }, [state]);
}

"use client";
import { useState, useCallback } from "react";

export interface Toast {
  msg: string;
  ico: string;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((msg: string, ico = "check-circle") => {
    setToast({ msg, ico });
    setTimeout(() => setToast(null), 2600);
  }, []);

  return { toast, showToast };
}

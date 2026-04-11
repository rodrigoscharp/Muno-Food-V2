"use client";

import { useCallback } from "react";

const SESSION_KEY = "muno-table";

export interface TableContext {
  tableId: string;
  tableNumber: number;
  tableName: string | null;
  tableToken: string;
}

export function useTable() {
  const getTable = useCallback((): TableContext | null => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TableContext;
    } catch {
      return null;
    }
  }, []);

  const setTable = useCallback((ctx: TableContext) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ctx));
  }, []);

  const clearTable = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return { getTable, setTable, clearTable };
}

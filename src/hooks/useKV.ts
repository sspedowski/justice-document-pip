import { useEffect, useState } from "react";

export function useKV<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  
  useEffect(() => {
    try { 
      localStorage.setItem(key, JSON.stringify(value)); 
    } catch {}
  }, [key, value]);
  
  return [value, setValue] as const;
}
"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "council_admin_password";

export function useAdmin() {
  const [password, setPassword] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPassword(sessionStorage.getItem(KEY));
    setReady(true);
  }, []);

  const login = useCallback((pwd: string) => {
    sessionStorage.setItem(KEY, pwd);
    setPassword(pwd);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setPassword(null);
  }, []);

  return { isAdmin: password !== null, password, login, logout, ready };
}

export const readSidebarCollapsed = (storageKey: string): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue === "true";
  } catch {
    return false;
  }
};

export const writeSidebarCollapsed = (storageKey: string, collapsed: boolean): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, collapsed ? "true" : "false");
  } catch {
    // The sidebar still works when storage is blocked or unavailable.
  }
};

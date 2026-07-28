// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { readSidebarCollapsed, writeSidebarCollapsed } from "./sidebarState";

describe("sidebarState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses expanded mode when no stored value exists", () => {
    expect(readSidebarCollapsed("sidebar-test")).toBe(false);
  });

  it("accepts only the explicit true value", () => {
    window.localStorage.setItem("sidebar-test", "true");
    expect(readSidebarCollapsed("sidebar-test")).toBe(true);

    window.localStorage.setItem("sidebar-test", "invalid");
    expect(readSidebarCollapsed("sidebar-test")).toBe(false);
  });

  it("stores a normalized boolean value", () => {
    writeSidebarCollapsed("sidebar-test", true);
    expect(window.localStorage.getItem("sidebar-test")).toBe("true");

    writeSidebarCollapsed("sidebar-test", false);
    expect(window.localStorage.getItem("sidebar-test")).toBe("false");
  });
});

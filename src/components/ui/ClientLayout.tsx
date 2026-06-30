"use client";

import { type ReactNode } from "react";
import { MouseFollower, MouseTrail } from "@/components/ui/MouseFollower";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MouseFollower />
      <MouseTrail />
      {children}
    </>
  );
}

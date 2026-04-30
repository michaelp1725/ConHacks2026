"use client";

import { useEffect } from "react";

/** Restores `body.onboarding-view` for landing CSS (background, onboarding layout). */
export function BodyOnboardingView() {
  useEffect(() => {
    document.body.classList.add("onboarding-view");
    return () => document.body.classList.remove("onboarding-view");
  }, []);
  return null;
}

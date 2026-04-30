import type { Metadata } from "next";
import { CaseExperience } from "@/components/case/CaseExperience";

export const metadata: Metadata = {
  title: "Case",
  description: "Legal research and case preparation assistant.",
};

export default function Home() {
  return <CaseExperience />;
}

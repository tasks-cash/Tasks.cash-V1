import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SpecialMissionsPage } from "@/components/pages/SpecialMissionsPage";
import "@/styles/special-missions.css";

export default function SpecialMissionsRoute() {
  return (
    <ChallengeShell>
      <SpecialMissionsPage />
    </ChallengeShell>
  );
}

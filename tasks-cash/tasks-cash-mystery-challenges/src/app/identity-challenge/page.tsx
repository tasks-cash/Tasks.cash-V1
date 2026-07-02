import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { IdentityChallengeSection } from "@/components/arena/IdentityChallengeSection";
import "@/styles/identity-challenge.css";

export default function IdentityChallengePage() {
  return (
    <ChallengeShell>
      <IdentityChallengeSection variant="page" />
    </ChallengeShell>
  );
}

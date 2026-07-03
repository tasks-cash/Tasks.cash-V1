import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SpecialMissionDetailPage } from "@/components/pages/SpecialMissionDetailPage";
import "@/styles/special-missions.css";

export default async function SpecialMissionDetailRoute({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;

  return (
    <ChallengeShell>
      <SpecialMissionDetailPage missionId={missionId} />
    </ChallengeShell>
  );
}

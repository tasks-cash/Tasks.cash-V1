import type { MiraajLocalStatus } from "./models";
import { MiraajIntegrationError } from "./errors";
const transitions: Record<MiraajLocalStatus, readonly MiraajLocalStatus[]> = {
  pending:["submitting","cancelling","synchronization_required"], submitting:["accepted","queued","running","failed","timed_out","cancelling","synchronization_required"],
  accepted:["queued","running","succeeded","failed","cancelling","synchronization_required"], queued:["running","succeeded","failed","cancelling","synchronization_required"],
  running:["succeeded","failed","cancelling","timed_out","synchronization_required"], cancelling:["cancelled","failed","synchronization_required"],
  synchronization_required:["accepted","queued","running","succeeded","failed","cancelling","cancelled","timed_out"],
  succeeded:[], failed:[], cancelled:[], timed_out:["synchronization_required"],
};
export function assertTransition(from: MiraajLocalStatus, to: MiraajLocalStatus): void {
  if (from === to) return;
  if (!transitions[from].includes(to)) throw new MiraajIntegrationError("validation_error", `Invalid Miraaj execution transition ${from} -> ${to}`, false, 409);
}

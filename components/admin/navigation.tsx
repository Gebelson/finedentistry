import type { ServerProps } from "payload";
import { WorkspaceNavigation } from "./workspace-navigation";
import { ReceptionLiveUpdates } from "./reception-live-updates";
export function WorkspaceNav({ user }: ServerProps) {
  if (!user) return null;
  return (
    <>
      {["admin", "reception"].includes(user.role) && <ReceptionLiveUpdates />}
      <WorkspaceNavigation name={user.name} role={user.role} />
    </>
  );
}

import type { ServerProps } from "payload";
import { WorkspaceNavigation } from "./workspace-navigation";
export function WorkspaceNav({ user }: ServerProps) {
  if (!user) return null;
  return <WorkspaceNavigation name={user.name} role={user.role} />;
}

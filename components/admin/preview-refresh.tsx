"use client";
import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
export function PreviewRefresh() {
  const router = useRouter();
  return (
    <RefreshRouteOnSave
      refresh={router.refresh}
      serverURL={typeof window === "undefined" ? "" : window.location.origin}
    />
  );
}

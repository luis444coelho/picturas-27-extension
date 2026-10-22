"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "@/providers/session-provider";
import { useProjectInfo } from "@/providers/project-provider";
import { VideoTarget } from "@/lib/videos";

// Same owner/share resolution as the project page (?owner=…&share=…).
export function useVideoTarget(): VideoTarget {
  const session = useSession();
  const project = useProjectInfo();
  const searchParams = useSearchParams();

  return {
    uid: session.user._id,
    pid: project._id,
    token: session.token,
    ownerId: searchParams.get("owner") ?? session.user._id,
    shareId: searchParams.get("share") ?? undefined,
  };
}

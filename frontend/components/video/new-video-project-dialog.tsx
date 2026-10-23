"use client";

import { useCallback, useState } from "react";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/providers/session-provider";
import {
  NewVideoProjectForm,
  VideoProjectIngestNotice,
} from "./new-video-project-form";

// Standalone D-30 entry point; the same form is embedded in New Project.
export function NewVideoProjectDialog() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (session.user.type === "anonymous") return null;

  return (
    <>
      <VideoProjectIngestNotice />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button className="inline-flex" variant="outline">
            <Film /> Novo projeto com vídeo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <NewVideoProjectForm onClose={close} onBusyChange={setBusy} />
        </DialogContent>
      </Dialog>
    </>
  );
}

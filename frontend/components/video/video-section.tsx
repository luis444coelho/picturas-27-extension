"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProjectInfo } from "@/providers/project-provider";

// Header switch. The page keeps its existing JSX and the workspace already
// mounted at the D-31 point responds to the resource query parameter.
export function VideoSection() {
  const router = useRouter();
  const search = useSearchParams();
  const project = useProjectInfo();
  const explicit = search.get("resource");
  const resource =
    explicit === "videos" ||
    (explicit !== "images" && project.imgs.length === 0)
      ? "videos"
      : "images";
  const select = (next: "images" | "videos") => {
    const params = new URLSearchParams(search.toString());
    params.set("resource", next);
    router.push(`?${params.toString()}`);
  };
  return (
    <div role="group" aria-label="Tipo de recurso" className="flex gap-1">
      <Button
        type="button"
        size="sm"
        variant={resource === "images" ? "default" : "outline"}
        aria-pressed={resource === "images"}
        onClick={() => select("images")}
      >
        Imagens
      </Button>
      <Button
        type="button"
        size="sm"
        variant={resource === "videos" ? "default" : "outline"}
        aria-pressed={resource === "videos"}
        onClick={() => select("videos")}
      >
        Vídeos
      </Button>
    </div>
  );
}

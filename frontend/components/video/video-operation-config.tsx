"use client";

import type { ComponentType } from "react";
import type { ChainOperation } from "@/lib/video-chain";
import type { ConfigActions, OperationConfigProps } from "./operation-config";
import { TrimConfig } from "./video-trim-panel";
import { RemoveAudioConfig } from "./video-remove-audio-panel";
import { SpeedConfig } from "./video-speed-panel";
import { WatermarkConfig } from "./video-watermark-panel";
import { AdjustConfig } from "./video-adjust-panel";
import { FilterConfig } from "./video-filter-panel";
import { ResizeConfig } from "./video-resize-panel";
import { OrientConfig } from "./video-orient-panel";
import { ConvertConfig } from "./video-convert-actions";

// The configuration component of every operation, extracted from the simple
// edit panels (D-87, ADR-020): the compositions use exactly these controls.
export const OPERATION_CONFIGS = {
  trim: TrimConfig,
  remove_audio: RemoveAudioConfig,
  speed: SpeedConfig,
  watermark: WatermarkConfig,
  adjust: AdjustConfig,
  filter: FilterConfig,
  resize: ResizeConfig,
  orient: OrientConfig,
  convert: ConvertConfig,
} as Record<ChainOperation, ComponentType<OperationConfigProps<ConfigActions>>>;

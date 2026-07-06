import type { BlockActionType, BlockType } from "@/types/block";

export const blockTypes: BlockType[] = [
  "link",
  "project",
  "image",
  "text",
  "section",
  "social",
  "video",
  "status"
];

export const blockActionTypes: BlockActionType[] = [
  "none",
  "link",
  "image-preview",
  "modal",
  "copy",
  "download"
];

"use client";

import type { Block, BlockActionType, BlockType } from "@/types/block";
import { blockActionTypes } from "@/constants/block-types";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";

const iconPresets = ["link", "github", "twitter", "instagram", "youtube", "linkedin", "website", "activity", "map", "chef-hat"];
const blockTypeLabels: Record<BlockType, string> = {
  link: "链接/link",
  project: "项目/project",
  image: "图片/image",
  text: "文字/text",
  section: "文本 Block/section",
  social: "社交/social",
  video: "视频/video",
  status: "状态/status"
};
const actionTypeLabels: Record<BlockActionType, string> = {
  none: "无动作/none",
  link: "前往链接/link",
  "image-preview": "图片预览/image preview",
  modal: "弹窗/modal",
  copy: "复制内容/copy",
  download: "下载/download"
};

export function BlockForm({
  block,
  onPatch
}: {
  block: Block;
  onPatch: (patch: Partial<Block>) => void;
}) {
  const copyText = typeof block.metadata?.copyText === "string" ? block.metadata.copyText : "";
  const isSectionBlock = block.type === "section";

  function patchHref(value: string) {
    onPatch({ href: value, icon: inferIconFromUrl(value, block.icon) });
  }

  return (
    <div className="grid gap-5 text-[#333]">
      {!isSectionBlock ? (
        <ImageCropUploader
          folder="blocks"
          value={block.coverImage}
          label="🖼️ 封面/cover"
          buttonText="更换图片"
          onUploaded={(url) => onPatch({ coverImage: url })}
          onClear={() => onPatch({ coverImage: "" })}
        />
      ) : null}

      <div className="grid gap-3">
        <Field label="标题/title">
          <Input
            value={block.title}
            onChange={(event) => onPatch({ title: event.target.value })}
          />
        </Field>
        <Field label="副标题/subtitle">
          <Input
            value={block.subtitle ?? ""}
            onChange={(event) => onPatch({ subtitle: event.target.value })}
          />
        </Field>
        {!isSectionBlock ? <Field label="描述/description">
          <Textarea
            value={block.description ?? ""}
            onChange={(event) => onPatch({ description: event.target.value })}
            className="min-h-28"
          />
        </Field> : null}
        {!isSectionBlock ? <Field label="链接/link">
          <Input
            value={block.href ?? ""}
            onChange={(event) => patchHref(event.target.value)}
            placeholder="填入链接"
          />
        </Field> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="类型/type">
            <Select value={block.type} onChange={(event) => onPatch({ type: event.target.value as BlockType })}>
              {(Object.keys(blockTypeLabels) as BlockType[]).map((type) => (
                <option key={type} value={type}>
                  {blockTypeLabels[type]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {isSectionBlock ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="标题对齐/title align">
              <Select
                value={getSectionMetadataValue(block.metadata?.titleAlign, ["left", "center", "right"], "left")}
                onChange={(event) => onPatch({ metadata: { ...(block.metadata ?? {}), titleAlign: event.target.value } })}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </Select>
            </Field>
            <Field label="标题大小/title size">
              <Select
                value={getSectionMetadataValue(block.metadata?.titleSize, ["sm", "md", "lg"], "md")}
                onChange={(event) => onPatch({ metadata: { ...(block.metadata ?? {}), titleSize: event.target.value } })}
              >
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </Select>
            </Field>
          </div>
        ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="动作/action">
            <Select
              value={block.actionType}
              onChange={(event) => onPatch({ actionType: event.target.value as BlockActionType })}
            >
              {blockActionTypes.map((action) => (
                <option key={action} value={action}>
                  {actionTypeLabels[action]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="角标/badge">
            <Input
              value={block.badge ?? ""}
              onChange={(event) => onPatch({ badge: event.target.value })}
            />
          </Field>
          {block.actionType === "copy" ? (
            <Field label="复制内容/copy text" className="md:col-span-2">
              <Input
                value={copyText}
                onChange={(event) => onPatch({ metadata: { ...(block.metadata ?? {}), copyText: event.target.value } })}
              />
            </Field>
          ) : null}
        </div>
        )}

        <div className="grid gap-1.5 text-sm font-medium text-[#333]">
          <span>图标/icon</span>
          <div className="flex flex-wrap gap-2 rounded-[18px] border border-[#EAEAEA] bg-[#FAFAFA] p-2">
            <button
              type="button"
              onClick={() => onPatch({ icon: "" })}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                !block.icon ? "border-[#1677FF] bg-[#1677FF] text-white" : "border-[#EAEAEA] bg-white text-[#475569] hover:border-[#1677FF]/40"
              }`}
            >
              不显示/none
            </button>
            {iconPresets.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => onPatch({ icon })}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  block.icon === icon ? "border-[#1677FF] bg-[#1677FF] text-white" : "border-[#EAEAEA] bg-white text-[#475569] hover:border-[#1677FF]/40"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-[#475569]">
          <label className="flex items-center gap-2">
            <Checkbox checked={block.isVisible} onChange={(event) => onPatch({ isVisible: event.target.checked })} />
            显示/visible
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={block.isFeatured} onChange={(event) => onPatch({ isFeatured: event.target.checked })} />
            精选/featured
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={block.openInNewTab ?? true} onChange={(event) => onPatch({ openInNewTab: event.target.checked })} />
            新窗口/open tab
          </label>
        </div>
      </div>
    </div>
  );
}

function getSectionMetadataValue<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function inferIconFromUrl(value: string, currentIcon?: string) {
  if (!value || currentIcon === "") return currentIcon;
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes("github.com")) return "github";
  if (lowerValue.includes("twitter.com") || lowerValue.includes("x.com")) return "twitter";
  if (lowerValue.includes("instagram.com")) return "instagram";
  if (lowerValue.includes("youtube.com") || lowerValue.includes("youtu.be")) return "youtube";
  if (lowerValue.includes("linkedin.com")) return "linkedin";
  return currentIcon || "link";
}

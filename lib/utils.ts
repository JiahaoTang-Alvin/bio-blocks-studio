import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Block } from "@/types/block";
import type { Section } from "@/types/section";
import type { SiteConfig } from "@/types/site-config";

export const topLevelBlockSectionId = "__top_level__";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSortOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, sortOrder: index + 1 }));
}

export function bySortOrder<T extends { sortOrder: number }>(a: T, b: T) {
  return a.sortOrder - b.sortOrder;
}

export type ContentOrderItem =
  | { id: string; type: "top-level-blocks"; blocks: Block[]; sortOrder: number }
  | { id: string; type: "text-block"; block: Block; sortOrder: number };

type ContentFlowNode = {
  type: "block";
  block: Block;
  sortOrder: number;
  tieOrder: number;
  itemOrder: number;
};

export function getNextContentSortOrder(config: SiteConfig) {
  return Math.max(0, ...config.sections.map((section) => section.sortOrder), ...config.blocks.map((block) => block.sortOrder)) + 1;
}

export function isSectionTextBlock(block: Block) {
  return block.size === "section-text";
}

export function normalizeContentFlowConfig(config: SiteConfig): SiteConfig {
  const sectionById = new Map(config.sections.map((section) => [section.id, section]));
  const existingBlockIds = new Set(config.blocks.map((block) => block.id));
  const existingSectionSourceIds = new Set(
    config.blocks
      .filter(isSectionTextBlock)
      .map((block) => (typeof block.metadata?.sourceSectionId === "string" ? block.metadata.sourceSectionId : block.id))
  );
  const contentNodes: ContentFlowNode[] = [
    ...config.sections
      .filter((section) => !existingSectionSourceIds.has(section.id))
      .map((section, index) => ({
        type: "block" as const,
        block: sectionToTextBlock(section, getSectionTextBlockId(section.id, existingBlockIds)),
        sortOrder: section.sortOrder,
        tieOrder: 1,
        itemOrder: index
      })),
    ...config.blocks.map((block, index) => {
      const parentSection = sectionById.get(block.sectionId);
      const isLegacySectionBlock = block.sectionId !== topLevelBlockSectionId && parentSection;

      return {
        type: "block" as const,
        block,
        sortOrder: isLegacySectionBlock ? parentSection.sortOrder : block.sortOrder,
        tieOrder: isLegacySectionBlock ? 2 : 0,
        itemOrder: isLegacySectionBlock ? block.sortOrder : index
      };
    })
  ].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.tieOrder !== b.tieOrder) return a.tieOrder - b.tieOrder;
    return a.itemOrder - b.itemOrder;
  });

  return {
    ...config,
    sections: [],
    blocks: contentNodes.map((item, index) => normalizeContentBlock(item.block, index + 1)),
    settings: {
      ...config.settings,
      topLevelBlocksSortOrder: undefined
    }
  };
}

export function buildRenderModel(config: SiteConfig): {
  profile: SiteConfig["profile"];
  orderedSections: Section[];
  topLevelBlocks: Block[];
  orderedContentItems: ContentOrderItem[];
} {
  const normalizedConfig = normalizeContentFlowConfig(config);
  const orderedVisibleBlocks = [...normalizedConfig.blocks].filter((block) => block.isVisible).sort(bySortOrder);
  const orderedContentItems: ContentOrderItem[] = [];
  let pendingTopLevelBlocks: Block[] = [];

  function flushTopLevelBlocks() {
    if (pendingTopLevelBlocks.length === 0) return;
    orderedContentItems.push({
      id: `top-level-blocks:${pendingTopLevelBlocks[0].id}`,
      type: "top-level-blocks",
      blocks: pendingTopLevelBlocks,
      sortOrder: pendingTopLevelBlocks[0].sortOrder
    });
    pendingTopLevelBlocks = [];
  }

  for (const block of orderedVisibleBlocks) {
    if (!isSectionTextBlock(block)) {
      pendingTopLevelBlocks.push(block);
      continue;
    }

    flushTopLevelBlocks();
    orderedContentItems.push({ id: block.id, type: "text-block", block, sortOrder: block.sortOrder });
  }
  flushTopLevelBlocks();

  return {
    profile: normalizedConfig.profile,
    orderedSections: [],
    topLevelBlocks: orderedVisibleBlocks,
    orderedContentItems
  };
}

function getSectionTextBlockId(sectionId: string, existingBlockIds: Set<string>) {
  const baseId = `text-${sectionId}`;
  if (!existingBlockIds.has(baseId)) return baseId;
  return `text-block-${sectionId}`;
}

function sectionToTextBlock(section: Section, id: string): Block {
  return {
    id,
    sectionId: topLevelBlockSectionId,
    title: section.title || "Untitled",
    subtitle: section.description ?? "",
    description: "",
    size: "section-text",
    responsiveSizes: {
      desktop: "section-text",
      mobile: "section-text"
    },
    coverImage: "",
    icon: section.emoji ?? "",
    badge: "",
    href: "",
    actionType: "none",
    openInNewTab: false,
    backgroundColor: "",
    textColor: "",
    metadata: {
      sourceSectionId: section.id,
      titleAlign: section.titleAlign,
      titleSize: section.titleSize
    },
    isVisible: section.isVisible,
    isFeatured: false,
    sortOrder: section.sortOrder,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt
  };
}

function normalizeContentBlock(block: Block, sortOrder: number): Block {
  const isTextSection = isSectionTextBlock(block);
  return {
    ...block,
    sectionId: topLevelBlockSectionId,
    sortOrder,
    size: isTextSection ? "section-text" : block.size,
    responsiveSizes: isTextSection
      ? {
          desktop: "section-text",
          mobile: "section-text"
        }
      : block.responsiveSizes,
    actionType: isTextSection ? "none" : block.actionType,
    openInNewTab: isTextSection ? false : block.openInNewTab,
    isFeatured: isTextSection ? false : block.isFeatured
  };
}

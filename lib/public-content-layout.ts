import type { CSSProperties } from "react";
import type { Block } from "@/types/block";
import type { ContentOrderItem } from "@/lib/utils";
import { isSectionTextBlock } from "@/lib/utils";
import { getBlockSize, getCompactedBlockGridStyles, getDefaultGridSpan } from "@/constants/block-layout";

export type PublicDesktopContentColumns = 2 | 3;

const desktopGridSpanPerLogicalColumn = 4;
const desktopContentWidthByColumns: Record<PublicDesktopContentColumns, string> = {
  2: "536px",
  3: "812px"
};

export function getPublicDesktopContentColumns(contentItems: ContentOrderItem[]): PublicDesktopContentColumns {
  const usedColumns = contentItems.reduce((maxColumns, item) => {
    if (item.type !== "top-level-blocks") return maxColumns;
    return Math.max(maxColumns, getDesktopBlockGroupColumnCount(item.blocks));
  }, 0);

  return usedColumns >= 3 ? 3 : 2;
}

export function getPublicDesktopContentWidth(columns: PublicDesktopContentColumns) {
  return desktopContentWidthByColumns[columns];
}

function getDesktopBlockGroupColumnCount(blocks: Block[]) {
  const displayBlocks = blocks.filter((block) => !isSectionTextBlock(block));
  if (displayBlocks.length === 0) return 0;

  const compactedStyles = getCompactedBlockGridStyles(
    displayBlocks.map((block) => ({ id: block.id, block })),
    "desktop"
  );

  return displayBlocks.reduce((maxColumns, block) => {
    const style = compactedStyles.get(block.id);
    const columnStart = getGridColumnStart(style?.gridColumnStart);
    const columnSpan = getGridColumnSpan(style?.gridColumnEnd, block);
    const logicalColumnEnd = Math.ceil((columnStart - 1 + columnSpan) / desktopGridSpanPerLogicalColumn);

    return Math.max(maxColumns, Math.min(3, logicalColumnEnd));
  }, 0);
}

function getGridColumnStart(value: CSSProperties["gridColumnStart"]) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 1;
}

function getGridColumnSpan(value: CSSProperties["gridColumnEnd"], block: Block) {
  if (typeof value === "string") {
    const match = value.match(/span\s+(\d+)/);
    if (match) return Number(match[1]);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return getDefaultGridSpan(getBlockSize(block, "desktop"), "desktop");
}

import type { Block } from "@/types/block";
import type { ContentOrderItem } from "@/lib/utils";
import { BlockGrid } from "@/components/site/BlockGrid";
import { BlockCard } from "@/components/blocks/BlockCard";

export function ContentArea({
  topLevelBlocks = [],
  orderedContentItems
}: {
  topLevelBlocks?: Block[];
  orderedContentItems?: ContentOrderItem[];
}) {
  const contentItems =
    orderedContentItems ??
    (topLevelBlocks.length > 0
      ? [{ id: "top-level-blocks" as const, type: "top-level-blocks" as const, blocks: topLevelBlocks, sortOrder: 0 }]
      : []);

  return (
    <section className="content-grid-container grid min-w-0 gap-6">
      {contentItems.map((item) =>
        item.type === "top-level-blocks" ? (
          item.blocks.length > 0 ? <BlockGrid key={item.id} blocks={item.blocks} layout="grid" gap="md" /> : null
        ) : (
          <BlockCard key={item.id} block={item.block} disableActions withLayout={false} className="min-h-0" />
        )
      )}
    </section>
  );
}

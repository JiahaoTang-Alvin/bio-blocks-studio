import type { Block } from "@/types/block";
import type { Section } from "@/types/section";
import type { ContentOrderItem } from "@/lib/utils";
import { BlockGrid } from "@/components/site/BlockGrid";
import { SectionGroup } from "@/components/site/SectionGroup";

export function ContentArea({
  sections,
  blocksBySection,
  topLevelBlocks = [],
  orderedContentItems
}: {
  sections: Section[];
  blocksBySection: Map<string, Block[]>;
  topLevelBlocks?: Block[];
  orderedContentItems?: ContentOrderItem[];
}) {
  const contentItems =
    orderedContentItems ??
    [
      ...(topLevelBlocks.length > 0 ? [{ id: "top-level-blocks" as const, type: "top-level-blocks" as const, blocks: topLevelBlocks, sortOrder: 0 }] : []),
      ...sections.map((section) => ({ id: section.id, type: "section" as const, section, sortOrder: section.sortOrder }))
    ];

  return (
    <section className="content-grid-container grid min-w-0 gap-8">
      {contentItems.map((item) =>
        item.type === "top-level-blocks" ? (
          item.blocks.length > 0 ? <BlockGrid key={item.id} blocks={item.blocks} layout="grid" gap="md" /> : null
        ) : (
          <SectionGroup key={item.id} section={item.section} blocks={blocksBySection.get(item.id) ?? []} />
        )
      )}
    </section>
  );
}

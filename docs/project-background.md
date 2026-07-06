# Project Background

Last updated: 2026-07-06

## Purpose

This project is being prepared as a public personal bio / portfolio template. The goal is to let people fork or clone it, replace the sample content, deploy it on Vercel, and maintain their profile through a visual admin editor.

The project should feel like an actual usable personal page, not a marketing landing page for the template itself. The first screen should show the owner profile and content cards.

## Product Model

- The public site is a personal homepage.
- The admin site is a visual editor for the same homepage.
- The content source of truth is a single validated `SiteConfig` object.
- Vercel Blob stores the production config and uploaded images.
- `lib/default-site-config.ts` is sample fallback content for local development and fresh deployments.

## Important Mental Model

The old `sections` concept is now represented as `Block` records with `type: "section"` and `size: "section-text"`. They are full-width text blocks, not containers that own block cards.

All content blocks use the internal `__top_level__` section id. Normal cards and full-width text blocks share one vertical content-order axis. This lets a text block move above, below, or between card groups without making cards feel like children of that text block.

Do not normalize top-level block `sortOrder` as if it were section-local order. A top-level block's `sortOrder` controls where it appears relative to text sections, so unrelated top-level siblings should keep their global order when another block is dragged or resized.

Block cards should be able to move before or after a text block on the shared content axis. The editor should not force a card into a hidden section-owned grid just because the pointer is near a heading.

If an older config has `sections`, normalize each section into a `type: "section"` block. If an older config has `block.sectionId` pointing at a section, normalize it into the shared content flow and rewrite the block to `__top_level__`; do not preserve section-owned card groups.

Do not reintroduce visible blank sections as placeholders. If blocks are detached from a section, make them top-level blocks.

## Main Files

- `app/page.tsx`: public page entry.
- `app/admin/page.tsx`: protected admin entry.
- `components/admin/AdminVisualEditor.tsx`: primary admin editor.
- `components/admin/ImageCropUploader.tsx`: shared image upload/crop dialog.
- `components/admin/BlockForm.tsx`: block editing form.
- `components/site/SiteLayout.tsx`: public layout shell.
- `components/site/ContentArea.tsx`: ordered public content rendering.
- `components/blocks/BlockCard.tsx`: main block card renderer.
- `lib/utils.ts`: render model, ordering helpers, top-level block id.
- `lib/validators.ts`: config validation.
- `lib/blob-config.ts`: Vercel Blob read/write.
- `lib/default-site-config.ts`: sample fallback config.

## Design Direction

- Quiet, content-first personal page.
- Dense but approachable admin UI.
- Avoid large hero marketing sections.
- Avoid decorative gradient blobs or one-note palettes.
- Keep controls direct and concrete: icons for actions, segmented choices for layout, handles for drag/resize.
- Admin behavior should match the visual public page closely.

## Current Constraints

- No database beyond Vercel Blob.
- No multi-user accounts.
- No public write APIs.
- Admin authentication is a single password hash plus signed session cookie.
- Image uploads are public Blob objects.
- Config history and migrations are not yet implemented.

## Future Development Ideas

- Template initialization wizard.
- Import/export config JSON.
- Config backup and restore.
- Richer block templates.
- Better migration handling for older configs.
- Optional analytics integration.
- Theme presets.

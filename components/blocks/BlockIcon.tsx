import {
  Award,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  ChefHat,
  Github,
  Globe2,
  Instagram,
  LinkIcon,
  Mail,
  Map,
  Sparkles,
  Twitter,
  Youtube,
  Linkedin
} from "lucide-react";

export const blockIconPresets = [
  "build",
  "briefcase",
  "chef-hat",
  "book-open",
  "award",
  "map",
  "sparkle",
  "link",
  "github",
  "x",
  "instagram",
  "youtube",
  "linkedin",
  "website",
  "mail"
] as const;

export type BlockIconName = (typeof blockIconPresets)[number];

export function BlockIcon({ name, className = "h-6 w-6" }: { name?: string; className?: string }) {
  if (!name) return null;
  if (name === "build") return <Boxes className={className} />;
  if (name === "briefcase") return <BriefcaseBusiness className={className} />;
  if (name === "chef-hat") return <ChefHat className={className} />;
  if (name === "book-open") return <BookOpen className={className} />;
  if (name === "award") return <Award className={className} />;
  if (name === "map") return <Map className={className} />;
  if (name === "sparkle") return <Sparkles className={className} />;
  if (name === "github") return <Github className={className} />;
  if (name === "x" || name === "twitter") return <Twitter className={className} />;
  if (name === "instagram") return <Instagram className={className} />;
  if (name === "youtube") return <Youtube className={className} />;
  if (name === "linkedin") return <Linkedin className={className} />;
  if (name === "website" || name === "globe") return <Globe2 className={className} />;
  if (name === "mail" || name === "email") return <Mail className={className} />;
  return <LinkIcon className={className} />;
}

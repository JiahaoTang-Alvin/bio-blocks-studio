import type { Profile } from "@/types/profile";
import type { SiteLanguage } from "@/types/site-config";
import { ProfileModuleRenderer } from "@/components/site/ProfileModuleRenderer";
import { PublicLanguageSwitcher } from "@/components/site/PublicLanguageSwitcher";

type ProfilePanelProps = {
  profile: Profile;
  languageSwitcher?: {
    currentLocale: string;
    languages: SiteLanguage[];
  };
};

export function ProfilePanel({ profile, languageSwitcher }: ProfilePanelProps) {
  return (
    <aside className="relative lg:sticky lg:top-10 lg:self-start">
      {languageSwitcher ? (
        <PublicLanguageSwitcher
          currentLocale={languageSwitcher.currentLocale}
          languages={languageSwitcher.languages}
          className="absolute right-2 top-2 z-10 lg:hidden"
        />
      ) : null}
      <div className="grid gap-5 p-1">
        {profile.moduleOrder.map((module) =>
          profile.visibleModules[module] ? (
            <ProfileModuleRenderer key={module} module={module} profile={profile} />
          ) : null
        )}
        {languageSwitcher ? (
          <PublicLanguageSwitcher
            currentLocale={languageSwitcher.currentLocale}
            languages={languageSwitcher.languages}
            className="mt-2 hidden lg:block"
          />
        ) : null}
      </div>
    </aside>
  );
}

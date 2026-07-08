import type { Profile } from "@/types/profile";
import { ProfileModuleRenderer } from "@/components/site/ProfileModuleRenderer";

export function ProfilePanel({ profile }: { profile: Profile }) {
  return (
    <aside className="min-h-0 lg:h-full lg:self-stretch lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
      <div className="grid gap-5 p-1">
        {profile.moduleOrder.map((module) =>
          profile.visibleModules[module] ? (
            <ProfileModuleRenderer key={module} module={module} profile={profile} />
          ) : null
        )}
      </div>
    </aside>
  );
}

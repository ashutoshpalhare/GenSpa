export function AnnouncementBar({ text, href }: { text: string; href: string }) {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="bg-forest px-4 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold sm:text-xs"
    >
      <a href={href} className="transition-colors hover:text-offwhite">
        {text}
      </a>
    </div>
  );
}

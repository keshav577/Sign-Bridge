import Link from "next/link";

// A card with an icon, a title, a short text and (optionally) a link.
// "tilt" gives each card a tiny different angle so the grid feels hand-placed.
export default function FeatureCard({ icon: Icon, title, description, href, action = "Open", tilt = 0 }) {
  return (
    <div
      className="panel lift flex flex-col p-6"
      style={{ rotate: `${tilt}deg` }}
    >
      <div className="mb-4 inline-flex w-fit rounded-2xl bg-fog p-3 text-ink dark:bg-fog dark:text-ink">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="muted mt-2 flex-1 text-sm leading-6">{description}</p>
      {href && (
        <Link href={href} className="mt-5 inline-flex items-center font-bold text-ink/70 hover:underline hover:underline-offset-4 dark:text-fog">
          {action} →
        </Link>
      )}
    </div>
  );
}

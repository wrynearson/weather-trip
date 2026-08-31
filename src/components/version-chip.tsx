export function VersionChip() {
  return (
    <a
      href={`https://github.com/wrynearson/weather-trip/releases/tag/v${__APP_VERSION__}`}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
    >
      v{__APP_VERSION__}
    </a>
  )
}

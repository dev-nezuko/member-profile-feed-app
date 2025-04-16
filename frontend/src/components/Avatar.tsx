const TILE_COLOURS = ['#2f5d50', '#8f320b', '#5b4636', '#1f4e5f', '#4f5b1e'];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function tileColour(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TILE_COLOURS[hash % TILE_COLOURS.length];
}

/** The photo when there is one, otherwise an initials tile. Decorative: the name is always shown next to it. */
export default function Avatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string | null; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-xl';
  if (photoUrl) return <img src={photoUrl} alt="" className={`${box} rounded-2xl object-cover shrink-0 bg-line`} />;
  return (
    <span aria-hidden="true" style={{ backgroundColor: tileColour(name) }}
      className={`${box} rounded-2xl shrink-0 grid place-items-center font-display font-extrabold text-card`}>
      {initials(name)}
    </span>
  );
}

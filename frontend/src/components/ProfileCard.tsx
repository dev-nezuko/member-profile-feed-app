import type { ReactNode } from 'react';
import Avatar from './Avatar';

interface ProfileCardProps {
  name: string;
  headline: string;
  bio: string;
  interests: string[];
  photoUrl?: string | null;
  footer?: ReactNode;
}

export default function ProfileCard({ name, headline, bio, interests, photoUrl, footer }: ProfileCardProps) {
  return (
    <article className="bg-card border border-line rounded-3xl p-5 sm:p-6 shadow-[0_1px_0_#d3d8cf]">
      <div className="flex gap-4 items-start">
        <Avatar name={name} photoUrl={photoUrl} />
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight break-words">{name}</h2>
          {headline && <p className="text-muted font-bold mt-1">{headline}</p>}
        </div>
      </div>
      {bio && <p className="mt-4 whitespace-pre-line break-words">{bio}</p>}
      {interests.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interests">
          {interests.map((interest) => (
            <li key={interest} className="rounded-full bg-moss-wash text-moss text-sm font-bold px-3 py-1">{interest}</li>
          ))}
        </ul>
      )}
      {footer && <div className="mt-5">{footer}</div>}
    </article>
  );
}

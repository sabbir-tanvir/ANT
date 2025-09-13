import React from 'react';

export default function ReviewCard({
  avatar = 'https://placehold.co/64x64',
  name = 'Anonymous',
  role = '',
  rating = 5,
  text = '',
}) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <svg
      key={i}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.2352 0.653853L7.94744 4.29269L11.775 4.87634C11.8741 4.89174 11.9563 4.96449 11.9872 5.06412C12.018 5.16375 11.9922 5.27306 11.9206 5.34626L9.15147 8.17807L9.80527 12.1775C9.82246 12.2806 9.78207 12.385 9.70111 12.4466C9.62016 12.5083 9.51273 12.5164 9.4241 12.4677L6.00039 10.5798L2.57668 12.4682C2.48811 12.5171 2.38063 12.5091 2.29962 12.4475C2.21862 12.3859 2.17823 12.2814 2.19551 12.1783L2.84931 8.17807L0.0794018 5.34626C0.00776235 5.27306 -0.018026 5.16375 0.0128386 5.06412C0.0437032 4.96449 0.125893 4.89174 0.224981 4.87634L4.05256 4.29269L5.76559 0.653853C5.80918 0.559762 5.90038 0.5 6.00039 0.5C6.1004 0.5 6.1916 0.559762 6.2352 0.653853Z"
        fill={i < safeRating ? '#FCB941' : '#E5E7EB'}
      />
    </svg>
  ));

  return (
    <article className="w-full max-w-md p-6 bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <img className="h-8 w-8 rounded-full object-cover" src={avatar} alt={`${name} avatar`} />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-900">{name}</span>
          {role ? <span className="text-[10px] text-zinc-600 leading-none">{role}</span> : null}
        </div>
      </header>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1" aria-label={`Rating: ${safeRating} out of 5`}>
          {stars}
        </div>
        <p className="text-sm text-zinc-900">{text}</p>
      </div>
    </article>
  );
}
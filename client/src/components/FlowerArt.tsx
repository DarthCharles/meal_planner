export function FlowerArt({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <g fill="#efe2ce">
        <circle cx="20" cy="8.5" r="4.14" />
        <circle cx="30.005" cy="14.25" r="4.14" />
        <circle cx="30.005" cy="25.75" r="4.14" />
        <circle cx="20" cy="31.5" r="4.14" />
        <circle cx="9.995" cy="25.75" r="4.14" />
        <circle cx="9.995" cy="14.25" r="4.14" />
      </g>
      <circle cx="20" cy="20" r="6.325" fill="#617854" />
    </svg>
  );
}

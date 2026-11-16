export function FlowerArt({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <g transform="translate(20 20) scale(1.15)">
        <g fill="#efe2ce">
          <circle cy="-10" r="3.6" />
          <circle cx="8.7" cy="-5" r="3.6" />
          <circle cx="8.7" cy="5" r="3.6" />
          <circle cy="10" r="3.6" />
          <circle cx="-8.7" cy="5" r="3.6" />
          <circle cx="-8.7" cy="-5" r="3.6" />
        </g>
        <circle r="5.5" fill="#617854" />
      </g>
    </svg>
  );
}

/* Brand mark — a compact geometric "8" chevron on a violet tile. Its own mark,
   not the reference's. Scales via the `size` prop. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-md shadow-glow"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(150deg, var(--v8-accent-400), var(--v8-accent-700))",
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z"
          stroke="white"
          strokeOpacity="0.95"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.2l-3.4 1.9v3.8L12 15.8l3.4-1.9v-3.8L12 8.2z"
          fill="white"
          fillOpacity="0.95"
        />
      </svg>
    </span>
  );
}

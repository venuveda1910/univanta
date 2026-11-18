interface UnivantaMarkProps {
  className?: string;
}

export function UnivantaMark({ className = 'w-7 h-7' }: UnivantaMarkProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="9" fill="#0F172A" />
      <path
        d="M10.5 11.5V19.5C10.5 23.6421 13.8579 27 18 27C22.1421 27 25.5 23.6421 25.5 19.5V11.5"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M18 20.5V9.5"
        stroke="#3B82F6"
        strokeWidth="3.0"
        strokeLinecap="round"
      />
      <path
        d="M13.75 13.75L18 9.25L22.25 13.75"
        stroke="#60A5FA"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

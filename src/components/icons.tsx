type IconProps = { className?: string };

const base = "shrink-0";

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.8} />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M4 5h16M7 12h10M10.5 19h3"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={1.7} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={1.7} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={1.7} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={1.7} />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.3-.3.7-.4 1.1-.2 1.1.4 2.3.6 3.6.6.6 0 1.1.5 1.1 1.1V20c0 .6-.5 1.1-1.1 1.1C10.5 21.1 2.9 13.5 2.9 4.3c0-.6.5-1.1 1.1-1.1h3.1c.6 0 1.1.5 1.1 1.1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1.1L6.6 10.8z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M12 20.2c-.2 0-.4-.1-.6-.2C7.9 17.7 3 14.2 3 9.7 3 6.8 5.3 4.5 8.1 4.5c1.6 0 3.1.8 3.9 2 .8-1.2 2.3-2 3.9-2 2.8 0 5.1 2.3 5.1 5.2 0 4.5-4.9 8-8.4 10.3-.2.1-.4.2-.6.2z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M7 8V6a5 5 0 0110 0v2" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
      <path
        d="M4.8 8h14.4l.9 12.1a1.5 1.5 0 01-1.5 1.6H5.4a1.5 1.5 0 01-1.5-1.6L4.8 8z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M5 7h14M9.5 7V5.5a1.5 1.5 0 011.5-1.5h2a1.5 1.5 0 011.5 1.5V7M6.5 7l.7 12a2 2 0 002 1.9h5.6a2 2 0 002-1.9l.7-12"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M12 3.3l7 2.5v5.4c0 4.5-3 8.6-7 9.9-4-1.3-7-5.4-7-9.9V5.8l7-2.5z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M3 6.5h10v9H3z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M13 9.5h3.6L20 12.4v3.1h-7z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="7" cy="17.3" r="1.6" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="16.5" cy="17.3" r="1.6" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="1.6" stroke="currentColor" strokeWidth={1.6} />
      <path d="M3 10h18" stroke="currentColor" strokeWidth={1.6} />
      <path d="M6.5 14.3h4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function PaypalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M8 5.5h5.4c2.3 0 3.9 1.4 3.6 3.6-.4 2.7-2.4 4.2-5 4.2h-2l-.8 5.2H6.4L8 5.5z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M11 8.7h5c2.3 0 3.7 1.3 3.4 3.5-.4 2.6-2.3 4-4.9 4h-2l-.8 5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={0.55}
      />
    </svg>
  );
}

export function BankIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M3 9.5L12 4l9 5.5" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M4.5 9.5h15V19h-15z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M7.5 12.5v3.7M12 12.5v3.7M16.5 12.5v3.7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M3 19h18" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function RotateIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M4.6 12a7.4 7.4 0 0112.8-5.1M19.4 12a7.4 7.4 0 01-12.8 5.1"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path d="M17.2 3.8v3.4h-3.4M6.8 20.2v-3.4h3.4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M11.7 3.5H6a2.5 2.5 0 00-2.5 2.5v5.7c0 .5.2 1 .6 1.4l8.4 8.4c.8.8 2 .8 2.8 0l5.7-5.7c.8-.8.8-2 0-2.8L12.6 4.1c-.4-.4-.9-.6-1.4-.6z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx="8.3" cy="8.3" r="1.3" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={1.7} />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M12 2.5c.6 2 .3 3.4-.8 4.9-1-1-1.4-1-2.1-.3-1.7 1.7-2.5 3.7-2.5 5.7a5.4 5.4 0 0010.8 0c0-2.6-1.2-4.6-2.7-6.4-.9-1-1.5-2.2-1.7-3.9zm.2 7.3c1 1.2 1.6 2.4 1.6 3.6a2.6 2.6 0 01-5.2.2c0-.9.3-1.7.9-2.5.3.5.8.8 1.4.8.5 0 .9-.4 1.3-1.1z" />
    </svg>
  );
}

export function RulerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <rect
        x="3.5"
        y="8.5"
        width="17"
        height="7"
        rx="1.2"
        transform="rotate(-14 12 12)"
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path
        d="M7.3 9.6l.9 2M10.4 8.6l.9 2M13.5 7.6l.9 2M16.6 6.6l.9 2"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MessengerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.8 7.2V22l3.5-1.9c.9.2 1.8.4 2.7.4 5.5 0 10-4.1 10-9.3S17.5 2 12 2zm1 12.5l-2.6-2.8-5 2.8 5.5-5.9 2.7 2.8 4.9-2.8-5.5 5.9z" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XMarkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" stroke="currentColor" strokeWidth={1.6} />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M12 21s7-6.4 7-11.5A7 7 0 005 9.5C5 14.6 12 21 12 21z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M9.5 14.5l5-5M10 8l1-1a3.5 3.5 0 015 5l-1 1M14 16l-1 1a3.5 3.5 0 01-5-5l1-1"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <circle cx="18" cy="5" r="2.3" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="6" cy="12" r="2.3" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="18" cy="19" r="2.3" stroke="currentColor" strokeWidth={1.7} />
      <path
        d="M8 10.8l8-4.3M8 13.2l8 4.3"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M14.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.9.2-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.9v3H11V21h3.5z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth={1.6} />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={1.6} />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path d="M16.5 3.5c.4 2 1.7 3.4 3.9 3.6v2.8c-1.4 0-2.7-.4-3.9-1.2v6.1c0 3-2.4 5.2-5.3 5.2a5.2 5.2 0 01-5.3-5.2 5.2 5.2 0 015.3-5.2c.3 0 .6 0 .9.1v2.9a2.3 2.3 0 00-.9-.2 2.4 2.4 0 00-2.4 2.4 2.4 2.4 0 002.4 2.4c1.4 0 2.5-1 2.5-2.4V3.5h2.8z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="3" stroke="currentColor" strokeWidth={1.6} />
      <path d="M10.5 9.7l4.5 2.3-4.5 2.3V9.7z" fill="currentColor" />
    </svg>
  );
}

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18a11 11 0 000 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth={1.6} />
      <path d="M4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function ZaloIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className ?? ""}`} aria-hidden="true">
      <path
        d="M4 12a8 8 0 1114.7 4.4L20 20l-3.8-1.3A8 8 0 014 12z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M9 14V9.5h3.2M9 11.7h2.6M13.5 9.5v4.5l2.5-4.5v4.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

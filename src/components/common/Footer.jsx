import React from "react";
import { Link, useLocation } from "react-router-dom";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Browse rooms", to: "/rooms" },
      { label: "AI Coach", to: "/ai-bot" },
      { label: "Create room", to: "/rooms" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Language practice", to: "/rooms" },
      { label: "Live conversations", to: "/rooms" },
      { label: "Profile", to: "/profile/me" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy", to: "#" },
      { label: "Terms", to: "#" },
      { label: "Support", to: "#" },
    ],
  },
];

const socials = [
  { label: "Twitter", icon: "fa-brands fa-x-twitter", href: "#" },
  { label: "GitHub", icon: "fa-brands fa-github", href: "#" },
  { label: "LinkedIn", icon: "fa-brands fa-linkedin-in", href: "#" },
  { label: "Instagram", icon: "fa-brands fa-instagram", href: "#" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { pathname } = useLocation();

  const isRoomsPage = pathname === "/rooms";

  const footerContainerClass = isRoomsPage
    ? "mx-auto w-full max-w-[1600px]"
    : "container-app";

  return (
    <footer className="relative overflow-hidden border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_86%,transparent)] px-4 py-12 text-[var(--color-muted)] backdrop-blur-xl sm:py-16">
      <style>{`
        .footer-glow {
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--color-primary) 16%, transparent),
            transparent 70%
          );
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="footer-glow absolute -left-24 top-10 h-72 w-72 rounded-full blur-[90px]" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] blur-[90px]" />
      </div>

      <div className={footerContainerClass}>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr] lg:gap-16">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]">
                <i className="fa-solid fa-comments text-lg" />
              </span>

              <span>
                <span className="block text-2xl font-black tracking-tight text-[var(--color-text)]">
                  Vaani
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-soft)]">
                  Speak together
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[var(--color-muted)]">
              A clean, real-time voice-room experience for learners who want
              live practice, better pronunciation, and a safer community.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-soft)] [box-shadow:var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)]"
                  aria-label={item.label}
                >
                  <i className={`${item.icon} text-sm`} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {group.title}
                </h3>

                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-primary-700)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-[var(--color-border)] pt-6 text-sm font-semibold md:flex-row md:items-center">
          <p className="text-[var(--color-muted)]">
            © {currentYear} Vaani Inc. All rights reserved.
          </p>

          <a
            href="https://rohitpant.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-muted)] [box-shadow:var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)]"
          >
            Designed & Developed by Rohit Pant
            <i className="fa-solid fa-heart text-[var(--color-danger)]" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
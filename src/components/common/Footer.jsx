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
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-[var(--color-muted)] sm:py-12">
      <div className={footerContainerClass}>
        <div className="grid gap-9 lg:grid-cols-[1.35fr_2fr] lg:gap-14">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)]">
                <i className="fa-solid fa-comments text-base" aria-hidden="true" />
              </span>

              <span>
                <span className="block text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                  Vaani
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft)]">
                  Speak together
                </span>
              </span>
            </Link>

            <p className="mt-4 max-w-md text-[13px] font-medium leading-6 text-[var(--color-muted)]">
              A clean, real-time voice-room experience for learners who want
              live practice, better pronunciation, and a safer community.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-soft)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)]"
                  aria-label={item.label}
                >
                  <i className={`${item.icon} text-xs`} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-7 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[var(--color-text)]">
                  {group.title}
                </h3>

                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary-700)]"
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

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[var(--color-border)] pt-5 text-[12px] font-medium md:flex-row md:items-center">
          <p className="text-[12px] text-[var(--color-muted)]">
            © {currentYear} Vaani Inc. All rights reserved.
          </p>

          <a
            href="https://rohitpant.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[12px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)]"
          >
            Designed & Developed by Rohit Pant
            <i className="fa-solid fa-heart text-[10px] text-[var(--color-danger)]" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

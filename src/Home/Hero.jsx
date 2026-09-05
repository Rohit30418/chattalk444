import React from "react";
import { Link } from "react-router-dom";

const stats = [
  { value: "50K+", label: "Learners", icon: "👥" },
  { value: "25+", label: "Languages", icon: "🌍" },
  { value: "92%", label: "Avg. confidence score", icon: "⚡" },
  { value: "24/7", label: "Live AI practice", icon: "🤖" },
];

const waveBars = [18, 34, 24, 48, 36, 56, 30, 42, 22, 38, 18, 28];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-primary) 7%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 7%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-extrabold text-[var(--color-primary-700)] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
            Luna AI 2.0 is live
          </div>

          <h1 className="mt-8 text-5xl font-black leading-[1.08] tracking-[-0.05em] text-[var(--color-text)] sm:text-6xl lg:text-[76px] lg:leading-[1.04]">
            Practice real conversations
            <span className="block bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text pb-3 text-transparent">
              in any language.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-[var(--color-muted)] sm:text-lg lg:mx-0">
            Join AI-powered speaking rooms, improve pronunciation, and build
            confidence through real conversations with Luna AI.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link
              to="/rooms"
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-base font-black text-[var(--color-on-primary)] shadow-sm transition-colors hover:bg-[var(--color-primary-600)] sm:w-auto"
            >
              Start Speaking Free
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/rooms"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-4 text-base font-black text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] sm:w-auto"
            >
              Explore Live Rooms
            </Link>
          </div>

          <div className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm"
              >
                <div className="mb-2 text-lg">{item.icon}</div>
                <p className="text-xl font-black tracking-[-0.03em] text-[var(--color-text)]">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--color-soft)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
          <FloatingCard
            className="absolute left-0 top-24 z-20 hidden lg:block"
            icon="⚡"
            title="Pronunciation"
            value="92% Score"
            text="Great progress today"
          />

          <FloatingCard
            className="absolute bottom-24 right-0 z-20 hidden lg:block"
            icon="🌍"
            title="Live Room"
            value="English Club"
            text="8 learners speaking"
          />

          <div className="relative z-10 w-[292px] rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-text)] p-2 shadow-lg sm:w-[334px]">
            <div className="relative overflow-hidden rounded-[2.55rem] bg-[var(--color-bg-lift)]">
              <div className="absolute left-1/2 top-3 h-7 w-28 -translate-x-1/2 rounded-full bg-[var(--color-text)]" />

              <div className="flex items-center justify-between px-7 pb-3 pt-5 text-[11px] font-black text-[var(--color-text)]">
                <span>9:41</span>
                <span className="tracking-[0.25em]">•••</span>
              </div>

              <div className="px-4 pt-5">
                <div
                  className="rounded-[2rem] p-4 shadow-sm"
                  style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black" style={{ color: "#ffffff" }}>
                        Vaani
                      </p>
                      <p
                        className="text-xs font-semibold opacity-80"
                        style={{ color: "#ffffff" }}
                      >
                        AI speaking coach
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      Live
                    </span>
                  </div>

                  <div className="mt-5 flex h-14 items-center gap-1.5 rounded-2xl bg-white/10 px-4">
                    {waveBars.map((height, index) => (
                      <span
                        key={index}
                        className="w-1.5 rounded-full bg-white/85"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <PhoneChat />

              <div className="px-4 pb-5">
                <div className="flex items-center gap-2 rounded-[1.7rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary-700)]"
                    aria-label="Start voice input"
                  >
                    🎙
                  </button>

                  <div className="flex-1 text-sm font-semibold text-[var(--color-soft)]">
                    Speak or type...
                  </div>

                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    aria-label="Send message"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FloatingCard = ({ className = "", icon, title, value, text }) => (
  <div
    className={`w-52 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-md ${className}`}
  >
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-lg">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-soft)]">
          {title}
        </p>
        <p className="mt-1 text-base font-black text-[var(--color-text)]">{value}</p>
      </div>
    </div>
    <p className="mt-3 text-sm font-bold text-[var(--color-muted)]">{text}</p>
  </div>
);

const PhoneChat = () => (
  <div className="h-[330px] overflow-hidden px-4 py-5 sm:h-[360px]">
    <div className="space-y-4">
      <ChatBubble
        type="luna"
        name="Luna"
        text="Hey Rohit, what do you want to practice today?"
      />
      <ChatBubble
        type="user"
        name="You"
        text="I want to practice English for interviews."
      />
      <ChatBubble
        type="luna"
        name="Luna"
        text="Great! Start with a quick self-introduction."
      />
    </div>
  </div>
);

const ChatBubble = ({ type, name, text }) => {
  const isUser = type === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "rounded-br-md"
            : "rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
        style={
          isUser
            ? { backgroundColor: "#0f766e", color: "#ffffff" }
            : { color: "var(--color-text)" }
        }
      >
        <p
          className="mb-1 text-[10px] font-black uppercase tracking-wider"
          style={{
            color: isUser ? "#ffffff" : "var(--color-soft)",
            opacity: isUser ? 0.82 : 1,
          }}
        >
          {name}
        </p>
        <p
          className="text-sm font-semibold leading-5"
          style={{ color: isUser ? "#ffffff" : "var(--color-text)" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

export default Hero;

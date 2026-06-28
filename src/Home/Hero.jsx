import React, { useEffect, useState } from "react";
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
    <section className="relative isolate overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <style>{`
        .vaani-hero-grid {
          background-image:
            linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(circle at 50% 20%, black, transparent 72%);
        }

        .vaani-float {
          animation: vaaniFloat 5.5s ease-in-out infinite;
        }

        .vaani-float-delay {
          animation: vaaniFloat 6s ease-in-out infinite;
          animation-delay: 1.2s;
        }

        .vaani-wave span {
          animation: vaaniWave 1.35s ease-in-out infinite;
        }

        .vaani-wave span:nth-child(2) { animation-delay: .08s; }
        .vaani-wave span:nth-child(3) { animation-delay: .16s; }
        .vaani-wave span:nth-child(4) { animation-delay: .24s; }
        .vaani-wave span:nth-child(5) { animation-delay: .32s; }
        .vaani-wave span:nth-child(6) { animation-delay: .40s; }
        .vaani-wave span:nth-child(7) { animation-delay: .48s; }
        .vaani-wave span:nth-child(8) { animation-delay: .56s; }

        .chat-pop {
          animation: chatPop .35s ease both;
        }

        .typing-dot {
          animation: typingDot 1s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: .15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes vaaniFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        @keyframes vaaniWave {
          0%, 100% {
            transform: scaleY(.72);
            opacity: .72;
          }
          50% {
            transform: scaleY(1.12);
            opacity: 1;
          }
        }

        @keyframes chatPop {
          from {
            opacity: 0;
            transform: translateY(10px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes typingDot {
          0%, 100% {
            opacity: .35;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 pt-20">
        <div className="vaani-hero-grid absolute inset-0 opacity-80" />

        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[var(--color-primary-soft)] blur-[110px]" />
        <div className="absolute right-[-120px] top-16 h-96 w-96 rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_16%,transparent)] blur-[120px]" />
        <div className="absolute bottom-[-160px] left-1/2 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] blur-[120px]" />

        <div className="absolute left-1/2 top-24 h-px w-[76%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--color-border-strong)] to-transparent" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:pb-20 pt-28">
        {/* Left Content */}
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] px-4 py-2 text-sm font-extrabold text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)] backdrop-blur-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
            </span>
            Luna AI 2.0 is live
          </div>

          <h1 className="mt-8 text-5xl font-black leading-[1.08] tracking-[-0.05em] text-[var(--color-text)] sm:text-6xl sm:leading-[1.06] lg:text-[76px] lg:leading-[1.04]">
            Practice real conversations
            <span className="block bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text pb-3 leading-[1.08] text-transparent">
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
              className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] px-8 py-4 text-base font-black text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] transition-all duration-300 hover:-translate-y-1 sm:w-auto"
            >
              Start Speaking Free
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              to="/rooms"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] px-8 py-4 text-base font-black text-[var(--color-text)] [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] sm:w-auto"
            >
              Explore Live Rooms
            </Link>
          </div>

          <div className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_82%,transparent)] p-4 text-left [box-shadow:var(--shadow-card)] backdrop-blur-xl"
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

        {/* Right Product Mockup */}
        <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
          <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] via-[color-mix(in_srgb,var(--color-secondary)_16%,transparent)] to-[color-mix(in_srgb,var(--color-accent)_22%,transparent)] blur-3xl" />

          {/* Desktop floating cards only */}
          <FloatingCard
            className="vaani-float absolute left-0 top-20 z-20 hidden lg:block"
            icon="⚡"
            title="Pronunciation"
            value="92% Score"
            text="Great progress today"
          />

          <FloatingCard
            className="vaani-float-delay absolute bottom-24 right-0 z-20 hidden lg:block"
            icon="🌍"
            title="Live Room"
            value="English Club"
            text="8 learners speaking"
          />

          <div className="relative z-10 w-[292px] rounded-[3.15rem] bg-[var(--color-text)] p-2 [box-shadow:var(--shadow-soft)] sm:w-[334px]">
            <div className="relative overflow-hidden rounded-[2.72rem] bg-[var(--color-bg-lift)]">
              <div className="absolute left-1/2 top-3 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-[var(--color-text)]" />

              <div className="flex items-center justify-between px-7 pb-3 pt-5 text-[11px] font-black text-[var(--color-text)]">
                <span>9:41</span>
                <span className="tracking-[0.25em]">•••</span>
              </div>

              <div className="px-4 pt-5">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] p-4 text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--color-on-primary)_22%,transparent)] blur-2xl" />

                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[var(--color-on-primary)]">
                        Vaani
                      </p>
                      <p className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-on-primary)_76%,transparent)]">
                        AI speaking coach
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-on-primary)_16%,transparent)] px-3 py-1 text-[10px] font-black">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                      Live
                    </span>
                  </div>

                  <div className="vaani-wave mt-5 flex h-14 items-center gap-1.5 rounded-2xl bg-[color-mix(in_srgb,var(--color-on-primary)_15%,transparent)] px-4">
                    {waveBars.map((height, index) => (
                      <span
                        key={index}
                        className="w-1.5 origin-center rounded-full bg-[color-mix(in_srgb,var(--color-on-primary)_90%,transparent)]"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatedPhoneChat />

              <div className="px-4 pb-5">
                <div className="flex items-center gap-2 rounded-[1.7rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 [box-shadow:var(--shadow-card)]">
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
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]"
                    aria-label="Send message"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile floating card removed */}
        </div>
      </div>
    </section>
  );
};

const FloatingCard = ({ className = "", icon, title, value, text }) => {
  return (
    <div
      className={`w-52 rounded-3xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] p-4 [box-shadow:var(--shadow-soft)] backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-lg text-[var(--color-primary-700)]">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-soft)]">
            {title}
          </p>
          <p className="mt-1 text-base font-black text-[var(--color-text)]">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm font-bold text-[var(--color-muted)]">
        {text}
      </p>
    </div>
  );
};

const AnimatedPhoneChat = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 1350);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[330px] overflow-hidden px-4 py-5 sm:h-[360px]">
      <div className="space-y-4">
        {step === 0 && <TypingBubble name="Luna" />}

        {step >= 1 && step <= 5 && (
          <ChatBubble
            type="luna"
            name="Luna"
            text="Hey Rohit, what do you want to practice today?"
          />
        )}

        {step >= 2 && step <= 5 && (
          <ChatBubble
            type="user"
            name="You"
            text="I want to practice English for interviews."
          />
        )}

        {step >= 3 && step <= 5 && (
          <ChatBubble
            type="luna"
            name="Luna"
            text="Great! Start with a simple self-introduction."
          />
        )}

        {step >= 4 && step <= 5 && (
          <div className="chat-pop rounded-[1.7rem] border border-[var(--color-border)] bg-[var(--color-primary-soft)] p-3">
            <p className="text-xs font-black text-[var(--color-primary-700)]">
              Luna tip
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-muted)]">
              Add your role, experience, and one strong project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TypingBubble = ({ name }) => {
  return (
    <div className="chat-pop flex items-start gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-xs font-black text-[var(--color-on-primary)]">
        AI
      </div>

      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-soft)]">
          {name}
        </p>

        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-[var(--color-surface)] px-4 py-3 [box-shadow:var(--shadow-card)]">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-soft)]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-soft)]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-soft)]" />
        </div>
      </div>
    </div>
  );
};

const ChatBubble = ({ type, name, text }) => {
  const isUser = type === "user";

  return (
    <div
      className={`chat-pop flex items-start gap-2.5 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
          isUser
            ? "bg-[var(--color-text)] text-[var(--color-surface)]"
            : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-on-primary)]"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>

      <div className={`max-w-[78%] ${isUser ? "text-right" : "text-left"}`}>
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-soft)]">
          {name}
        </p>

        <div
          className={`rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-5 [box-shadow:var(--shadow-card)] ${
            isUser
              ? "rounded-tr-md bg-[var(--color-text)] text-[var(--color-surface)]"
              : "rounded-tl-md bg-[var(--color-surface)] text-[var(--color-muted)]"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default Hero;
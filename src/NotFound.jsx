import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6">

      {/* Background */}
      <div className="absolute inset-0 bg-page" />

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />

      {/* Card */}
      <div className="relative glass-card rounded-[32px] p-10 md:p-14 max-w-xl w-full text-center border border-soft shadow-premium">

        {/* Icon */}
        <div className="mx-auto mb-8 w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-teal-500 to-sky-500 shadow-lg">
          <i className="fa-solid fa-wave-square text-white text-3xl"></i>
        </div>

        {/* 404 */}
        <h1
          className="text-7xl md:text-8xl font-black mb-3"
          style={{
            background:
              "linear-gradient(135deg,var(--color-primary),var(--color-secondary),var(--color-accent))",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-black mb-4">
          Lost in Translation?
        </h2>

        <p className="text-muted-custom max-w-md mx-auto mb-8">
          Looks like this page doesn’t exist or has been moved.
          Let’s get you back to a conversation that matters.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <Link
            to="/"
            className="btn-primary"
          >
            <i className="fa-solid fa-house"></i>
            Back Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Go Back
          </button>

        </div>

        {/* Footer */}
        <div className="mt-8 text-xs uppercase tracking-[0.25em] text-soft-custom">
          VAANI • Connecting Voices
        </div>

      </div>
    </div>
  );
};

export default NotFound;
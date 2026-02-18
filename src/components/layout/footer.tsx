import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo.png"
              alt="ScoreGenix"
              className="h-8 w-auto opacity-60"
            />
            <span className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-xs text-white/15 hover:text-white/30 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

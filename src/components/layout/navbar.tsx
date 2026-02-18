"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user && (session.user as any).role === "ADMIN";
  const isCustomer = session?.user && (session.user as any).role === "CUSTOMER";

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-emerald-400 font-medium"
        : "text-white/60 hover:text-white"
    }`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="ScoreGenix"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-6">
          {isCustomer && (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link href="/my-bets" className={linkClass("/my-bets")}>
                My Bets
              </Link>
              <Link href="/my-stats" className={linkClass("/my-stats")}>
                My Stats
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link href="/admin" className={linkClass("/admin")}>
                Dashboard
              </Link>
              <Link href="/admin/games/today" className={linkClass("/admin/games/today")}>
                Today&apos;s Games
              </Link>
              <Link href="/admin/validate" className={linkClass("/admin/validate")}>
                Validate
              </Link>
              <Link href="/admin/bets" className={linkClass("/admin/bets")}>
                Bets
              </Link>
              <Link href="/admin/analytics" className={linkClass("/admin/analytics")}>
                Analytics
              </Link>
              <Link href="/admin/subscribers" className={linkClass("/admin/subscribers")}>
                Subscribers
              </Link>
            </>
          )}

          {session ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

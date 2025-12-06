"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSupabaseAuth } from "./SupabaseAuthClient";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabaseAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ["/landing", "/signin", "/signup", "/auth"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!loading) {
      // If user is not authenticated and trying to access protected route
      if (!session && !isPublicRoute) {
        router.push("/landing");
      }

      // If user is authenticated and on auth pages, redirect to dashboard
      if (session && (pathname === "/signin" || pathname === "/signup" || pathname === "/auth")) {
        router.push("/trends");
      }
    }
  }, [session, loading, isPublicRoute, pathname, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-punch" />
      </div>
    );
  }

  // Show nothing while redirecting
  if (!session && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}

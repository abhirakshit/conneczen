"use client";

import {
  useContext,
  useState,
  useEffect,
  createContext,
  ReactNode,
} from "react";
import {redirect, usePathname, useRouter} from "next/navigation";
import { Session, User } from "@supabase/supabase-js";

import { createSSRClient } from "@/lib/supabase/client";
// import {useOnboardingCheck} from "@/hooks/useOnboardingCheck";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => void;
  revalidateSession: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: () => {},
  revalidateSession: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseClient = createSSRClient();
  const pathname = usePathname();
  const router = useRouter();


  // 🔹 use the same hook as your layout for consistency
  // const onboardingStatus = useOnboardingCheck(user?.id);

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      // console.log("Session", session);
      if (error) throw error;
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser ?? null);

      setLoading(false);
    };

    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        // console.log("Session1", session);
        setSession(session);
        setUser(currentUser);

        // console.log("EVT", event);
        if (event === "SIGNED_OUT") {
          setUser(null);
          router.replace("/auth/login");
        }

        setLoading(false);
      },
    );

    setData();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [pathname]);

  // 🔸 Auto-route once user is known and onboarding status resolved
  // useEffect(() => {
  //   if (!user?.id || loading || onboardingStatus === "pending") return;
  //
  //   const isAuthPage = pathname.startsWith("/auth");
  //   const isRoot = pathname === "/";
  //
  //   if (isAuthPage || isRoot) {
  //     if (onboardingStatus === "incomplete") router.replace("/onboarding");
  //     else if (onboardingStatus === "complete") router.replace("/dashboard");
  //   }
  // }, [user?.id, onboardingStatus, pathname, loading]);

  const revalidateSession = async () => {
    console.log("Revalidating session...");
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Error revalidating session:", error);
      setLoading(false);

      return;
    }
    console.log("Revalidated session:", session);
    setSession(session);
    setUser(session?.user ?? null);

    // if (session?.user) {
    //   await loadUserProfile(session.user.id);
    // }

    setLoading(false);
  };

  const value: AuthContextType = {
    session,
    user,
    // role,
    signOut: async () => {
      await supabaseClient.auth.signOut();
      setSession(null);
      setUser(null);
      // reset();
      redirect("/");
    },
    revalidateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

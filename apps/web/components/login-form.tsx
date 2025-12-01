"use client";

import {cn} from "@/lib/utils";
import {createSSRClient} from "@//lib/supabase/client";
import {Button} from "@//components/ui/button";
import {
  Card,
  CardContent, CardDescription, CardHeader, CardTitle,
} from "@//components/ui/card";
import {Input} from "@//components/ui/input";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator} from "@//components/ui/field";

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSSRClient();
    setIsLoading(true);
    setError(null);

    try {
      const {error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error(error);
        router.push("/auth/login");
      }
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // const signInWithGoogle = async () => {
  //   // console.log("signInWithGoogle");
  //   const supabase = createClient();
  //   setIsLoading(true);
  //   setError(null);
  //
  //   try {
  //     const {error} = await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //       // options: {
  //       //     redirectTo: `${window.location.origin}/auth/callback`, // Optional: your post-login redirect
  //       // },
  //     });
  //     if (error) {
  //       console.error("Auth Error", error);
  //       throw error;
  //     }
  //
  //     revalidateSession();
  //     console.log("Successfully logged in!");
  //     router.push("/dashboard");
  //   } catch (error: unknown) {
  //     console.error(error);
  //     setError(error instanceof Error ? error.message : "Google sign-in failed");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const signInWithGoogle = async () => {
    const supabase = createSSRClient();
    setIsLoading(true);
    setError(null);

    try {
      const {data, error} = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`, // 👈 Important
        },
      })

      console.log("Data", data)
      if (error) throw error;

      // This never runs because the browser is redirected away above.
      // So don't try to do anything below here.
    } catch (error: unknown) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <>
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Login with your Google account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  <Field>
                    <Button variant="outline" type="button" onClick={signInWithGoogle} disabled={isLoading}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                        />
                      </svg>
                      {isLoading ? "Logging in..." : "Login with Google"}
                    </Button>
                  </Field>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Or continue with
                  </FieldSeparator>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        onChange={e => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                          href="#"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account? <Link href="/auth/sign-up">Sign up</Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link>{" "}
            and <Link href="/privacy-policy">Privacy Policy</Link>.
          </FieldDescription>
        </div>
        {/*<div className={cn("flex flex-col gap-6", className)} {...props}>*/}
        {/*    <Card>*/}
        {/*        <CardContent>*/}
        {/*            <div className="flex flex-col gap-4 pt-4">*/}
        {/*                <Button*/}
        {/*                    variant="outline"*/}
        {/*                    className="w-full"*/}
        {/*                    onClick={signInWithGoogle}*/}
        {/*                    disabled={isLoading}*/}
        {/*                >*/}
        {/*                    {isLoading ? "Redirecting..." : "Sign in with Google"}*/}
        {/*                </Button>*/}

        {/*                <div className="flex items-center gap-2 text-sm text-muted-foreground my-2">*/}
        {/*                    <div className="flex-grow border-t border-border"/>*/}
        {/*                    <span className="text-xs uppercase">or sign in with email</span>*/}
        {/*                    <div className="flex-grow border-t border-border"/>*/}
        {/*                </div>*/}

        {/*                <form onSubmit={handleLogin} className="flex flex-col gap-6">*/}
        {/*                    <div className="grid gap-2">*/}
        {/*                        <Label htmlFor="email">Email</Label>*/}
        {/*                        <Input*/}
        {/*                            id="email"*/}
        {/*                            type="email"*/}
        {/*                            placeholder="m@example.com"*/}
        {/*                            required*/}
        {/*                            value={email}*/}
        {/*                            onChange={(e) => setEmail(e.target.value)}*/}
        {/*                        />*/}
        {/*                    </div>*/}
        {/*                    <div className="grid gap-2">*/}
        {/*                        <div className="flex items-center">*/}
        {/*                            <Label htmlFor="password">Password</Label>*/}
        {/*                            <Link*/}
        {/*                                href="/auth/forgot-password"*/}
        {/*                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"*/}
        {/*                            >*/}
        {/*                                Forgot your password?*/}
        {/*                            </Link>*/}
        {/*                        </div>*/}
        {/*                        <Input*/}
        {/*                            id="password"*/}
        {/*                            type="password"*/}
        {/*                            required*/}
        {/*                            value={password}*/}
        {/*                            onChange={(e) => setPassword(e.target.value)}*/}
        {/*                        />*/}
        {/*                    </div>*/}
        {/*                    {error && <p className="text-sm text-red-500">{error}</p>}*/}
        {/*                    <Button type="submit" className="w-full" disabled={isLoading}>*/}
        {/*                        {isLoading ? "Logging in..." : "Login"}*/}
        {/*                    </Button>*/}
        {/*                </form>*/}

        {/*                <div className="mt-4 text-center text-sm">*/}
        {/*                    Don&apos;t have an account?{" "}*/}
        {/*                    <Link*/}
        {/*                        href="/auth/sign-up"*/}
        {/*                        className="underline underline-offset-4"*/}
        {/*                    >*/}
        {/*                        Sign up*/}
        {/*                    </Link>*/}
        {/*                </div>*/}
        {/*            </div>*/}
        {/*        </CardContent>*/}
        {/*    </Card>*/}
        {/*</div>*/}
      </>
  );
}


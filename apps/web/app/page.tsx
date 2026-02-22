import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sun, Moon, BookOpen, Heart, Brain, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Navigation */}
      <nav className="border-b border-amber-200 bg-amber-50/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <span className="text-xl font-bold text-amber-900">conneczen</span>
          <div className="flex gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-amber-800 hover:text-amber-900 hover:bg-amber-100">
                login
              </Button>
            </Link>
            <Link href="#waitlist">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-5">
                join waitlist
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="py-12 text-center">
          <div className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
            daily voice reflection - phase one
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-950 mb-4 leading-tight">
            Two calls. Eight minutes.<br />
            <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Clarity.</span>
          </h1>
          <p className="text-lg text-amber-800 mb-6 max-w-2xl mx-auto">
            A morning call to set intentions. An evening call to reflect. No app. No homework. Just talk.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="#waitlist">
              <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white rounded-full px-6 gap-2">
                Join Waitlist <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how">
              <Button size="lg" variant="outline" className="rounded-full px-6 border-amber-300 text-amber-800 hover:bg-amber-100">
                How it works
              </Button>
            </Link>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* For who */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-amber-950 mb-3 text-center">Ready for what's next</h2>
          <p className="text-amber-800 mb-6 text-center max-w-xl mx-auto text-lg">
            You know something needs to change. You're not broken - you're ready to grow. This is how you start.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["finding direction", "building new habits", "rediscovering yourself", "making a change", "getting unstuck", "moving forward"].map((tag, i) => {
              const colors = ["bg-teal-100 text-teal-800 border-teal-300", "bg-cyan-100 text-cyan-800 border-cyan-300", "bg-orange-100 text-orange-800 border-orange-300", "bg-rose-100 text-rose-800 border-rose-300", "bg-violet-100 text-violet-800 border-violet-300", "bg-amber-100 text-amber-800 border-amber-300"];
              return (
                <span key={tag} className={`px-4 py-2 rounded-full font-medium border ${colors[i]}`}>{tag}</span>
              );
            })}
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* Problem */}
        <section className="py-12 bg-white -mx-6 px-6">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">The problem with personal growth apps</h2>
          <p className="text-amber-700 text-center mb-6">Most tools designed to help you change actually make it harder.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl p-6 border-2 border-rose-200 bg-rose-50/50">
              <span className="text-2xl mb-2 block">🎯</span>
              <h3 className="font-bold text-amber-950 text-lg mb-1">They demand clarity you don't have</h3>
              <p className="text-amber-700">Most apps ask you to set goals before you understand yourself.</p>
            </div>
            <div className="rounded-2xl p-6 border-2 border-orange-200 bg-orange-50/50">
              <span className="text-2xl mb-2 block">😔</span>
              <h3 className="font-bold text-amber-950 text-lg mb-1">They create shame spirals</h3>
              <p className="text-amber-700">Streak counters and guilt trips create resistance, not change.</p>
            </div>
            <div className="rounded-2xl p-6 border-2 border-amber-200 bg-amber-50/50">
              <span className="text-2xl mb-2 block">⌨️</span>
              <h3 className="font-bold text-amber-950 text-lg mb-1">Text is the wrong medium</h3>
              <p className="text-amber-700">People think out loud. We discover meaning mid-sentence.</p>
            </div>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* Solution */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">What if your phone called you instead?</h2>
          <p className="text-amber-700 text-center mb-6">Two daily conversations that bookend your day.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl p-6 text-white">
              <Sun className="h-8 w-8 mb-2 opacity-90" />
              <h3 className="font-bold text-xl mb-1">Morning (3 min)</h3>
              <p className="text-white/90 mb-3">Set intentions, surface what matters today</p>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• What's on your mind?</li>
                <li>• What would make today feel like a win?</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
              <Moon className="h-8 w-8 mb-2 opacity-90" />
              <h3 className="font-bold text-xl mb-1">Evening (5 min)</h3>
              <p className="text-white/90 mb-3">Reflect on how it went, integrate the day</p>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• How did intentions play out?</li>
                <li>• What did you notice about yourself?</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
              <span className="font-semibold text-teal-800">Voice only</span>
              <span className="text-teal-700"> - think out loud</span>
            </div>
            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
              <span className="font-semibold text-cyan-800">It remembers</span>
              <span className="text-cyan-700"> - picks up where you left off</span>
            </div>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* How it works */}
        <section id="how" className="py-12 bg-white -mx-6 px-6">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">How it works</h2>
          <p className="text-amber-700 text-center mb-6">Simple daily rhythm, powerful cumulative effect.</p>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { num: 1, title: "Pick your times", desc: "Choose morning and evening call times" },
              { num: 2, title: "Your phone rings", desc: "No app to open, just answer" },
              { num: 3, title: "Talk naturally", desc: "A voice that listens without judgment" },
              { num: 4, title: "Clarity emerges", desc: "Patterns surface over time" },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold flex items-center justify-center mx-auto mb-3">{step.num}</div>
                <h3 className="font-bold text-amber-950 mb-1">{step.title}</h3>
                <p className="text-amber-700 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-xl p-5 border border-violet-200">
            <p className="text-violet-900 text-center">
              <span className="font-bold">The engine beneath:</span> The system discovers your life areas from what you discuss - showing where you're thriving and where you're working to grow.
            </p>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* Research */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">Why this approach works</h2>
          <p className="text-amber-700 text-center mb-6">Built on 30+ years of clinical research in behavior change.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-amber-950">Relationship over technique</h3>
              </div>
              <p className="text-amber-700">The quality of the relationship - not the method - predicts success.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-amber-950">Identity over goals</h3>
              </div>
              <p className="text-amber-700">Shifting from "I should" to "I want to" creates lasting change.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-amber-950">Autonomy fuels motivation</h3>
              </div>
              <p className="text-amber-700">Force, facts, and fear don't create lasting change - respect does.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-violet-600" />
                <h3 className="font-bold text-amber-950">Self-efficacy is everything</h3>
              </div>
              <p className="text-amber-700">Belief in your ability to change is the strongest predictor of success.</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-5 border border-amber-200">
            <p className="text-amber-900 text-center">
              Grounded in <strong>Motivational Interviewing</strong> - evoking motivation that's already within you.
            </p>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* Principles */}
        <section className="py-12 bg-white -mx-6 px-6">
          <h2 className="text-3xl font-bold text-amber-950 mb-6 text-center">Built on how real change happens</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl p-5 border-2 border-teal-200 bg-teal-50/50">
              <p className="font-bold text-teal-800">Autonomy above all</p>
              <p className="text-teal-700 text-sm">Never prescribes or guilt-trips</p>
            </div>
            <div className="rounded-xl p-5 border-2 border-cyan-200 bg-cyan-50/50">
              <p className="font-bold text-cyan-800">Visions emerge</p>
              <p className="text-cyan-700 text-sm">No forced goal-setting</p>
            </div>
            <div className="rounded-xl p-5 border-2 border-orange-200 bg-orange-50/50">
              <p className="font-bold text-orange-800">Self-compassion</p>
              <p className="text-orange-700 text-sm">No streaks, no shame</p>
            </div>
            <div className="rounded-xl p-5 border-2 border-rose-200 bg-rose-50/50">
              <p className="font-bold text-rose-800">Not therapy</p>
              <p className="text-rose-700 text-sm">A reflection partner</p>
            </div>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* Coming Soon */}
        <section className="py-12">
          <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 rounded-2xl p-8 border border-amber-200">
            <div className="inline-block bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-3">
              COMING SOON
            </div>
            <h2 className="text-2xl font-bold text-amber-950 mb-2">The calls are just the beginning</h2>
            <p className="text-amber-800 mb-5">
              Daily calls surface your values and patterns. What comes next builds on that foundation.
            </p>
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-950">Vision Wall</p>
                  <p className="text-amber-700 text-sm">See and shape your aspirations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-fuchsia-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-950">Growth Garden</p>
                  <p className="text-amber-700 text-sm">Visual journey without gamification</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-950">Coach Integration</p>
                  <p className="text-amber-700 text-sm">Share insights with your human coach</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-amber-200" />

        {/* Waitlist */}
        <section id="waitlist" className="py-12">
          <div className="bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400 rounded-2xl p-10 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">Join the waitlist</h2>
            <p className="text-white/90 mb-6 text-lg">Early supporters get founding member pricing.</p>
            <form className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="you@example.com"
                className="rounded-full px-5 border-0 bg-white/90 text-amber-900 placeholder:text-amber-400 focus-visible:ring-white h-12"
              />
              <Button className="bg-amber-900 hover:bg-amber-950 text-white rounded-full px-8 font-semibold h-12">
                Join
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 mt-8 bg-amber-100/50">
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center text-sm text-amber-700">
          <span className="font-medium">conneczen</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sun, Moon, BookOpen, Heart, Brain, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Navigation */}
      <nav className="border-b border-amber-200 bg-amber-50/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
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

      <main className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="py-20 text-center">
          <div className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            daily voice reflection - phase one
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-950 mb-6 leading-tight">
            Two calls. Eight minutes.<br />
            <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Clarity.</span>
          </h1>
          <p className="text-xl text-amber-800 mb-10 max-w-2xl mx-auto leading-relaxed">
            A morning call to set intentions. An evening call to reflect. Over time, you see what's working and what needs attention. No app. No homework. Just talk.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="#waitlist">
              <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white rounded-full px-8 gap-2 shadow-lg shadow-teal-500/25">
                Join Waitlist <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how">
              <Button size="lg" variant="outline" className="rounded-full px-8 border-amber-300 text-amber-800 hover:bg-amber-100">
                How it works
              </Button>
            </Link>
          </div>
        </section>

        {/* Problem - 3 cards side by side */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-4 text-center">The problem with personal growth apps</h2>
          <p className="text-amber-700 text-center mb-10 max-w-2xl mx-auto">Most tools designed to help you change actually make it harder.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-rose-200 hover:border-rose-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-amber-950 mb-2">They demand clarity you don't have</h3>
              <p className="text-amber-700">Most apps ask you to set goals before you understand yourself. They assume you already know what you want - but that's exactly what you're trying to figure out.</p>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-orange-200 hover:border-orange-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <span className="text-2xl">😔</span>
              </div>
              <h3 className="text-xl font-bold text-amber-950 mb-2">They create shame spirals</h3>
              <p className="text-amber-700">Streak counters, red indicators, "we missed you" guilt trips. Research shows force, facts, and fear don't create lasting change - they create resistance.</p>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-amber-200 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                <span className="text-2xl">⌨️</span>
              </div>
              <h3 className="text-xl font-bold text-amber-950 mb-2">Text is the wrong medium</h3>
              <p className="text-amber-700">People think out loud. We contradict ourselves, hesitate, discover meaning mid-sentence. The quality of the relationship - not the method - predicts success.</p>
            </div>
          </div>
        </section>

        {/* Solution - Morning/Evening */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-4 text-center">What if your phone called you instead?</h2>
          <p className="text-amber-700 text-center mb-10 max-w-2xl mx-auto">Two daily conversations that bookend your day and create a feedback loop for growth.</p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl p-8 text-white shadow-xl">
              <Sun className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="font-bold text-2xl mb-2">Morning (3 min)</h3>
              <p className="text-white/90 text-lg mb-4">Set intentions, surface what matters today</p>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• What's on your mind?</li>
                <li>• What would make today feel like a win?</li>
                <li>• What do you need to remember?</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl p-8 text-white shadow-xl">
              <Moon className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="font-bold text-2xl mb-2">Evening (5 min)</h3>
              <p className="text-white/90 text-lg mb-4">Reflect on how it went, integrate the day</p>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• How did intentions play out?</li>
                <li>• What did you notice about yourself?</li>
                <li>• What's worth carrying forward?</li>
              </ul>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-teal-50 rounded-2xl p-5 border border-teal-200">
              <span className="font-semibold text-teal-800">Voice only</span>
              <span className="text-teal-700"> - close your eyes, think out loud</span>
            </div>
            <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-200">
              <span className="font-semibold text-cyan-800">It remembers</span>
              <span className="text-cyan-700"> - picks up where you left off</span>
            </div>
          </div>
        </section>

        {/* How it works - 4 steps side by side */}
        <section id="how" className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-4 text-center">How it works</h2>
          <p className="text-amber-700 text-center mb-10 max-w-2xl mx-auto">Simple daily rhythm, powerful cumulative effect.</p>
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">1</div>
              <h3 className="font-bold text-amber-950 mb-2">Pick your times</h3>
              <p className="text-amber-700 text-sm">Choose when you want your morning and evening calls during onboarding</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">2</div>
              <h3 className="font-bold text-amber-950 mb-2">Your phone rings</h3>
              <p className="text-amber-700 text-sm">Twice daily - no app to open, no notifications to dismiss, just answer</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">3</div>
              <h3 className="font-bold text-amber-950 mb-2">Talk naturally</h3>
              <p className="text-amber-700 text-sm">A familiar voice asks the right questions and listens without judgment</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">4</div>
              <h3 className="font-bold text-amber-950 mb-2">Clarity emerges</h3>
              <p className="text-amber-700 text-sm">Over time, patterns surface and you see what's working vs. what needs attention</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-3xl p-8 border border-violet-200">
            <p className="text-violet-900 text-lg text-center">
              <span className="font-bold">The engine beneath:</span> As you talk, the system discovers your life areas - not from a preset list, but from what you actually discuss. It shows you where you're thriving and where you're working to grow.
            </p>
          </div>
        </section>

        {/* Research-backed credibility section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-4 text-center">Why this approach works</h2>
          <p className="text-amber-700 text-center mb-10 max-w-2xl mx-auto">Built on 30+ years of clinical research in behavior change psychology.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-3xl p-8 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="font-bold text-amber-950 text-lg">Relationship over technique</h3>
              </div>
              <p className="text-amber-700 mb-3">Research consistently shows that across all human helping relationships, the differentiating factor of success is the <strong>quality of the relationship itself</strong> - not the method used.</p>
              <p className="text-amber-600 text-sm italic">"When someone listens, confusions that seem irremediable turn into clear streams." - Carl Rogers</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-bold text-amber-950 text-lg">Identity over goals</h3>
              </div>
              <p className="text-amber-700 mb-3">Real change happens at the identity level - shifting from "I'm trying to exercise" to "I'm someone who values my health." <strong>Identity-based change</strong> is far more sustainable than goal-based behavior change.</p>
              <p className="text-amber-600 text-sm italic">When clients move from "I should" to "I want to," lasting change follows.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-amber-950 text-lg">Autonomy fuels motivation</h3>
              </div>
              <p className="text-amber-700 mb-3">Studies show that when support <strong>respects autonomy</strong> and meets psychological needs, people become more motivated and perceive themselves as more competent. Force, facts, and fear don't create lasting change.</p>
              <p className="text-amber-600 text-sm italic">The ratio of change talk to resistance predicts outcomes.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="font-bold text-amber-950 text-lg">Self-efficacy is everything</h3>
              </div>
              <p className="text-amber-700 mb-3">Self-efficacy - <strong>belief in your ability to change</strong> - is the strongest predictor of sustainable behavior change. It grows through real achievements and supportive relationships, not willpower or shame.</p>
              <p className="text-amber-600 text-sm italic">"Nothing breeds success like success."</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-8 border border-amber-200">
            <p className="text-amber-900 text-center text-lg">
              Grounded in <strong>Motivational Interviewing</strong> - an evidence-based methodology with 30+ years of clinical research showing it works by evoking motivation that's already within you, not installing it from outside.
            </p>
          </div>
        </section>

        {/* Principles */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-10 text-center">Built on how real change happens</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border-2 border-teal-200 hover:border-teal-300 transition-colors">
              <p className="font-bold text-teal-800 mb-1">Autonomy above all</p>
              <p className="text-teal-700 text-sm">Never prescribes, nags, or guilt-trips</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-cyan-200 hover:border-cyan-300 transition-colors">
              <p className="font-bold text-cyan-800 mb-1">Visions emerge</p>
              <p className="text-cyan-700 text-sm">Never forced to articulate goals before you're ready</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 hover:border-orange-300 transition-colors">
              <p className="font-bold text-orange-800 mb-1">Self-compassion is structural</p>
              <p className="text-orange-700 text-sm">No streak penalties, no shame</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-rose-200 hover:border-rose-300 transition-colors">
              <p className="font-bold text-rose-800 mb-1">Not therapy</p>
              <p className="text-rose-700 text-sm">A reflection partner, not professional care</p>
            </div>
          </div>
        </section>

        {/* Vision teaser */}
        <section className="py-16">
          <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 rounded-3xl p-10 border border-amber-200">
            <div className="inline-block bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4">
              COMING SOON
            </div>
            <h2 className="text-3xl font-bold text-amber-950 mb-4">The calls are just the beginning</h2>
            <p className="text-amber-800 mb-6 text-lg max-w-2xl">
              What you're seeing is the foundation. The daily calls establish the relationship and surface your values, patterns, and vision over time.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-950">Vision Wall</p>
                  <p className="text-amber-700 text-sm">Your values and aspirations accumulate into something you can see and shape</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-fuchsia-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-950">Growth Garden</p>
                  <p className="text-amber-700 text-sm">A living visual that reflects your journey without gamifying it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-950">Coach Integration</p>
                  <p className="text-amber-700 text-sm">Share insights with your human coach, arrive at sessions prepared</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For who */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-4 text-center">For people in transition</h2>
          <p className="text-amber-800 mb-8 text-center max-w-2xl mx-auto text-lg">
            Career changes. Relationship shifts. Identity questioning. If you feel stuck but can't articulate why.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["career changers", "new parents", "post-burnout", "life after loss", "quarter-life crisis", "empty nesters"].map((tag, i) => {
              const colors = ["bg-teal-100 text-teal-800 border-teal-300", "bg-cyan-100 text-cyan-800 border-cyan-300", "bg-orange-100 text-orange-800 border-orange-300", "bg-rose-100 text-rose-800 border-rose-300", "bg-violet-100 text-violet-800 border-violet-300", "bg-amber-100 text-amber-800 border-amber-300"];
              return (
                <span key={tag} className={`px-4 py-2 rounded-full text-sm font-medium border ${colors[i]}`}>{tag}</span>
              );
            })}
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="py-16">
          <div className="bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400 rounded-3xl p-10 text-white shadow-xl text-center">
            <h2 className="text-3xl font-bold mb-3">Join the waitlist</h2>
            <p className="text-white/90 mb-8 text-lg">
              Early supporters get founding member pricing.
            </p>
            <form className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="you@example.com"
                className="rounded-full px-6 border-0 bg-white/90 text-amber-900 placeholder:text-amber-400 focus-visible:ring-white h-12"
              />
              <Button size="lg" className="bg-amber-900 hover:bg-amber-950 text-white rounded-full px-8 font-semibold">
                Join
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 mt-16 bg-amber-100/50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center text-sm text-amber-700">
          <span className="font-medium">conneczen</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}

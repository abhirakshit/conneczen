import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sun, Moon, Phone, MessageSquare, BarChart3, CheckCircle2, XCircle, Brain, BookOpen, Users } from "lucide-react";

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
            <Link href="/auth/signup">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-5">
                get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero with Phone Mockup */}
        <section className="py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
              daily voice reflection
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-amber-950 mb-4 leading-tight">
              Two calls.<br />
              Eight minutes.<br />
              <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Clarity.</span>
            </h1>
            <p className="text-lg text-amber-800 mb-6">
              A morning call to set intentions. An evening call to reflect. No app to open. Just talk.
            </p>
            <div className="flex gap-3">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white rounded-full px-6 gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how">
                <Button size="lg" variant="outline" className="rounded-full px-6 border-amber-300 text-amber-800 hover:bg-amber-100">
                  How it works
                </Button>
              </Link>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-amber-100 to-amber-50 rounded-[2.25rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl"></div>

                  {/* Incoming Call Screen */}
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mb-4 animate-pulse">
                      <Phone className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-amber-600 text-sm mb-1">Incoming call</p>
                    <p className="text-amber-900 text-xl font-semibold mb-1">conneczen</p>
                    <p className="text-amber-600 text-sm mb-8">Morning check-in</p>

                    <div className="flex gap-8">
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center mb-1">
                          <Phone className="h-6 w-6 text-white rotate-[135deg]" />
                        </div>
                        <span className="text-xs text-amber-700">Decline</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mb-1">
                          <Phone className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs text-amber-700">Accept</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-4 top-20 w-16 h-16 bg-orange-300 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -left-6 bottom-32 w-20 h-20 bg-teal-300 rounded-full opacity-50 blur-xl"></div>
            </div>
          </div>
        </section>

        {/* Visual Flow - How It Works */}
        <section id="how" className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">Your daily rhythm</h2>
          <p className="text-amber-700 text-center mb-12">Two bookends to your day. Three minutes each.</p>

          {/* Flow Diagram */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 via-amber-200 to-indigo-300 -translate-y-1/2"></div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Morning */}
              <div className="bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl p-6 text-white relative">
                <div className="absolute -top-4 left-6 bg-white rounded-full p-2 shadow-lg">
                  <Sun className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="font-bold text-xl mt-4 mb-2">Morning</h3>
                <p className="text-white/90 text-sm mb-4">7:00 AM - 3 minutes</p>
                <div className="bg-white/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm">"What's on your mind today?"</p>
                  <p className="text-sm">"What would make today feel like a win?"</p>
                </div>
              </div>

              {/* Your Day */}
              <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 relative">
                <div className="absolute -top-4 left-6 bg-amber-100 rounded-full p-2 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-xl text-amber-900 mt-4 mb-2">Your day</h3>
                <p className="text-amber-600 text-sm mb-4">Live with intention</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Focused on what matters</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-800">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Aware of your patterns</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-800">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Present, not reactive</span>
                  </div>
                </div>
              </div>

              {/* Evening */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl p-6 text-white relative">
                <div className="absolute -top-4 left-6 bg-white rounded-full p-2 shadow-lg">
                  <Moon className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="font-bold text-xl mt-4 mb-2">Evening</h3>
                <p className="text-white/90 text-sm mb-4">8:00 PM - 5 minutes</p>
                <div className="bg-white/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm">"How did your intentions play out?"</p>
                  <p className="text-sm">"What did you notice about yourself?"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">Built for people like you</h2>
          <p className="text-amber-700 text-center mb-12 max-w-2xl mx-auto">
            If you've tried journaling apps, habit trackers, or meditation apps and they didn't stick - this is different.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-amber-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">Busy professionals</h3>
              <p className="text-amber-700 text-sm">
                You have 3 minutes, not 30. You need something that fits your life, not another commitment to feel guilty about.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-amber-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">Verbal processors</h3>
              <p className="text-amber-700 text-sm">
                You think better out loud than writing. Talking through your day helps you make sense of it in ways typing never did.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-amber-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">Seekers of clarity</h3>
              <p className="text-amber-700 text-sm">
                You want to understand yourself better - your patterns, your values, what actually matters to you - without the therapy price tag.
              </p>
            </div>
          </div>
        </section>

        {/* Why Other Apps Fail */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">Why other apps don't work</h2>
          <p className="text-amber-700 text-center mb-12 max-w-2xl mx-auto">
            You've tried. It's not a willpower problem. The tools are designed wrong.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">You have to remember to open them</h3>
                <p className="text-amber-700 text-sm">Notifications are easy to swipe away. Apps are easy to forget. Your phone call? That demands attention.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Streaks create shame</h3>
                <p className="text-amber-700 text-sm">Miss a day and suddenly you're a failure. We don't track streaks. Missed yesterday? Today is a fresh start.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Writing feels like work</h3>
                <p className="text-amber-700 text-sm">After a long day, the last thing you want is to type out your thoughts. Talking is effortless.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Too many features</h3>
                <p className="text-amber-700 text-sm">Goals, habits, mood tracking, gratitude prompts... overwhelming. We do one thing: help you reflect.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Research Backed */}
        <section className="py-16">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-8 md:p-12 border border-teal-200">
            <div className="flex items-center gap-2 text-teal-700 text-sm font-medium mb-4">
              <BookOpen className="h-4 w-4" />
              Research-backed approach
            </div>
            <h2 className="text-3xl font-bold text-amber-950 mb-6">Grounded in behavioral science</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Implementation intentions</h3>
                <p className="text-amber-700 text-sm">
                  Setting specific "when-then" plans in the morning increases follow-through by 2-3x compared to vague goals.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Bookend reflection</h3>
                <p className="text-amber-700 text-sm">
                  Morning intention-setting and evening review create a feedback loop that accelerates self-awareness and behavior change.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Voice processing</h3>
                <p className="text-amber-700 text-sm">
                  Speaking engages different cognitive pathways than writing. Many people gain clarity faster when they think out loud.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-amber-950 mb-2 text-center">See your patterns emerge</h2>
          <p className="text-amber-700 text-center mb-12">Every conversation builds understanding. Your dashboard shows the bigger picture.</p>

          {/* Dashboard Mockup */}
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-amber-100 px-4 py-3 flex items-center gap-2 border-b border-amber-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-full px-4 py-1 text-sm text-amber-600 max-w-xs">
                  conneczen.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 bg-amber-50">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {/* Next Call Card */}
                <div className="bg-white rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-600 text-sm mb-2">
                    <Sun className="h-4 w-4" />
                    Morning Check-in
                  </div>
                  <p className="text-2xl font-bold text-amber-900">7:00 AM</p>
                  <p className="text-sm text-amber-600">Tomorrow - in 14 hours</p>
                </div>

                {/* Evening Card */}
                <div className="bg-white rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 text-indigo-600 text-sm mb-2">
                    <Moon className="h-4 w-4" />
                    Evening Reflection
                  </div>
                  <p className="text-2xl font-bold text-amber-900">8:00 PM</p>
                  <p className="text-sm text-amber-600">Today - in 6 hours</p>
                </div>

                {/* Start Session Card */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                  <div className="flex items-center gap-2 text-teal-700 text-sm mb-2">
                    <Phone className="h-4 w-4" />
                    Ready to reflect?
                  </div>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white w-full mt-2">
                    Start Session Now
                  </Button>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-amber-900">Recent Sessions</h3>
                  <span className="text-sm text-teal-600">View all →</span>
                </div>
                <div className="space-y-3">
                  {[
                    { date: "Today", time: "7:15 AM", summary: "Focused on work priorities. Feeling energized about the new project.", mood: "energized" },
                    { date: "Yesterday", time: "8:30 PM", summary: "Reflected on a challenging conversation. Found clarity on next steps.", mood: "reflective" },
                    { date: "Yesterday", time: "7:00 AM", summary: "Set intention to be more present in meetings.", mood: "focused" },
                  ].map((session, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-amber-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-amber-900">{session.date}</span>
                          <span className="text-amber-500 text-sm">{session.time}</span>
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">{session.mood}</span>
                        </div>
                        <p className="text-sm text-amber-700 truncate">{session.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Value Props */}
        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">We call you</h3>
              <p className="text-amber-700">No app to open. No reminders to ignore. Your phone rings at your chosen time.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">Just talk</h3>
              <p className="text-amber-700">Voice-first reflection. Think out loud with an AI that listens without judgment.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">Patterns emerge</h3>
              <p className="text-amber-700">Over time, see what matters to you. No forced goals. Just growing clarity.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">Ready to start?</h2>
            <p className="text-white/90 mb-8 text-lg">Set up your daily calls in under 2 minutes.</p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50 rounded-full px-10 font-semibold h-14 text-lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 mt-8 bg-amber-100/50">
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center text-sm text-amber-700">
          <span className="font-medium">conneczen</span>
          <span>© 2025</span>
        </div>
      </footer>
    </div>
  );
}

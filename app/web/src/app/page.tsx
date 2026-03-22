import { SessionPlayground } from "@/components/session-playground";

const workstreams = [
  "Curriculum",
  "Listening",
  "Speaking",
  "Costa Rica living pack",
  "Couple practice",
  "App"
];

const v1Boundaries = [
  "Text-first correction stays first, but speech slots into the same shared flow",
  "Shared backend plus Postgres persistence for both learners on the local network",
  "Reusable prompts and scenarios before polished gamification"
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(252,237,212,1),_rgba(248,241,232,1)_40%,_rgba(244,236,229,1)_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-16 h-48 w-48 rounded-full bg-terracotta/10 blur-3xl animate-drift" />
        <div className="absolute right-[10%] top-36 h-72 w-72 rounded-full bg-ocean/10 blur-3xl animate-drift" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-8 lg:px-10">
        <header className="grid gap-8 pb-10 pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="eyebrow">Learn to Live in Costa Rica</p>
            <h1 className="hero-title">
              A practical Spanish system built for real life, shared practice, and Costa Rica readiness.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-coffee/75">
              The app now aims at the real household setup: one shared server on the local
              network, two learners on phones or laptops, text and speech flowing through the
              same correction pipeline, and durable history that can grow with the curriculum.
            </p>
          </div>

          <div className="panel bg-coffee text-sand shadow-card">
            <p className="eyebrow text-sand/70">Current build</p>
            <h2 className="section-title text-sand">Local network coach foundation</h2>
            <div className="mt-5 space-y-3">
              {v1Boundaries.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm leading-6 text-sand/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 pb-10 md:grid-cols-2 xl:grid-cols-6">
          {workstreams.map((item) => (
            <div key={item} className="panel xl:col-span-1">
              <p className="eyebrow">Workstream</p>
              <h2 className="mt-3 text-xl font-semibold text-coffee">{item}</h2>
            </div>
          ))}
        </section>

        <SessionPlayground />
      </div>
    </main>
  );
}

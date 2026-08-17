export function CarteAuth({
  eyebrow,
  titre,
  sousTitre,
  children,
  pied,
}: {
  eyebrow: string;
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
  pied?: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brume">
      <div className="halo-respiration" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/branche.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-16 hidden w-96 opacity-40 sm:block"
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mousse-fonce">
              {eyebrow}
            </p>
            <h1 className="font-display text-2xl italic text-encre">
              {titre}
            </h1>
            {sousTitre && (
              <p className="mt-2 text-sm leading-relaxed text-ardoise">
                {sousTitre}
              </p>
            )}
          </div>

          <div className="rounded-doux border border-trait bg-white/80 p-8 shadow-doux backdrop-blur-sm">
            {children}
          </div>

          {pied && (
            <p className="mt-6 text-center text-sm text-ardoise">{pied}</p>
          )}
        </div>
      </div>
    </main>
  );
}

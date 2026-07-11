import Link from "next/link";

export default function PageAccueil() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brume">
      <div className="halo-respiration" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-24">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-mousse-fonce">
          Instruction en famille
        </p>
        <h1 className="font-display text-4xl italic leading-tight text-encre sm:text-5xl">
          Un espace calme pour observer
          <br />
          ce que votre enfant apprend.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ardoise">
          Documentez les activités, gardez les traces qui comptent, et
          préparez sereinement le dossier pédagogique de l&rsquo;année —
          sans jamais remplacer votre regard de parent.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/inscription"
            className="rounded-doux bg-mousse-fonce px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse"
          >
            Créer mon espace
          </Link>
          <Link
            href="/connexion"
            className="text-sm font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse"
          >
            J&rsquo;ai déjà un compte
          </Link>
        </div>
      </div>
    </main>
  );
}

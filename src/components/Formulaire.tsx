import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";

export function Champ({
  label,
  id,
  erreur,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  erreur?: string;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-encre"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre placeholder:text-ardoise/60 focus:border-mousse focus:outline-none"
        aria-invalid={erreur ? "true" : undefined}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        {...props}
      />
      {erreur && (
        <p id={`${id}-erreur`} className="mt-1.5 text-sm text-alerte">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function BoutonPrincipal({
  children,
  chargement,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { chargement?: boolean }) {
  return (
    <button
      className="mt-2 w-full rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      disabled={chargement || props.disabled}
      {...props}
    >
      {chargement ? "Un instant…" : children}
    </button>
  );
}

export function LienDiscret(
  props: LabelHTMLAttributes<HTMLAnchorElement> & { href: string }
) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      className="text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse"
      {...(props as any)}
    />
  );
}

export function MessageStatut({
  type,
  children,
}: {
  type: "erreur" | "succes";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={`mb-4 rounded-doux border px-3.5 py-2.5 text-sm ${
        type === "erreur"
          ? "border-alerte/30 bg-alerte/5 text-alerte"
          : "border-mousse/30 bg-mousse/5 text-mousse-fonce"
      }`}
    >
      {children}
    </div>
  );
}

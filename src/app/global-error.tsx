"use client";

// Dernier filet de securite : l'erreur s'est produite dans la mise en page
// racine elle-meme. Les styles sont donc en ligne (aucune feuille de style
// n'est garantie) et la page est volontairement minimale.
export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F1E8",
          color: "#26312D",
          fontFamily: "system-ui, sans-serif",
          padding: "16px",
        }}
      >
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 40, margin: 0 }} aria-hidden="true">
            🌱
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 26 }}>
            Quelque chose n&rsquo;a pas fonctionné
          </h1>
          <p style={{ lineHeight: 1.5 }}>
            Ce que vous avez déjà enregistré n&rsquo;est pas touché. Vous pouvez
            réessayer.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: 44,
              padding: "10px 22px",
              borderRadius: 12,
              border: "none",
              background: "#264C3B",
              color: "#fff",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
          {error.digest ? (
            <p style={{ fontSize: 12, marginTop: 24, opacity: 0.7 }}>
              Code : {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

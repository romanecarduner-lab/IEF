import { type NextRequest, NextResponse } from "next/server";
import { mettreAJourSession } from "@/lib/supabase/middleware";

const PAGES_AUTH = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialisation",
];

const PAGES_PROTEGEES = [
  "/tableau-de-bord",
  "/enfants",
  "/annees-scolaires",
  "/parcours",
  "/journal",
];

export async function middleware(request: NextRequest) {
  const { response, user } = await mettreAJourSession(request);
  const chemin = request.nextUrl.pathname;

  const estPageAuth = PAGES_AUTH.some((p) => chemin.startsWith(p));
  const estPageProtegee = PAGES_PROTEGEES.some((p) => chemin.startsWith(p));

  // Non connecté et tente d'accéder à une page protégée → renvoi vers la connexion
  if (!user && estPageProtegee) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", chemin);
    return NextResponse.redirect(url);
  }

  // Déjà connecté et tente d'accéder à une page d'authentification → renvoi vers le tableau de bord
  if (user && estPageAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

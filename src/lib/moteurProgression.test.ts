import { test } from "node:test";
import assert from "node:assert/strict";
import { estimerStatutDepuisObservations } from "./moteurProgression";

function obs(niveauCode: string, niveauOrdre: number, date: string, contexteCode = "jeu_libre") {
  return { niveauCode, niveauOrdre, date, contexteCode };
}

test("aucune observation -> non concluant", () => {
  const resultat = estimerStatutDepuisObservations([]);
  assert.equal(resultat.concluant, false);
});

test("une seule observation -> concluant mais provisoire", () => {
  const resultat = estimerStatutDepuisObservations([obs("autonome", 5, "2026-01-10")]);
  assert.equal(resultat.concluant, true);
  if (resultat.concluant) {
    assert.equal(resultat.statutCode, "realise_autonome");
    assert.equal(resultat.niveauConfiance, "provisoire");
  }
});

test("plusieurs observations homogenes, dates et contextes varies -> confirme", () => {
  const resultat = estimerStatutDepuisObservations([
    obs("autonome", 5, "2026-01-10", "jeu_libre"),
    obs("autonome", 5, "2026-01-15", "cuisine"),
    obs("autonome", 5, "2026-01-20", "sortie"),
  ]);
  assert.equal(resultat.concluant, true);
  if (resultat.concluant) {
    assert.equal(resultat.statutCode, "realise_autonome");
    assert.equal(resultat.niveauConfiance, "confirme");
  }
});

test("observations homogenes mais un seul contexte -> reste provisoire", () => {
  const resultat = estimerStatutDepuisObservations([
    obs("autonome", 5, "2026-01-10", "jeu_libre"),
    obs("autonome", 5, "2026-01-15", "jeu_libre"),
    obs("autonome", 5, "2026-01-20", "jeu_libre"),
  ]);
  assert.equal(resultat.concluant, true);
  if (resultat.concluant) {
    assert.equal(resultat.niveauConfiance, "provisoire");
  }
});

test("progression chronologique claire (aide -> aide legere -> autonome x2) -> concluant sur le dernier niveau", () => {
  const resultat = estimerStatutDepuisObservations([
    obs("accompagnement_important", 2, "2026-01-01", "jeu_libre"),
    obs("avec_quelques_aides", 3, "2026-01-08", "cuisine"),
    obs("autonome", 5, "2026-01-15", "sortie"),
    obs("autonome", 5, "2026-01-22", "jeu_libre"),
  ]);
  assert.equal(resultat.concluant, true);
  if (resultat.concluant) {
    assert.equal(resultat.statutCode, "realise_autonome");
    assert.equal(resultat.niveauConfiance, "confirme");
  }
});

test("alternance persistante (autonome puis avec aide puis autonome) -> non concluant", () => {
  const resultat = estimerStatutDepuisObservations([
    obs("autonome", 5, "2026-01-01"),
    obs("avec_quelques_aides", 3, "2026-01-08"),
    obs("autonome", 5, "2026-01-15"),
  ]);
  assert.equal(resultat.concluant, false);
});

test("regression (autonome puis avec aide) -> non concluant, jamais de retrogradation automatique", () => {
  const resultat = estimerStatutDepuisObservations([
    obs("autonome", 5, "2026-01-01"),
    obs("avec_quelques_aides", 3, "2026-01-08"),
  ]);
  assert.equal(resultat.concluant, false);
});

test("l'ordre chronologique des observations en entree n'a pas d'importance (tri interne)", () => {
  const resultat = estimerStatutDepuisObservations([
    obs("autonome", 5, "2026-01-22", "jeu_libre"),
    obs("accompagnement_important", 2, "2026-01-01", "cuisine"),
    obs("avec_quelques_aides", 3, "2026-01-08", "sortie"),
  ]);
  assert.equal(resultat.concluant, true);
  if (resultat.concluant) {
    assert.equal(resultat.statutCode, "realise_autonome");
  }
});

-- Journal de l'analyste. IF NOT EXISTS : l'API rejoue ce fichier au démarrage,
-- pour les bases créées avant son ajout (PostgreSQL ne rejoue pas db/init).
CREATE TABLE IF NOT EXISTS journal_decisions (
  trend_id TEXT PRIMARY KEY,
  verdict TEXT NOT NULL CHECK (verdict IN ('Suivre', 'Observer', 'Ignorer')),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_sources (
  trend_id TEXT NOT NULL,
  source_index INTEGER NOT NULL CHECK (source_index >= 0),
  status TEXT NOT NULL CHECK (status IN ('verifiee', 'a-confirmer')),
  PRIMARY KEY (trend_id, source_index)
);

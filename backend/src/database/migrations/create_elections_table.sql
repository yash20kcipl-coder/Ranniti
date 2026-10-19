-- Migration: Create elections master table
-- Description: Stores multi-tier election entities (Assembly, Parliamentary, Municipal, Panchayat) with active/default campaign toggles, dates, and voter targets.

CREATE TABLE IF NOT EXISTS elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    election_code VARCHAR(50),
    election_type VARCHAR(50) NOT NULL DEFAULT 'ASSEMBLY' CHECK (
        election_type IN ('ASSEMBLY', 'PARLIAMENTARY', 'MUNICIPAL_CORP', 'ZILLA_PARISHAD', 'PANCHAYAT_SAMITI', 'GRAM_PANCHAYAT', 'OTHER')
    ),
    election_date DATE NOT NULL,
    counting_date DATE,
    state_id UUID REFERENCES states(id) ON DELETE SET NULL,
    pc_id UUID REFERENCES parliamentary_constituencies(id) ON DELETE SET NULL,
    ac_id UUID REFERENCES assembly_constituencies(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (
        status IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED')
    ),
    total_voters_snapshot INT DEFAULT 0,
    target_votes INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_ac_id ON elections(ac_id);
CREATE INDEX IF NOT EXISTS idx_elections_is_default ON elections(is_default);
CREATE INDEX IF NOT EXISTS idx_elections_election_date ON elections(election_date);

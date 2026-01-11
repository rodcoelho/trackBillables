-- Update all Legacy Client entries to Citadel
UPDATE billables SET client = 'Citadel' WHERE client = 'Legacy Client';

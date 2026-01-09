-- Insert new faction sections
INSERT INTO public.galaxy_lore_sections (section_type, faction_id, sub_section, title, content) 
SELECT 
  'faccoes',
  faction.id,
  sub.id,
  sub.label || ' - ' || faction.name,
  'Insira aqui o conteúdo sobre ' || sub.label || ' da facção ' || faction.name || '.'
FROM 
  (VALUES 
    ('alianca-estelar', 'Aliança Estelar'),
    ('hegemonia-humanista', 'Hegemonia Humanista'),
    ('pacto-liberstadt', 'Pacto de Liberstadt'),
    ('federacao-solonica', 'Federação Solônica de Planetas'),
    ('nova-concordia', 'Nova Concórdia'),
    ('republica-bruniana', 'República Bruniana')
  ) AS faction(id, name),
  (VALUES 
    ('historia', 'História'),
    ('cultura', 'Cultura'),
    ('sociedade', 'Sociedade'),
    ('planetas', 'Planetas'),
    ('estetica', 'Estética'),
    ('relacoes', 'Relações')
  ) AS sub(id, label)
ON CONFLICT DO NOTHING;
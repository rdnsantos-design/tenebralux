/**
 * Character Sheet PDF Generator
 * Generates a printable PDF character sheet for the Character Builder
 */

import jsPDF from 'jspdf';
import { CharacterDraft } from '@/types/character-builder';
import { ATTRIBUTES } from '@/data/character/attributes';
import { getSkillLabel, SKILLS } from '@/data/character/skills';
import { getVirtueById, VIRTUES } from '@/data/character/virtues';
import { getPrivilegeById } from '@/data/character/privileges';
import { getEquipmentById, getEquipmentName } from '@/data/character/equipment';
import { getFactionById } from '@/data/character/factions';
import { getCultureById } from '@/data/character/cultures';
import { 
  calculateDerivedStats, 
  calculateRegencyStats,
  CharacterAttributes 
} from '@/core/types';
import { CombatCard } from '@/types/tactical-combat';
import { 
  BASIC_CARDS, 
  BLADE_TACTICAL_CARDS, 
  RANGED_TACTICAL_CARDS, 
  MELEE_TACTICAL_CARDS 
} from '@/data/combat/cards';
import { POSTURE_CARDS } from '@/data/combat/postures';

export interface PDFOptions {
  theme: 'akashic' | 'tenebralux';
  includeRegency?: boolean;
}

// Colors for each theme
const THEME_COLORS = {
  akashic: {
    primary: [59, 130, 246] as [number, number, number], // Blue
    secondary: [147, 51, 234] as [number, number, number], // Purple
    accent: [16, 185, 129] as [number, number, number], // Teal
    background: [248, 250, 252] as [number, number, number],
    text: [15, 23, 42] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
  },
  tenebralux: {
    primary: [180, 83, 9] as [number, number, number], // Amber
    secondary: [120, 53, 15] as [number, number, number], // Brown
    accent: [220, 38, 38] as [number, number, number], // Red
    background: [254, 252, 232] as [number, number, number],
    text: [41, 37, 36] as [number, number, number],
    muted: [87, 83, 78] as [number, number, number],
  },
};

/**
 * Generates a PDF document for a character
 */
export function generateCharacterPDF(character: CharacterDraft, options: PDFOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const colors = THEME_COLORS[options.theme];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  let yPos = margin;

  // Helper functions
  const drawHeader = (text: string, y: number): number => {
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin + 3, y + 5.5);
    return y + 12;
  };

  const drawSubHeader = (text: string, y: number): number => {
    doc.setFillColor(...colors.secondary);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin + 2, y + 4.2);
    return y + 9;
  };

  const drawLabelValue = (label: string, value: string | number, x: number, y: number, width: number = 40): void => {
    doc.setTextColor(...colors.muted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, y);
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), x, y + 4);
  };

  // ============= PAGE 1 =============
  
  // Title
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const characterName = character.name || 'Personagem';
  doc.text(characterName, pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const themeLabel = options.theme === 'akashic' ? 'Akashic Records' : 'Tenebra Lux';
  doc.text(themeLabel, pageWidth / 2, 20, { align: 'center' });
  
  yPos = 35;

  // Concept Section
  yPos = drawHeader('CONCEITO', yPos);
  
  const faction = character.factionId ? getFactionById(character.factionId) : null;
  const culture = character.culture ? getCultureById(character.culture) : null;
  
  drawLabelValue('Facção', faction?.name || 'Não definida', margin, yPos, 50);
  drawLabelValue('Cultura', culture?.name || 'Não definida', margin + 60, yPos, 50);
  
  yPos += 14;

  // Attributes Section
  yPos = drawHeader('ATRIBUTOS', yPos);
  
  const attributes = (character.attributes || {}) as CharacterAttributes;
  const attrPerRow = 4;
  const attrWidth = contentWidth / attrPerRow;
  
  ATTRIBUTES.forEach((attr, index) => {
    const col = index % attrPerRow;
    const row = Math.floor(index / attrPerRow);
    const x = margin + col * attrWidth;
    const y = yPos + row * 14;
    const value = attributes[attr.id as keyof CharacterAttributes] || 1;
    
    doc.setDrawColor(...colors.muted);
    doc.setLineWidth(0.3);
    doc.roundedRect(x + 1, y, attrWidth - 2, 12, 2, 2, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(attr.name, x + 3, y + 5);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), x + attrWidth - 10, y + 8);
  });
  
  yPos += Math.ceil(ATTRIBUTES.length / attrPerRow) * 14 + 4;

  // Skills Section
  yPos = drawHeader('PERÍCIAS', yPos);
  
  const skills = character.skills || {};
  const learnedSkills = Object.entries(skills)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  
  if (learnedSkills.length > 0) {
    const skillsPerRow = 3;
    const skillWidth = contentWidth / skillsPerRow;
    
    learnedSkills.forEach(([skillId, value], index) => {
      const col = index % skillsPerRow;
      const row = Math.floor(index / skillsPerRow);
      const x = margin + col * skillWidth;
      const y = yPos + row * 8;
      
      doc.setTextColor(...colors.text);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(getSkillLabel(skillId, options.theme), x, y + 5);
      
      // Skill dots
      for (let i = 0; i < 3; i++) {
        const dotX = x + skillWidth - 18 + i * 5;
        if (i < value) {
          doc.setFillColor(...colors.primary);
          doc.circle(dotX, y + 4, 1.5, 'F');
        } else {
          doc.setDrawColor(...colors.muted);
          doc.circle(dotX, y + 4, 1.5, 'S');
        }
      }
    });
    
    yPos += Math.ceil(learnedSkills.length / skillsPerRow) * 8 + 4;
  } else {
    doc.setTextColor(...colors.muted);
    doc.setFontSize(9);
    doc.text('Nenhuma perícia desenvolvida', margin, yPos + 5);
    yPos += 10;
  }

  // Derived Stats Section
  yPos = drawHeader('CARACTERÍSTICAS DERIVADAS', yPos);
  
  const derivedStats = calculateDerivedStats(attributes, skills);
  const statsWidth = contentWidth / 5;
  
  const statsList = [
    { label: 'Vitalidade', value: derivedStats.vitalidade },
    { label: 'Guarda', value: derivedStats.guarda },
    { label: 'Evasão', value: derivedStats.evasao },
    { label: 'Vontade', value: derivedStats.vontade },
    { label: 'Reação', value: derivedStats.reacao },
  ];
  
  statsList.forEach((stat, index) => {
    const x = margin + index * statsWidth;
    doc.setFillColor(...colors.background);
    doc.roundedRect(x + 1, yPos, statsWidth - 2, 15, 2, 2, 'F');
    doc.setDrawColor(...colors.muted);
    doc.roundedRect(x + 1, yPos, statsWidth - 2, 15, 2, 2, 'S');
    
    doc.setTextColor(...colors.primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stat.value), x + statsWidth / 2, yPos + 8, { align: 'center' });
    
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, x + statsWidth / 2, yPos + 13, { align: 'center' });
  });
  
  yPos += 20;

  // Regency Section (optional)
  if (options.includeRegency !== false) {
    yPos = drawSubHeader('REGÊNCIA', yPos);
    
    const regencyStats = calculateRegencyStats(attributes, skills, options.theme);
    const regencyList = [
      { label: 'Comando', value: regencyStats.comando },
      { label: 'Estratégia', value: regencyStats.estrategia },
      { label: 'Admin.', value: regencyStats.administracao },
      { label: 'Política', value: regencyStats.politica },
      { label: options.theme === 'akashic' ? 'Tecnol.' : 'Geomancia', 
        value: regencyStats.tecnologia || regencyStats.geomancia || 0 },
    ];
    
    regencyList.forEach((stat, index) => {
      const x = margin + index * statsWidth;
      doc.setFillColor(245, 240, 255);
      doc.roundedRect(x + 1, yPos, statsWidth - 2, 12, 2, 2, 'F');
      
      doc.setTextColor(...colors.secondary);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(String(stat.value), x + statsWidth / 2, yPos + 6, { align: 'center' });
      
      doc.setTextColor(...colors.muted);
      doc.setFontSize(6);
      doc.text(stat.label, x + statsWidth / 2, yPos + 10, { align: 'center' });
    });
    
    yPos += 16;
  }

  // ============= PAGE 2 =============
  doc.addPage();
  yPos = margin;

  // Virtues Section
  const virtues = character.virtues || {};
  const activeVirtueId = Object.entries(virtues).find(([_, level]) => level > 0)?.[0];
  const activeVirtue = activeVirtueId ? getVirtueById(activeVirtueId) : null;
  
  yPos = drawHeader('VIRTUDE', yPos);
  
  if (activeVirtue) {
    doc.setTextColor(...colors.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${activeVirtue.name} - Nível ${virtues[activeVirtueId!] || 1}`, margin, yPos + 5);
    
    const levelInfo = activeVirtue.levels[virtues[activeVirtueId!] || 1];
    if (levelInfo) {
      doc.setTextColor(...colors.muted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(levelInfo.name, margin, yPos + 11);
    }
    yPos += 16;
  } else {
    doc.setTextColor(...colors.muted);
    doc.setFontSize(9);
    doc.text('Nenhuma virtude ativa', margin, yPos + 5);
    yPos += 10;
  }

  // Privileges Section
  yPos = drawHeader('LEGADOS (PRIVILÉGIOS E DESAFIOS)', yPos);
  
  const privilegeIds = character.privilegeIds || [];
  if (privilegeIds.length > 0) {
    privilegeIds.forEach((privilegeId) => {
      const privilege = getPrivilegeById(privilegeId);
      if (privilege) {
        doc.setTextColor(...colors.accent);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`✦ ${privilege.name}`, margin, yPos + 5);
        
        const challengeId = character.challengeIds?.[privilegeId];
        const challenge = challengeId 
          ? privilege.challenges.find(c => c.id === challengeId) 
          : null;
        
        if (challenge) {
          doc.setTextColor(...colors.muted);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text(`  ↳ Desafio: ${challenge.name}`, margin + 5, yPos + 10);
          yPos += 14;
        } else {
          yPos += 8;
        }
      }
    });
  } else {
    doc.setTextColor(...colors.muted);
    doc.setFontSize(9);
    doc.text('Nenhuma bênção selecionada', margin, yPos + 5);
    yPos += 10;
  }

  // Equipment Section
  yPos = drawHeader('EQUIPAMENTO', yPos);
  
  const equipmentIds: string[] = [];
  if (character.weaponId) equipmentIds.push(character.weaponId);
  if (character.armorId) equipmentIds.push(character.armorId);
  if (character.itemIds) equipmentIds.push(...character.itemIds);
  
  if (equipmentIds.length > 0) {
    const equipPerRow = 2;
    const equipWidth = contentWidth / equipPerRow;
    
    equipmentIds.forEach((equipId, index) => {
      const equipment = getEquipmentById(equipId);
      if (equipment) {
        const col = index % equipPerRow;
        const row = Math.floor(index / equipPerRow);
        const x = margin + col * equipWidth;
        const y = yPos + row * 10;
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${getEquipmentName(equipment, options.theme)}`, x, y + 5);
      }
    });
    
    yPos += Math.ceil(equipmentIds.length / equipPerRow) * 10 + 4;
  } else {
    doc.setTextColor(...colors.muted);
    doc.setFontSize(9);
    doc.text('Nenhum equipamento selecionado', margin, yPos + 5);
    yPos += 10;
  }

  // Notes Section (empty box for handwritten notes)
  yPos = drawHeader('ANOTAÇÕES', yPos);
  doc.setDrawColor(...colors.muted);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, contentWidth, 50, 'S');
  
  // Draw lines for notes
  for (let i = 1; i < 6; i++) {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 2, yPos + i * 8, margin + contentWidth - 2, yPos + i * 8);
  }

  // Footer
  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} - ${themeLabel}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // ============= COMBAT CARDS PAGES =============
  const characterSkills = character.skills || {};
  
  // Collect all available cards
  const availableCards: { card: CombatCard; category: string }[] = [];
  
  // Basic cards
  BASIC_CARDS.forEach(card => {
    availableCards.push({ card, category: 'Básica' });
  });
  
  // Postures
  POSTURE_CARDS.forEach(card => {
    availableCards.push({ card, category: 'Postura' });
  });
  
  // Tactical cards based on skills
  const bladesLevel = characterSkills.laminas || 0;
  const shootingLevel = characterSkills.tiro || 0;
  const fightingLevel = characterSkills.luta || 0;
  
  BLADE_TACTICAL_CARDS.forEach(card => {
    if (bladesLevel >= (card.requirements?.skillMin || 0)) {
      availableCards.push({ card, category: 'Tática - Lâminas' });
    }
  });
  
  RANGED_TACTICAL_CARDS.forEach(card => {
    if (shootingLevel >= (card.requirements?.skillMin || 0)) {
      availableCards.push({ card, category: 'Tática - Tiro' });
    }
  });
  
  MELEE_TACTICAL_CARDS.forEach(card => {
    if (fightingLevel >= (card.requirements?.skillMin || 0)) {
      availableCards.push({ card, category: 'Tática - Luta' });
    }
  });
  
  // Card dimensions (small playing cards ~56x86mm)
  const cardWidth = 50;
  const cardHeight = 75;
  const cardPadding = 5;
  const cardsPerRow = 3;
  const cardsPerCol = 3;
  const cardsPerPage = cardsPerRow * cardsPerCol;
  
  // Helper to draw a single combat card
  const drawCombatCard = (
    cardData: { card: CombatCard; category: string },
    x: number, 
    y: number
  ): void => {
    const { card, category } = cardData;
    const theme = options.theme;
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    
    // Card border color based on type
    let borderColor: [number, number, number];
    if (card.type === 'basic') {
      borderColor = colors.primary;
    } else if (card.type === 'posture') {
      borderColor = colors.accent;
    } else {
      borderColor = colors.secondary;
    }
    
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');
    
    // Card header
    doc.setFillColor(...borderColor);
    doc.roundedRect(x + 1, y + 1, cardWidth - 2, 12, 2, 2, 'F');
    
    // Card name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const cardName = card.name[theme] || card.name.akashic;
    const truncatedName = cardName.length > 18 ? cardName.substring(0, 16) + '...' : cardName;
    doc.text(truncatedName, x + cardWidth / 2, y + 7.5, { align: 'center' });
    
    // Category label
    doc.setTextColor(...borderColor);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(category, x + cardWidth / 2, y + 16, { align: 'center' });
    
    // Modifiers section
    let modY = y + 22;
    doc.setTextColor(...colors.text);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    
    const modifiers: string[] = [];
    if (card.speedModifier !== 0) {
      modifiers.push(`Vel: ${card.speedModifier >= 0 ? '+' : ''}${card.speedModifier}`);
    }
    if (card.attackModifier !== 0) {
      modifiers.push(`Atq: ${card.attackModifier >= 0 ? '+' : ''}${card.attackModifier}`);
    }
    if (card.movementModifier !== 0 && card.movementModifier !== -999) {
      modifiers.push(`Mov: ${card.movementModifier >= 0 ? '+' : ''}${card.movementModifier}`);
    }
    if (card.defenseBonus) {
      modifiers.push(`Def: ${card.defenseBonus >= 0 ? '+' : ''}${card.defenseBonus}`);
    }
    if (card.guardMultiplier) {
      modifiers.push(`Guarda: x${card.guardMultiplier}`);
    }
    
    // Draw modifiers in columns
    const modColWidth = (cardWidth - 4) / 2;
    modifiers.forEach((mod, idx) => {
      const modX = x + 2 + (idx % 2) * modColWidth;
      const modYOffset = modY + Math.floor(idx / 2) * 5;
      doc.text(mod, modX, modYOffset);
    });
    
    modY += Math.ceil(modifiers.length / 2) * 5 + 3;
    
    // Description
    doc.setTextColor(...colors.muted);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    const description = card.description?.[theme] || card.description?.akashic || '';
    const descLines = doc.splitTextToSize(description, cardWidth - 6);
    const maxDescLines = Math.min(descLines.length, 4);
    for (let i = 0; i < maxDescLines; i++) {
      doc.text(descLines[i], x + 3, modY + i * 4);
    }
    modY += maxDescLines * 4 + 2;
    
    // Effect (if any)
    if (card.effect) {
      doc.setTextColor(...colors.accent);
      doc.setFontSize(5);
      doc.setFont('helvetica', 'italic');
      const effectLines = doc.splitTextToSize(`★ ${card.effect}`, cardWidth - 6);
      const maxEffectLines = Math.min(effectLines.length, 2);
      for (let i = 0; i < maxEffectLines; i++) {
        doc.text(effectLines[i], x + 3, modY + i * 4);
      }
    }
    
    // Requirements (if tactical)
    if (card.requirements) {
      doc.setTextColor(...colors.muted);
      doc.setFontSize(4);
      doc.setFont('helvetica', 'normal');
      const reqText = `Req: ${card.requirements.skillId} ${card.requirements.skillMin}+`;
      doc.text(reqText, x + cardWidth / 2, y + cardHeight - 3, { align: 'center' });
    }
  };
  
  // Draw cards on new pages
  if (availableCards.length > 0) {
    let cardIndex = 0;
    
    while (cardIndex < availableCards.length) {
      doc.addPage();
      
      // Page header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CARTAS DE COMBATE', pageWidth / 2, 10, { align: 'center' });
      
      // Calculate starting position to center cards
      const totalGridWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * cardPadding;
      const startX = (pageWidth - totalGridWidth) / 2;
      const startY = 22;
      
      // Draw cards in grid
      for (let row = 0; row < cardsPerCol && cardIndex < availableCards.length; row++) {
        for (let col = 0; col < cardsPerRow && cardIndex < availableCards.length; col++) {
          const x = startX + col * (cardWidth + cardPadding);
          const y = startY + row * (cardHeight + cardPadding);
          
          drawCombatCard(availableCards[cardIndex], x, y);
          cardIndex++;
        }
      }
      
      // Page footer
      doc.setTextColor(...colors.muted);
      doc.setFontSize(7);
      doc.text(
        `${characterName} - Cartas de Combate`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  return doc;
}

/**
 * Downloads the character PDF
 */
export function downloadCharacterPDF(character: CharacterDraft, theme: 'akashic' | 'tenebralux'): void {
  const doc = generateCharacterPDF(character, { theme });
  const fileName = character.name 
    ? `${character.name}_ficha.pdf`
    : 'personagem_ficha.pdf';
  doc.save(fileName);
}

/**
 * Returns a Blob of the character PDF
 */
export function getCharacterPDFBlob(character: CharacterDraft, theme: 'akashic' | 'tenebralux'): Blob {
  const doc = generateCharacterPDF(character, { theme });
  return doc.output('blob');
}

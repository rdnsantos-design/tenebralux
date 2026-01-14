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
  const charAttributes = (character.attributes || {}) as CharacterAttributes;
  
  // Calculate derived stats for final values
  const weapon = character.weaponId ? getEquipmentById(character.weaponId) : null;
  const armor = character.armorId ? getEquipmentById(character.armorId) : null;
  const armorDefense = armor?.stats?.defense || 0;
  const derivedStatsForCards = calculateDerivedStats(charAttributes, characterSkills, armorDefense);
  
  // Extract base damage from weapon (e.g., "1d8+FOR" -> "1d8")
  const weaponDamage = weapon?.stats?.damage?.split('+')[0] || '-';
  const weaponType = weapon?.type || 'melee';
  
  // Determine relevant skill based on weapon type
  const getRelevantSkillLevel = (cardCategory: string): number => {
    if (cardCategory.includes('Lâminas') || (weapon && weaponType === 'melee')) {
      return characterSkills.laminas || 0;
    }
    if (cardCategory.includes('Tiro') || (weapon && weaponType === 'ranged')) {
      return characterSkills.tiro || 0;
    }
    if (cardCategory.includes('Luta')) {
      return characterSkills.luta || 0;
    }
    // For basic cards, use weapon type to determine
    if (weaponType === 'ranged') return characterSkills.tiro || 0;
    if (weaponType === 'melee') return characterSkills.laminas || 0;
    return 0;
  };
  
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
  
  // Helper to calculate final card stats
  const calculateFinalStats = (card: CombatCard, category: string) => {
    const skillLevel = getRelevantSkillLevel(category);
    
    // Velocidade Final = Reação + mod.carta
    const finalSpeed = derivedStatsForCards.reacao + card.speedModifier;
    
    // Ataque Final = Perícia + mod.carta
    const finalAttack = skillLevel + card.attackModifier;
    
    // Movimento disponível considerando custo da carta
    const movementCost = card.movementModifier !== -999 ? card.movementModifier : 0;
    const finalMovement = derivedStatsForCards.movimento + movementCost;
    
    // Defesa Final = Defesa (Guarda + Resistência) + mod.carta
    const defenseBonus = card.defenseBonus || 0;
    const finalDefense = derivedStatsForCards.defesa + defenseBonus;
    
    // Guard multiplier for special postures
    const guardWithMultiplier = card.guardMultiplier 
      ? Math.floor(derivedStatsForCards.guarda * card.guardMultiplier)
      : null;
    
    return {
      finalSpeed,
      finalAttack,
      finalMovement,
      finalDefense,
      guardWithMultiplier,
      weaponDamage: card.type !== 'posture' ? weaponDamage : null,
    };
  };
  
  // Helper to draw a single combat card with calculated final values
  const drawCombatCard = (
    cardData: { card: CombatCard; category: string },
    x: number, 
    y: number
  ): void => {
    const { card, category } = cardData;
    const theme = options.theme;
    const finalStats = calculateFinalStats(card, category);
    
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
    doc.roundedRect(x + 1, y + 1, cardWidth - 2, 10, 2, 2, 'F');
    
    // Card name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    const cardName = card.name[theme] || card.name.akashic;
    const truncatedName = cardName.length > 20 ? cardName.substring(0, 18) + '...' : cardName;
    doc.text(truncatedName, x + cardWidth / 2, y + 6.5, { align: 'center' });
    
    // Category label
    doc.setTextColor(...borderColor);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.text(category, x + cardWidth / 2, y + 14, { align: 'center' });
    
    // Stats section - show FINAL calculated values
    let modY = y + 18;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    
    // Draw stats in a clean grid format
    const statBoxWidth = (cardWidth - 6) / 2;
    const statBoxHeight = 8;
    
    // Row 1: Velocidade | Ataque
    // Velocidade (lower is faster)
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(x + 2, modY, statBoxWidth, statBoxHeight, 1, 1, 'F');
    doc.setTextColor(...colors.muted);
    doc.setFontSize(4);
    doc.text('VELOCIDADE', x + 2 + statBoxWidth / 2, modY + 2.5, { align: 'center' });
    doc.setTextColor(...colors.primary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(finalStats.finalSpeed), x + 2 + statBoxWidth / 2, modY + 6.5, { align: 'center' });
    
    // Ataque
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(x + 3 + statBoxWidth, modY, statBoxWidth, statBoxHeight, 1, 1, 'F');
    doc.setTextColor(...colors.muted);
    doc.setFontSize(4);
    doc.text('ATAQUE', x + 3 + statBoxWidth + statBoxWidth / 2, modY + 2.5, { align: 'center' });
    doc.setTextColor(...colors.primary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const atkSign = finalStats.finalAttack >= 0 ? '+' : '';
    doc.text(`${atkSign}${finalStats.finalAttack}`, x + 3 + statBoxWidth + statBoxWidth / 2, modY + 6.5, { align: 'center' });
    
    modY += statBoxHeight + 2;
    
    // Row 2: Movimento | Defesa (or Dano for attack cards)
    // Movimento
    doc.setFillColor(245, 250, 245);
    doc.roundedRect(x + 2, modY, statBoxWidth, statBoxHeight, 1, 1, 'F');
    doc.setTextColor(...colors.muted);
    doc.setFontSize(4);
    doc.text('MOVIMENTO', x + 2 + statBoxWidth / 2, modY + 2.5, { align: 'center' });
    doc.setTextColor(...(card.movementModifier === -999 ? [200, 50, 50] as [number, number, number] : colors.text));
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const movText = card.movementModifier === -999 ? '—' : String(finalStats.finalMovement);
    doc.text(movText, x + 2 + statBoxWidth / 2, modY + 6.5, { align: 'center' });
    
    // Defesa ou Dano
    doc.setFillColor(250, 245, 245);
    doc.roundedRect(x + 3 + statBoxWidth, modY, statBoxWidth, statBoxHeight, 1, 1, 'F');
    doc.setTextColor(...colors.muted);
    doc.setFontSize(4);
    
    if (card.type === 'posture' || card.defenseBonus) {
      doc.text('DEFESA', x + 3 + statBoxWidth + statBoxWidth / 2, modY + 2.5, { align: 'center' });
      doc.setTextColor(...colors.accent);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const defValue = finalStats.guardWithMultiplier !== null 
        ? finalStats.guardWithMultiplier 
        : finalStats.finalDefense;
      doc.text(String(defValue), x + 3 + statBoxWidth + statBoxWidth / 2, modY + 6.5, { align: 'center' });
    } else {
      doc.text('DANO', x + 3 + statBoxWidth + statBoxWidth / 2, modY + 2.5, { align: 'center' });
      doc.setTextColor(...colors.accent);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(finalStats.weaponDamage || '-', x + 3 + statBoxWidth + statBoxWidth / 2, modY + 6.5, { align: 'center' });
    }
    
    modY += statBoxHeight + 3;
    
    // Effect (if any) - shortened
    if (card.effect) {
      doc.setTextColor(...colors.secondary);
      doc.setFontSize(4);
      doc.setFont('helvetica', 'italic');
      const effectLines = doc.splitTextToSize(`★ ${card.effect}`, cardWidth - 6);
      const maxEffectLines = Math.min(effectLines.length, 3);
      for (let i = 0; i < maxEffectLines; i++) {
        doc.text(effectLines[i], x + 3, modY + i * 3.5);
      }
      modY += maxEffectLines * 3.5 + 1;
    }
    
    // Description - very brief
    doc.setTextColor(...colors.muted);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    const description = card.description?.[theme] || card.description?.akashic || '';
    const descLines = doc.splitTextToSize(description, cardWidth - 6);
    const availableSpace = cardHeight - (modY - y) - 6;
    const maxDescLines = Math.min(descLines.length, Math.floor(availableSpace / 3.5));
    for (let i = 0; i < maxDescLines; i++) {
      doc.text(descLines[i], x + 3, modY + i * 3.5);
    }
    
    // Weapon name at bottom (if applicable)
    if (weapon && card.type !== 'posture') {
      doc.setTextColor(...colors.muted);
      doc.setFontSize(3.5);
      doc.setFont('helvetica', 'italic');
      const weaponName = getEquipmentName(weapon, theme);
      doc.text(weaponName.substring(0, 18), x + cardWidth / 2, y + cardHeight - 2.5, { align: 'center' });
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

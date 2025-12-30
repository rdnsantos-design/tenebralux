// ========================
// TEMPLATE DE CARD (para impressão)
// ========================

export interface TextFieldMapping {
  id: string;
  x: number; // posição X em pixels (do Canva)
  y: number; // posição Y em pixels (do Canva)
  width?: number; // largura em pixels (opcional)
  height?: number; // altura em pixels (opcional)
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  rotation?: number; // rotação em graus
  maxLines?: number; // máximo de linhas para texto longo
  textShadow?: boolean; // sombra no texto
}

export interface ImageFieldMapping {
  id: string;
  x: number; // posição X em pixels
  y: number; // posição Y em pixels
  width: number; // largura em pixels
  height: number; // altura em pixels
  borderRadius?: number; // raio da borda em pixels
  opacity?: number; // opacidade (0-1)
}

export interface CardTemplate {
  id: string;
  name: string;
  templateImage: string; // URL da imagem PNG base
  width: number; // largura do template em pixels
  height: number; // altura do template em pixels
  fields: TextFieldMapping[];
  imageFields?: ImageFieldMapping[]; // campos de imagem (opcional para compatibilidade)
  availableSkins?: string[]; // URLs de skins disponíveis para este template
}

export interface CardData {
  name: string;
  number: string;
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  experience: string;
  totalForce: number;
  maintenanceCost: number;
  specialAbilities: string[];
  currentPosture: string;
  normalPressure: number;
  permanentPressure: number;
  hits: number;
}

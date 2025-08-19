export interface TextFieldMapping {
  id: string;
  x: number; // posição X em pixels
  y: number; // posição Y em pixels
  width?: number; // largura máxima do texto
  height?: number; // altura máxima do texto
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  rotation?: number; // rotação em graus
  maxLines?: number; // máximo de linhas para texto longo
}

export interface CardTemplate {
  id: string;
  name: string;
  templateImage: string; // URL da imagem PNG base
  width: number; // largura do template em pixels
  height: number; // altura do template em pixels
  fields: TextFieldMapping[];
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
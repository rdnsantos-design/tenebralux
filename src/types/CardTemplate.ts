export interface TextFieldMapping {
  id: string;
  x: number; // posição X proporcional (0-1)
  y: number; // posição Y proporcional (0-1)
  width?: number; // largura proporcional (0-1)
  height?: number; // altura proporcional (0-1)
  fontSize: number; // tamanho base da fonte
  fontFamily: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  rotation?: number; // rotação em graus
  maxLines?: number; // máximo de linhas para texto longo
  textShadow?: boolean; // sombra no texto
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
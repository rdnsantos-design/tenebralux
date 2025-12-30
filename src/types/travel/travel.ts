// ========================
// SISTEMA DE VIAGEM
// ========================

export interface ProvinceDistance {
  id: string;
  from_province_name: string;
  to_province_name: string;
  distance_km: number;
  created_at: string;
}

export interface TravelSpeed {
  id: string;
  travel_type: 'individual' | 'army';
  label: string;
  speed_km_per_day: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TravelCalculation {
  from: string;
  to: string;
  distance_km: number;
  individual_days: number;
  army_days: number;
}

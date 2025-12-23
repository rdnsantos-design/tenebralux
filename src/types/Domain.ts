export interface Realm {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: string;
  name: string;
  realm_id: string;
  development: number;
  magic: number;
  created_at: string;
  updated_at: string;
}

export interface ProvinceWithRealm extends Province {
  realm?: Realm;
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Save, X, Sword, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
type WeaponType = 'tiro' | 'lamina' | 'luta';
type WeaponCategory = 'leve' | 'media' | 'pesada';
type DamageType = 'balistico' | 'energia' | 'explosivo' | 'laminas' | 'contundente';
type ArmorCategory = 'leve' | 'media' | 'pesada';

interface Weapon {
  id: string;
  name: string;
  weapon_type: WeaponType;
  category: WeaponCategory;
  damage: number;
  damage_type: DamageType;
  range_base: number;
  range_max: number;
  range_penalty: number;
  speed_mod: number;
  movement_mod: number;
  damage_ratio: string;
  created_at: string;
  user_id: string | null;
}

interface Armor {
  id: string;
  name: string;
  category: ArmorCategory;
  resistance: number;
  movement_mod: number;
  created_at: string;
  user_id: string | null;
}

// Constants
const WEAPON_CATEGORY_MODS: Record<WeaponCategory, { speed: number; movement: number }> = {
  leve: { speed: 2, movement: 0 },
  media: { speed: 3, movement: -1 },
  pesada: { speed: 4, movement: -3 },
};

const ARMOR_CATEGORY_MODS: Record<ArmorCategory, { movement: number }> = {
  leve: { movement: -1 },
  media: { movement: -2 },
  pesada: { movement: -3 },
};

const DAMAGE_TYPE_BY_WEAPON: Record<WeaponType, DamageType[]> = {
  tiro: ['balistico', 'energia', 'explosivo'],
  lamina: ['laminas'],
  luta: ['contundente'],
};

const DAMAGE_RATIOS: Record<DamageType, string> = {
  balistico: '1:1',
  energia: '1:1',
  explosivo: '2:1',
  laminas: '1:2',
  contundente: '1:4',
};

const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  balistico: 'Balístico',
  energia: 'Energia',
  explosivo: 'Explosivo',
  laminas: 'Lâminas',
  contundente: 'Contundente',
};

const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  tiro: 'Tiro',
  lamina: 'Lâmina',
  luta: 'Luta',
};

const CATEGORY_LABELS: Record<WeaponCategory | ArmorCategory, string> = {
  leve: 'Leve',
  media: 'Média',
  pesada: 'Pesada',
};

export function EquipmentManager() {
  const [activeTab, setActiveTab] = useState<'weapons' | 'armors' | 'items'>('weapons');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sword className="w-5 h-5" />
          Gerenciador de Equipamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="weapons" className="flex items-center gap-2">
              <Sword className="w-4 h-4" />
              Armas
            </TabsTrigger>
            <TabsTrigger value="armors" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Armaduras
            </TabsTrigger>
            <TabsTrigger value="items" disabled className="opacity-50">
              Diversos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weapons">
            <WeaponEditor />
          </TabsContent>

          <TabsContent value="armors">
            <ArmorEditor />
          </TabsContent>

          <TabsContent value="items">
            <div className="text-center py-8 text-muted-foreground">
              Em desenvolvimento...
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Weapon Editor Component
function WeaponEditor() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    weapon_type: 'tiro' as WeaponType,
    category: 'media' as WeaponCategory,
    damage: 3,
    damage_type: 'balistico' as DamageType,
  });

  useEffect(() => {
    fetchWeapons();
  }, []);

  const fetchWeapons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rpg_weapons')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Erro ao carregar armas');
      console.error(error);
    } else {
      setWeapons(data as Weapon[]);
    }
    setLoading(false);
  };

  const handleWeaponTypeChange = (type: WeaponType) => {
    const defaultDamageType = DAMAGE_TYPE_BY_WEAPON[type][0];
    setFormData({
      ...formData,
      weapon_type: type,
      damage_type: defaultDamageType,
    });
  };

  const handleCategoryChange = (category: WeaponCategory) => {
    setFormData({ ...formData, category });
  };

  const calculateModifiers = () => {
    const categoryMods = WEAPON_CATEGORY_MODS[formData.category];
    const damageRatio = DAMAGE_RATIOS[formData.damage_type];
    const isRanged = formData.weapon_type === 'tiro';

    return {
      speed_mod: categoryMods.speed,
      movement_mod: categoryMods.movement,
      damage_ratio: damageRatio,
      range_base: isRanged ? 15 : 1,
      range_max: isRanged ? 30 : 1,
      range_penalty: isRanged ? -2 : 0,
    };
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const mods = calculateModifiers();
    const weaponData = {
      name: formData.name.trim(),
      weapon_type: formData.weapon_type,
      category: formData.category,
      damage: formData.damage,
      damage_type: formData.damage_type,
      ...mods,
    };

    if (editingId) {
      const { error } = await supabase
        .from('rpg_weapons')
        .update(weaponData)
        .eq('id', editingId);

      if (error) {
        toast.error('Erro ao atualizar arma');
        console.error(error);
      } else {
        toast.success('Arma atualizada!');
        setEditingId(null);
        setShowForm(false);
        fetchWeapons();
      }
    } else {
      const { error } = await supabase
        .from('rpg_weapons')
        .insert(weaponData);

      if (error) {
        toast.error('Erro ao criar arma');
        console.error(error);
      } else {
        toast.success('Arma criada!');
        setShowForm(false);
        fetchWeapons();
      }
    }

    resetForm();
  };

  const handleEdit = (weapon: Weapon) => {
    setFormData({
      name: weapon.name,
      weapon_type: weapon.weapon_type,
      category: weapon.category,
      damage: weapon.damage,
      damage_type: weapon.damage_type,
    });
    setEditingId(weapon.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('rpg_weapons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir arma');
      console.error(error);
    } else {
      toast.success('Arma excluída!');
      fetchWeapons();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      weapon_type: 'tiro',
      category: 'media',
      damage: 3,
      damage_type: 'balistico',
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      {showForm ? (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editingId ? 'Editar Arma' : 'Nova Arma'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="weapon-name">Nome</Label>
                <Input
                  id="weapon-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rifle de Assalto"
                  maxLength={100}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.weapon_type} onValueChange={handleWeaponTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiro">Tiro</SelectItem>
                    <SelectItem value="lamina">Lâmina</SelectItem>
                    <SelectItem value="luta">Luta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve (+2 vel, +0 mov)</SelectItem>
                    <SelectItem value="media">Média (+3 vel, -1 mov)</SelectItem>
                    <SelectItem value="pesada">Pesada (+4 vel, -3 mov)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Damage */}
              <div className="space-y-2">
                <Label>Dano</Label>
                <Select 
                  value={formData.damage.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, damage: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Damage Type */}
              <div className="space-y-2 md:col-span-2">
                <Label>Tipo de Dano</Label>
                <Select 
                  value={formData.damage_type} 
                  onValueChange={(v) => setFormData({ ...formData, damage_type: v as DamageType })}
                  disabled={formData.weapon_type !== 'tiro'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPE_BY_WEAPON[formData.weapon_type].map((type) => (
                      <SelectItem key={type} value={type}>
                        {DAMAGE_TYPE_LABELS[type]} (Razão {DAMAGE_RATIOS[type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Prévia dos Modificadores:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Vel +{calculateModifiers().speed_mod}</Badge>
                <Badge variant="secondary">Mov {calculateModifiers().movement_mod >= 0 ? '+' : ''}{calculateModifiers().movement_mod}</Badge>
                <Badge variant="secondary">Razão {calculateModifiers().damage_ratio}</Badge>
                {formData.weapon_type === 'tiro' && (
                  <>
                    <Badge variant="outline">Alcance: {calculateModifiers().range_base}-{calculateModifiers().range_max} hex</Badge>
                    <Badge variant="outline">Penalidade: {calculateModifiers().range_penalty}</Badge>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Arma
        </Button>
      )}

      {/* Weapons List */}
      {weapons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma arma cadastrada
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dano</TableHead>
                <TableHead>Tipo Dano</TableHead>
                <TableHead>Vel</TableHead>
                <TableHead>Mov</TableHead>
                <TableHead>Razão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weapons.map((weapon) => (
                <TableRow key={weapon.id}>
                  <TableCell className="font-medium">{weapon.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{WEAPON_TYPE_LABELS[weapon.weapon_type]}</Badge>
                  </TableCell>
                  <TableCell>{CATEGORY_LABELS[weapon.category]}</TableCell>
                  <TableCell>{weapon.damage}</TableCell>
                  <TableCell>{DAMAGE_TYPE_LABELS[weapon.damage_type]}</TableCell>
                  <TableCell>+{weapon.speed_mod}</TableCell>
                  <TableCell>{weapon.movement_mod >= 0 ? '+' : ''}{weapon.movement_mod}</TableCell>
                  <TableCell>{weapon.damage_ratio}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(weapon)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(weapon.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Armor Editor Component
function ArmorEditor() {
  const [armors, setArmors] = useState<Armor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'media' as ArmorCategory,
    resistance: 3,
  });

  useEffect(() => {
    fetchArmors();
  }, []);

  const fetchArmors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rpg_armors')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Erro ao carregar armaduras');
      console.error(error);
    } else {
      setArmors(data as Armor[]);
    }
    setLoading(false);
  };

  const calculateModifiers = () => {
    return ARMOR_CATEGORY_MODS[formData.category];
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const mods = calculateModifiers();
    const armorData = {
      name: formData.name.trim(),
      category: formData.category,
      resistance: formData.resistance,
      movement_mod: mods.movement,
    };

    if (editingId) {
      const { error } = await supabase
        .from('rpg_armors')
        .update(armorData)
        .eq('id', editingId);

      if (error) {
        toast.error('Erro ao atualizar armadura');
        console.error(error);
      } else {
        toast.success('Armadura atualizada!');
        setEditingId(null);
        setShowForm(false);
        fetchArmors();
      }
    } else {
      const { error } = await supabase
        .from('rpg_armors')
        .insert(armorData);

      if (error) {
        toast.error('Erro ao criar armadura');
        console.error(error);
      } else {
        toast.success('Armadura criada!');
        setShowForm(false);
        fetchArmors();
      }
    }

    resetForm();
  };

  const handleEdit = (armor: Armor) => {
    setFormData({
      name: armor.name,
      category: armor.category,
      resistance: armor.resistance,
    });
    setEditingId(armor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('rpg_armors')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir armadura');
      console.error(error);
    } else {
      toast.success('Armadura excluída!');
      fetchArmors();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'media',
      resistance: 3,
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      {showForm ? (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editingId ? 'Editar Armadura' : 'Nova Armadura'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="armor-name">Nome</Label>
                <Input
                  id="armor-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Colete Tático"
                  maxLength={100}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v as ArmorCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve (-1 mov)</SelectItem>
                    <SelectItem value="media">Média (-2 mov)</SelectItem>
                    <SelectItem value="pesada">Pesada (-3 mov)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resistance */}
              <div className="space-y-2">
                <Label>Resistência</Label>
                <Select 
                  value={formData.resistance.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, resistance: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Prévia dos Modificadores:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Resistência {formData.resistance}</Badge>
                <Badge variant="secondary">Mov {calculateModifiers().movement}</Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Armadura
        </Button>
      )}

      {/* Armors List */}
      {armors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma armadura cadastrada
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Resistência</TableHead>
                <TableHead>Mov</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {armors.map((armor) => (
                <TableRow key={armor.id}>
                  <TableCell className="font-medium">{armor.name}</TableCell>
                  <TableCell>{CATEGORY_LABELS[armor.category]}</TableCell>
                  <TableCell>{armor.resistance}</TableCell>
                  <TableCell>{armor.movement_mod}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(armor)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(armor.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

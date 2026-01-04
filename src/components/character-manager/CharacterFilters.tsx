import React from 'react';
import { CharacterListFilters } from '@/types/character-storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CharacterFiltersProps {
  filters: CharacterListFilters;
  onChange: (filters: CharacterListFilters) => void;
}

export function CharacterFilters({ filters, onChange }: CharacterFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={filters.theme || 'all'}
        onValueChange={(value) => onChange({ ...filters, theme: value as 'akashic' | 'tenebralux' | 'all' })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tema" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Temas</SelectItem>
          <SelectItem value="akashic">Akashic</SelectItem>
          <SelectItem value="tenebralux">Tenebra Lux</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sortBy || 'updatedAt'}
        onValueChange={(value) => onChange({ ...filters, sortBy: value as 'name' | 'createdAt' | 'updatedAt' })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updatedAt">Última atualização</SelectItem>
          <SelectItem value="createdAt">Data de criação</SelectItem>
          <SelectItem value="name">Nome</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

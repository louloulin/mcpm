'use client'
import { Search } from 'lucide-react';
import { Input } from './ui/input';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchInput({ placeholder, className, value, onChange }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder || "搜索..."}
        className="pl-8"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

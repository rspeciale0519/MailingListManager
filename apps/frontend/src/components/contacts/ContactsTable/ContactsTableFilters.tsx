import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTags } from '@/hooks/useTags';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { X, Search, Filter } from 'lucide-react';
import type { ContactFilters } from '@/types';

interface ContactsTableFiltersProps {
  filters: ContactFilters;
  onFilterChange: (filters: Partial<ContactFilters>) => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
];

export function ContactsTableFilters({ filters, onFilterChange }: ContactsTableFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { tags } = useTags();

  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    onFilterChange({ search: debouncedSearch || undefined });
  }, [debouncedSearch, onFilterChange]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    if (value && value !== 'all') {
      onFilterChange({
        filter: {
          field: 'state',
          operator: 'eq',
          value,
        },
      });
    } else {
      onFilterChange({ filter: undefined });
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value && value !== 'all') {
      onFilterChange({
        filter: {
          field: 'status',
          operator: 'eq',
          value,
        },
      });
    } else {
      onFilterChange({ filter: undefined });
    }
  };

  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];

    setSelectedTags(newTags);

    if (newTags.length > 0) {
      onFilterChange({
        filter: {
          field: 'tags',
          operator: 'in',
          value: newTags,
        },
      });
    } else {
      onFilterChange({ filter: undefined });
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedState('all');
    setSelectedStatus('all');
    setSelectedTags([]);
    onFilterChange({
      search: undefined,
      filter: undefined,
    });
  };

  const hasActiveFilters =
    searchInput ||
    (selectedState && selectedState !== 'all') ||
    (selectedStatus && selectedStatus !== 'all') ||
    selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* State Filter */}
        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {US_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by tag:</span>
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              style={
                selectedTags.includes(tag.name)
                  ? { backgroundColor: tag.color, borderColor: tag.color }
                  : undefined
              }
              onClick={() => handleTagToggle(tag.name)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchInput && (
            <Badge variant="secondary" className="pl-3 pr-1">
              Search: {searchInput}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => {
                  setSearchInput('');
                  onFilterChange({ search: undefined });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedState && (
            <Badge variant="secondary" className="pl-3 pr-1">
              State: {selectedState}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => handleStateChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="secondary" className="pl-3 pr-1">
              Status: {STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => handleStatusChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedTags.map((tagName) => (
            <Badge
              key={tagName}
              variant="secondary"
              className="pl-3 pr-1"
              style={{
                backgroundColor: tags.find((t) => t.name === tagName)?.color,
              }}
            >
              Tag: {tagName}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => handleTagToggle(tagName)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

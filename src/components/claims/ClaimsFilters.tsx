import { Search, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClaimsStore } from '@/stores';
import type { ClaimSortField } from '@/types/claim';

const sortOptions: { value: ClaimSortField; label: string }[] = [
  { value: 'dateSubmitted', label: 'Date Submitted' },
  { value: 'amount', label: 'Amount' },
  { value: 'deadlineDate', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
  { value: 'patientName', label: 'Patient Name' },
];

export function ClaimsFilters() {
  const { filter, sort, setFilter, setSort, resetFilters } = useClaimsStore();

  const hasActiveFilters = filter.search || filter.status !== 'all' || filter.priority !== 'all';

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search claims..."
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2">
        <Select
          value={sort.field}
          onValueChange={(value: ClaimSortField) => setSort({ ...sort, field: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSort({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })}
        >
          {sort.order === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

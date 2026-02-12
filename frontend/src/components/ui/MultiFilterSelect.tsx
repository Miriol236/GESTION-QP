import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { Check, ChevronDown, Filter } from "lucide-react";

type MultiFilterSelectProps<T> = {
  items: T[];
  value: T | null;
  onChange: (val: T | null) => void;

  placeholder?: string;

  display?: (item: T) => string;

  open: boolean;
  setOpen: (v: boolean) => void;

  showDefault?: boolean;
};

export function MultiFilterSelect<T>({
  items,
  value,
  onChange,
  placeholder = "Choisir...",
  display,
  open,
  setOpen,
  showDefault = true,
}: MultiFilterSelectProps<T>) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="px-2 py-1 w-full sm:w-auto flex justify-between gap-2"
        >
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-600">Filtre :</span>

          <span className="truncate">
            {value
              ? display
                ? display(value)
                : String(value)
              : placeholder}
          </span>

          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[240px]">
        <Command>
          <CommandInput placeholder="Rechercher..." />

          <CommandList>
            <CommandGroup>
              {showDefault && (
                <CommandItem
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === null
                        ? "opacity-100 text-blue-600"
                        : "opacity-0"
                    }`}
                  />
                  Par défaut
                </CommandItem>
              )}

              {items.map((it, idx) => {
                const isSelected =
                  JSON.stringify(value) === JSON.stringify(it);

                return (
                  <CommandItem
                    key={idx}
                    onSelect={() => {
                      onChange(it);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        isSelected
                          ? "opacity-100 text-blue-600"
                          : "opacity-0"
                      }`}
                    />

                    {display ? display(it) : String(it)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

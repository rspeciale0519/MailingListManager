import { useState, useRef, useEffect } from 'react';
import { useTags } from '@/hooks/useTags';
import { useContacts } from '@/hooks/useContacts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { X, Plus } from 'lucide-react';
import type { Contact } from '@/types';

interface TagPillEditorProps {
  contact: Contact;
}

export function TagPillEditor({ contact }: TagPillEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { tags } = useTags();
  const { updateContact } = useContacts();

  // Get available tag names
  const availableTags = tags.map((t) => t.name);
  const contactTags = contact.tags || [];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setInputValue('');
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTagColor = (tagName: string): string => {
    const tag = tags.find((t) => t.name === tagName);
    return tag?.color || '#6b7280';
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = contactTags.filter((t) => t !== tagToRemove);
    updateContact({
      id: contact.id,
      data: { tags: newTags },
    });
  };

  const handleAddTag = (tagName: string) => {
    if (!tagName.trim() || contactTags.includes(tagName)) return;

    const newTags = [...contactTags, tagName.trim()];
    updateContact({
      id: contact.id,
      data: { tags: newTags },
    });

    setInputValue('');
    setSuggestions([]);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (value.trim()) {
      // Filter suggestions
      const filtered = availableTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !contactTags.includes(tag)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && contactTags.length > 0) {
      // Remove last tag when backspace is pressed with empty input
      handleRemoveTag(contactTags[contactTags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
      setSuggestions([]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1 items-center min-h-[32px]">
        {contactTags.map((tag) => (
          <Badge
            key={tag}
            style={{ backgroundColor: getTagColor(tag) }}
            className="text-white cursor-pointer hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag);
            }}
          >
            {tag}
            <X className="ml-1 h-3 w-3" />
          </Badge>
        ))}

        {isEditing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add tag..."
              className="border-0 focus:ring-0 focus:outline-none text-sm w-24 bg-transparent"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTag(suggestion);
                    }}
                  >
                    <Badge
                      style={{ backgroundColor: getTagColor(suggestion) }}
                      className="text-white"
                    >
                      {suggestion}
                    </Badge>
                  </button>
                ))}
                {/* Option to create new tag */}
                {inputValue &&
                  !availableTags.some((t) => t.toLowerCase() === inputValue.toLowerCase()) && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-t border-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTag(inputValue);
                      }}
                    >
                      <Plus className="inline-block mr-2 h-4 w-4" />
                      Create "{inputValue}"
                    </button>
                  )}
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

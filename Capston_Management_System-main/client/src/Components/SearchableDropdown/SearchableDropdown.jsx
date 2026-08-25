import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import './SearchableDropdown.css';

const SearchableDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...", 
  disabled = false,
  className = "",
  searchPlaceholder = "Search...",
  displayKey = "name",
  valueKey = "id",
  showSearch = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => {
        const displayValue = typeof option === 'string' ? option : option[displayKey];
        return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options, displayKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleSelect = (option) => {
    const optionValue = typeof option === 'string' ? option : option[valueKey];
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const getDisplayValue = () => {
    if (!value) return '';
    const selectedOption = options.find(option => {
      const optionValue = typeof option === 'string' ? option : option[valueKey];
      return optionValue === value;
    });
    
    if (selectedOption) {
      return typeof selectedOption === 'string' ? selectedOption : selectedOption[displayKey];
    }
    return '';
  };

  const getSelectedOption = () => {
    if (!value) return null;
    return options.find(option => {
      const optionValue = typeof option === 'string' ? option : option[valueKey];
      return optionValue === value;
    });
  };

  return (
    <div className={`searchable-dropdown ${className}`} ref={dropdownRef}>
      <div 
        className={`dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="dropdown-value">
          {getDisplayValue() || placeholder}
        </span>
        <div className="dropdown-actions">
          {value && !disabled && (
            <button 
              type="button"
              className="clear-button"
              onClick={handleClear}
              title="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`chevron ${isOpen ? 'rotated' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {showSearch && (
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          
          <div className="options-container">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option[valueKey];
                const optionDisplay = typeof option === 'string' ? option : option[displayKey];
                const isSelected = optionValue === value;
                
                return (
                  <div
                    key={optionValue || index}
                    className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(option)}
                  >
                    {optionDisplay}
                  </div>
                );
              })
            ) : (
              <div className="no-options">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;

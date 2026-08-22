import React, { useState, useRef, useEffect } from 'react';
import './Styles/MultiSelectDropdown.css';

const MultiSelectDropdown = ({
    label,
    options = [], // [{id, label}, ...]
    selectedIds = [],
    onChange,
    placeholder = "Select...",
    searchable = false,
    selectAllExcludeIds = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleOptionClick = (id) => {
        let newSelected;
        if (selectedIds.includes(id)) {
            newSelected = selectedIds.filter(item => item !== id);
        } else {
            newSelected = [...selectedIds, id];
        }
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        const excludeSet = new Set((selectAllExcludeIds || []).map((v) => v));
        const visibleIds = filteredOptions
            .map(o => o.id)
            .filter((id) => !excludeSet.has(id));
        const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));

        if (allVisibleSelected) {
            const newSelected = selectedIds.filter(id => !visibleIds.includes(id));
            onChange(newSelected);
        } else {
            const newSelected = [...new Set([...selectedIds, ...visibleIds])];
            onChange(newSelected);
        }
    };

    const filteredOptions = options.filter(opt =>
        (opt.label || "").toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const excludeSet = new Set((selectAllExcludeIds || []).map((v) => v));
    const filteredSelectableOptions = filteredOptions.filter((opt) => !excludeSet.has(opt.id));

    const areAllVisibleSelected =
        filteredSelectableOptions.length > 0 &&
        filteredSelectableOptions.every(opt => selectedIds.includes(opt.id));

    let displayText = placeholder;
    if (selectedIds.length > 0) {
        const selectableOptionIds = (options || [])
            .map((o) => o.id)
            .filter((id) => !excludeSet.has(id));

        const areAllSelectableSelected =
            selectableOptionIds.length > 0 &&
            selectableOptionIds.every((id) => selectedIds.includes(id));

        if (areAllSelectableSelected) {
            displayText = "All Selected";
        } else {
            displayText = `${selectedIds.length} Selected`;
        }
    }

    return (
        <div className="ms-container" ref={dropdownRef}>
            {label && (
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                </label>
            )}

            <button type="button" className={`ms-trigger ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
                <span className="ms-trigger-text">
                    {displayText}
                </span>
                <span className={`ms-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="ms-dropdown" style={{ zIndex: 10000 }}>
                    {searchable && (
                        <div className="ms-search-box">
                            <input
                                type="text"
                                className="ms-search-input"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="ms-options-list">
                        {filteredSelectableOptions.length > 0 && (
                            <div className={`ms-option ${areAllVisibleSelected ? 'selected' : ''}`} onClick={handleSelectAll}>
                                <div className="ms-checkbox">
                                    <span className="ms-checkbox-check">✓</span>
                                </div>
                                <span>{areAllVisibleSelected ? "Deselect All" : "Select All"}</span>
                            </div>
                        )}

                        {filteredOptions.length === 0 ? (
                            <div className="ms-no-results">No results found</div>
                        ) : (
                            filteredOptions.map(option => {
                                const isSelected = selectedIds.includes(option.id);
                                return (
                                    <div
                                        key={option.id}
                                        className={`ms-option ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleOptionClick(option.id)}
                                    >
                                        <div className="ms-checkbox">
                                            <span className="ms-checkbox-check">✓</span>
                                        </div>
                                        <span>{option.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="ms-footer">
                            <button className="ms-btn-clear" onClick={() => onChange([])}>
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;

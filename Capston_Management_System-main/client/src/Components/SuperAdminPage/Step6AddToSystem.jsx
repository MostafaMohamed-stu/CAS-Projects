import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, AlertCircle, Users, Shield } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig.js';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { axiosInstance } from '../../utils/authService';
import './StepPages.css';

const Step6AddToSystem = ({ onNext, onPrev, currentStep, user }) => {
  const [allAccounts, setAllAccounts] = useState([]); // All accounts from server
  const [roles, setRoles] = useState([]);
  const [businessEntities, setBusinessEntities] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [selectedBusinessEntity, setSelectedBusinessEntity] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingRoles, setAddingRoles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Step6AddToSystem - Fetching data...');
      
      const [accountsRes, rolesRes, businessEntitiesRes] = await Promise.all([
        axiosInstance.get(`/Account/GetAllAccounts`),
        axiosInstance.get(`/Account/GetAllRoles`),
        axiosInstance.get(`/Account/GetBusinessEntities`)
      ]);
      
      // Handle accounts - check for paginated response or direct array
      let accountsData = [];
      if (accountsRes.data?.accounts) {
        accountsData = accountsRes.data.accounts;
      } else if (accountsRes.data?.Accounts) {
        accountsData = accountsRes.data.Accounts;
      } else if (Array.isArray(accountsRes.data)) {
        accountsData = accountsRes.data;
      } else if (accountsRes.data?.$values) {
        accountsData = accountsRes.data.$values;
      }
      
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.$values || []);
      const businessEntitiesData = Array.isArray(businessEntitiesRes.data) ? businessEntitiesRes.data : (businessEntitiesRes.data?.$values || []);
      
      console.log('Step6AddToSystem - Accounts loaded:', accountsData.length);
      console.log('Step6AddToSystem - Roles:', rolesData.length);
      console.log('Step6AddToSystem - Business Entities:', businessEntitiesData.length);
      
      setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
      setRoles(rolesData);
      setBusinessEntities(businessEntitiesData);
    } catch (error) {
      console.error('Step6AddToSystem - Error fetching data:', error);
      showError(`Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and pagination
  const getFilteredAccounts = () => {
    let filtered = allAccounts;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(account => 
        (account.fullNameEn || account.FullNameEn || '').toLowerCase().includes(query) ||
        (account.fullNameAr || account.FullNameAr || '').toLowerCase().includes(query) ||
        (account.email || account.Email || '').toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredAccounts = getFilteredAccounts();
  const totalPages = Math.ceil(filteredAccounts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedAccounts.length === paginatedAccounts.length && paginatedAccounts.length > 0) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(paginatedAccounts.map(a => a.id || a.Id));
    }
  };

  const handleSelectAccount = (accountId) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleAddRoles = async () => {
    if (selectedAccounts.length === 0) {
      showWarning('Please select at least one account');
      return;
    }

    if (!selectedRoleName || !selectedRoleName.trim()) {
      showWarning('Please select a role');
      return;
    }

    if (!selectedBusinessEntity || !selectedBusinessEntity.trim()) {
      showWarning('Please select a business entity');
      return;
    }

    try {
      setAddingRoles(true);
      console.log('Step6AddToSystem - Adding roles to accounts:', {
        accountIds: selectedAccounts,
        roleName: selectedRoleName,
        businessEntityName: selectedBusinessEntity
      });
      
      const response = await axiosInstance.post(`/Account/AddRolesToAccounts`, {
        accountIds: selectedAccounts,
        roleName: selectedRoleName.trim(),
        businessEntityName: selectedBusinessEntity.trim()
      });
      
      const addedCount = response.data?.addedCount || selectedAccounts.length;
      showSuccess(`Successfully added role to ${addedCount} account(s)!`);
      setSelectedAccounts([]);
      setSelectedRoleName('');
      setSelectedBusinessEntity('');
      fetchData();
    } catch (error) {
      console.error('Step6AddToSystem - Error adding roles:', error);
      showError(`Error adding roles: ${error.response?.data?.error || error.message}`);
    } finally {
      setAddingRoles(false);
    }
  };

  const isAccountSelected = (accountId) => {
    return selectedAccounts.includes(accountId);
  };

  // Get unique role names (no duplicates)
  const uniqueRoleNames = React.useMemo(() => {
    const roleNamesSet = new Set();
    roles.forEach(role => {
      const roleName = role.roleName || role.RoleName;
      if (roleName) {
        roleNamesSet.add(roleName);
      }
    });
    return Array.from(roleNamesSet).sort();
  }, [roles]);

  return (
    <div className="step-page step6-add-to-system">
      <div className="step-header">
        <div className="step-title">
          <Shield className="step-title-icon" />
          <div>
            <h2>Add Roles to Accounts</h2>
            <p>Select accounts, role, and business entity to add roles to accounts</p>
          </div>
        </div>
      </div>

      <div className="step-content step6-add-to-system-content">
        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Role and Business Entity Selection */}
            <div className="role-selection-section" style={{ 
              display: 'flex', 
              gap: '20px', 
              marginBottom: '20px',
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.9rem'
                }}>
                  Select Role
                </label>
                <select
                  value={selectedRoleName}
                  onChange={(e) => setSelectedRoleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select a Role --</option>
                  {uniqueRoleNames.map((roleName, index) => (
                    <option key={index} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.9rem'
                }}>
                  Select Business Entity
                </label>
                <select
                  value={selectedBusinessEntity}
                  onChange={(e) => setSelectedBusinessEntity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select a Business Entity --</option>
                  {businessEntities.map((entity, index) => (
                    <option key={index} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search accounts by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div className="action-bar step6-action-bar">
              <div className="selection-info step6-selection-info">
                <span>
                  {selectedAccounts.length} account(s) selected {filteredAccounts.length > 0 && `(Total: ${filteredAccounts.length})`}
                </span>
              </div>
              <div className="action-buttons step6-action-buttons">
                <button
                  className="select-all-button step6-select-all-btn"
                  onClick={handleSelectAll}
                  disabled={paginatedAccounts.length === 0}
                >
                  {selectedAccounts.length === paginatedAccounts.length && paginatedAccounts.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  className="add-button step6-add-btn"
                  onClick={handleAddRoles}
                  disabled={selectedAccounts.length === 0 || !selectedRoleName.trim() || !selectedBusinessEntity.trim() || addingRoles}
                  style={{
                    backgroundColor: selectedAccounts.length === 0 || !selectedRoleName.trim() || !selectedBusinessEntity.trim() ? '#d1d5db' : '#ef4444'
                  }}
                >
                  <UserPlus className="button-icon" />
                  {addingRoles ? 'Adding...' : `Add Role to ${selectedAccounts.length} Account(s)`}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Loading accounts...</p>
              </div>
            ) : paginatedAccounts.length > 0 ? (
              <>
                <div className="students-grid">
                  {paginatedAccounts.map((account) => (
                    <div
                      key={account.id || account.Id}
                      className={`student-card ${isAccountSelected(account.id || account.Id) ? 'selected' : ''}`}
                      onClick={() => handleSelectAccount(account.id || account.Id)}
                    >
                      <div className="student-checkbox">
                        {isAccountSelected(account.id || account.Id) && (
                          <CheckCircle className="check-icon" />
                        )}
                      </div>
                      <div className="student-info">
                        <h4>{account.fullNameEn || account.FullNameEn}</h4>
                        <p className="student-email">{account.email || account.Email}</p>
                        {account.fullNameAr || account.FullNameAr ? (
                          <p className="student-ar">{account.fullNameAr || account.FullNameAr}</p>
                        ) : null}
                        {account.phone || account.Phone ? (
                          <p className="student-class">
                            <strong>Phone:</strong> {account.phone || account.Phone}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '30px',
                    padding: '20px'
                  }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      style={{
                        padding: '10px 20px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: currentPage > 1 ? 'white' : '#f3f4f6',
                        color: currentPage > 1 ? '#374151' : '#9ca3af',
                        cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage > 1) {
                          e.target.style.borderColor = '#ef4444';
                          e.target.style.color = '#ef4444';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage > 1) {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.color = '#374151';
                        }
                      }}
                    >
                      Previous
                    </button>

                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center'
                    }}>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            style={{
                              padding: '10px 16px',
                              border: currentPage === pageNum ? '2px solid #ef4444' : '2px solid #d1d5db',
                              borderRadius: '8px',
                              backgroundColor: currentPage === pageNum ? '#ef4444' : 'white',
                              color: currentPage === pageNum ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: currentPage === pageNum ? '600' : '500',
                              transition: 'all 0.2s ease',
                              minWidth: '40px'
                            }}
                            onMouseEnter={(e) => {
                              if (currentPage !== pageNum) {
                                e.target.style.borderColor = '#ef4444';
                                e.target.style.color = '#ef4444';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentPage !== pageNum) {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.color = '#374151';
                              }
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages || loading}
                      style={{
                        padding: '10px 20px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: currentPage < totalPages ? 'white' : '#f3f4f6',
                        color: currentPage < totalPages ? '#374151' : '#9ca3af',
                        cursor: currentPage < totalPages ? 'pointer' : 'not-allowed',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage < totalPages) {
                          e.target.style.borderColor = '#ef4444';
                          e.target.style.color = '#ef4444';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage < totalPages) {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.color = '#374151';
                        }
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Page Info */}
                {totalPages > 0 && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    color: '#6b7280',
                    fontSize: '0.9rem'
                  }}>
                    Page {currentPage} of {totalPages} ({filteredAccounts.length} total accounts)
                  </div>
                )}
              </>
            ) : (
              <div className="no-data">
                <AlertCircle className="no-data-icon" />
                <p>{searchQuery ? 'No accounts found matching your search' : 'No accounts available'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Step6AddToSystem;

import { API_BASE_URL } from '../config/apiConfig';
import { authService } from './authService';

class StaffAdminService {
  // Get all accounts for StaffAdmin
  async getAllAccounts() {
    try {
      const token = authService.getAccessToken();
      console.log('StaffAdminService - Token:', token ? 'Present' : 'Missing');
      console.log('StaffAdminService - API URL:', `${API_BASE_URL}/Account/StaffAdmin/All`);
      
      const response = await fetch(`${API_BASE_URL}/Account/StaffAdmin/All`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Not allowed (403)');
        }
        const errorText = await response.text();
        console.error('StaffAdminService - Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  // Create StaffAdmin account
  async createStaffAdmin(accountData) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Account/CreateStaffAdmin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating staff admin account:', error);
      throw error;
    }
  }

  // Update account
  async updateAccount(accountId, accountData) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Account/${accountId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount(accountId) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Account/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Get roles for dropdown
  async getRoles() {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Account/Roles/Capstone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  // Get classes for dropdown
  async getClasses() {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Class`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  }

  // Create simple account (same as SuperAdminPage)
  async createSimpleAccount(accountData) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Account/CreateSimple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating simple account:', error);
      throw error;
    }
  }

  // Get all teams
  async getAllTeams() {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Teams`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  // Update team
  async updateTeam(teamId, teamData) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // Assign team leader to a team
  async assignTeamLeader(teamId, teamLeaderId) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Teams/${teamId}/AssignLeader`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ TeamLeaderId: teamLeaderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error assigning team leader:', error);
      throw error;
    }
  }

  // Delete team
  async deleteTeam(teamId) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/Teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  // Delete a team member by id
  async deleteTeamMember(teamMemberId) {
    try {
      const token = authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/TeamMembers/${teamMemberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  }
}

export const staffAdminService = new StaffAdminService();
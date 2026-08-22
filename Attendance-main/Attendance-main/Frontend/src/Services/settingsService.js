import api from './api';

export const settingsService = {
  getCurrentUserProfile: async () => {
    try {
      const accountId = localStorage.getItem('userId');
      if (!accountId) {
        throw new Error('User not authenticated');
      }
      const response = await api.get(`/StudentProfile/account/${accountId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },

  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/Account/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user profile');
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/settings/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }
};

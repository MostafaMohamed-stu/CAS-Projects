import api from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const absenceService = {
  getAllAbsences: async () => {
    try {
      const response = await api.get('/api/Absence/GetAllAbsenceRecords', {
        headers: getAuthHeaders(),
      });

      const data = response.data;

      return Array.isArray(data)
        ? data.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          studentName: a.studentName || '',
          studentNameAr: a.studentNameAr || '',
          date: a.date ? String(a.date).split('T')[0] : '',
          dateOfAbsence: a.dateOfAbsence ? String(a.dateOfAbsence).split('T')[0] : (a.date ? String(a.date).split('T')[0] : ''),
          session: a.session ?? a.sessionId ?? 0,
          classId: a.classId ?? 0,
          class: a.class || a.className || '',
          grade: a.grade || a.gradeName || '',
          recordedAt: a.recordedAt || null,
          status: 'Absent',
          absenceTypeId: a.absenceTypeId,
          excuseStatus: (a.absenceTypeId === 20) ? 'With Excuse' : 'Without Excuse',
          lecturerId: a.lecturerId ?? a.lectuerId ?? a.lectuerID ?? a.LectuerId ?? a.LecturerId ?? a.lecturerId ?? null,
          lecturerName: a.lecturerName ?? a.LecturerName ?? null,
          lecturerNameAr: a.lecturerNameAr ?? a.LecturerNameAr ?? null,
          _original: a
        }))
        : [];
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch absence records';
      console.error('Error fetching absence records:', message);
      throw new Error(message);
    }
  },

  addAbsence: async (absenceData) => {
    try {
      const payload = {
        studentId: Number(absenceData.studentId),
        classId: Number(absenceData.classId),
        dateOfAbsence: new Date(absenceData.date).toISOString(),
        lectuerID: Number(absenceData.lecturerId),
        sessionID: Number(absenceData.session),
        absenceTypeId: absenceData.absenceTypeId === null ? null : (Number(absenceData.absenceTypeId) || 1),
      };

      const response = await api.post('/api/Absence/AddAbsenceRecord', payload, {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to add absence record';
      console.error('Error adding absence record:', message);
      throw new Error(message);
    }
  },

  deleteAbsence: async (id) => {
    try {
      await api.delete(`/api/Absence/DeleteAbsenceRecord/${id}`, {
        headers: getAuthHeaders(),
      });
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to remove absence record';
      console.error('Error deleting absence record:', message);
      throw new Error(message);
    }
  },

  updateAbsenceType: async (id, absenceTypeId) => {
    try {
      const endpoints = [
        `/api/Absence/UpdateAbsenceType/${id}`,
        `/api/Absence/${id}`,
        `/api/Absence/Update/${id}`,
        `/api/Absence/UpdateAbsenceRecord/${id}`
      ];

      let lastError;
      for (const endpoint of endpoints) {
        try {
          const response = await api.put(endpoint, {
            absenceTypeId: absenceTypeId === null ? null : Number(absenceTypeId)
          }, {
            headers: getAuthHeaders(),
          });
          return response.data;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update absence type';
      console.error('Error updating absence type:', message);
      throw new Error(message);
    }
  },

  getAbsenceTypes: async () => {
    try {
      const response = await api.get('/api/AbsenceType', { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error fetching absence types:', error);
      return [];
    }
  },

  getAllGrades: async () => {
    try {
      const response = await api.get('/api/Grade', { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error fetching grades:', error);
      return [];
    }
  },

  getClassesByGrade: async (gradeName) => {
    try {
      if (!gradeName) return [];
      const response = await api.get(`/api/Classes/by-grade?gradeName=${encodeURIComponent(gradeName)}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },

  getAllSessions: async () => {
    try {
      const response = await api.get('/api/Session', { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  },

  getStudentsByClass: async (gradeName, className) => {
    try {
      if (!gradeName || !className) return [];
      const response = await api.get(`/api/Students/by-class-name?gradeName=${encodeURIComponent(gradeName)}&className=${encodeURIComponent(className)}`, {
        headers: getAuthHeaders(),
      });
      console.log(`absenceService.getStudentsByClass(${gradeName}, ${className}) response:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  getAllStudents: async () => {
    try {
      const response = await api.get('/api/Students/all', {
        headers: getAuthHeaders(),
      });
      console.log("absenceService.getAllStudents response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching all students:', error);
      return [];
    }
  },

  getFilteredAbsences: async (gradeName, className, fromDate, toDate) => {
    try {
      const params = new URLSearchParams();
      if (gradeName) params.append('gradeName', gradeName);
      if (className) params.append('className', className);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await api.get(`/api/Absence/GetFilteredAbsences?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      console.log("absenceService.getFilteredAbsences response:", response.data);
      const data = response.data;
      return Array.isArray(data)
        ? data.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          studentName: a.studentName || '',
          studentNameAr: a.studentNameAr || '',
          date: a.date ? String(a.date).split('T')[0] : '',
          session: a.session ?? a.sessionId ?? 0,
          classId: a.classId ?? 0,
          class: a.class || a.className || '',
          grade: a.grade || a.gradeName || '',
          recordedAt: a.recordedAt || a.date || null,
          status: 'Absent',
          absenceTypeId: a.absenceTypeId,
          excuseStatus: (a.absenceTypeId === 20) ? 'With Excuse' : 'Without Excuse',
          lecturerId: a.lecturerId ?? a.lectuerId ?? a.lectuerID ?? a.LectuerId ?? a.LecturerId ?? a.lecturerId ?? null,
          lecturerName: a.lecturerName ?? a.LecturerName ?? null,
          lecturerNameAr: a.lecturerNameAr ?? a.LecturerNameAr ?? null,
          _original: a
        }))
        : [];
    } catch (error) {
      console.error('Error fetching filtered absences:', error);
      return [];
    }
  },

  getLowAttendanceStudents: async (minAbsences = 5, maxAbsences = 100) => {
    try {
      const response = await api.get(`/api/Absence/GetLowAttendanceStudents?minAbsences=${minAbsences}&maxAbsences=${maxAbsences}`, {
        headers: getAuthHeaders(),
      });
      console.log("absenceService.getLowAttendanceStudents response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching low attendance students:', error);
      return [];
    }
  },

  getAttendanceStatistics: async (gradeName, className, fromDate, toDate) => {
    try {
      const params = new URLSearchParams();
      if (gradeName) params.append('gradeName', gradeName);
      if (className) params.append('className', className);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await api.get(`/api/Absence/GetAttendanceStatistics?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      console.log("absenceService.getAttendanceStatistics response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance statistics:', error);
      return null;
    }
  },
};

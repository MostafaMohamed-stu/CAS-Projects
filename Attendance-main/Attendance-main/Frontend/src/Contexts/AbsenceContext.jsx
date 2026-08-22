import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { absenceService } from '../Services/absenceService';

const AbsenceContext = createContext();

export const AbsenceProvider = ({ children }) => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAbsences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await absenceService.getAllAbsences();
      setAbsences(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load absence records');
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAbsences();
  }, [loadAbsences]);

  const addAbsence = async (student, className, session, date) => {
    try {
      setLoading(true);
      setError(null);
      const absenceData = {
        studentId: student.id,
        classId: student.classId,
        date: date || new Date().toISOString().split('T')[0],
        session: parseInt(session, 10),
        lecturerId: 1,
      };
      await absenceService.addAbsence(absenceData);
      await loadAbsences();
    } catch (err) {
      setError(err.message || 'Failed to add absence record');
    } finally {
      setLoading(false);
    }
  };

  const getAbsences = (filters = {}) => {
    console.log("AbsenceContext: getAbsences called with filters:", filters);
    const list = Array.isArray(absences) ? absences : [];

    const filtered = list.filter((a) => {
      const matches = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        switch (key) {
          case 'sessions':
            if (!Array.isArray(value) || value.length === 0) return true;
            return value.map(v => String(v)).includes(String(a.session || ''));
          case 'date':
            return (a.date ? String(a.date).split('T')[0] : '') === value;
          case 'session':
            return String(a.session || '') === String(value);
          case 'class':
            return String(a.class || '').trim().toLowerCase() === String(value).trim().toLowerCase();
          case 'grade':
            return String(a.grade || '').trim().toLowerCase() === String(value).trim().toLowerCase();
          case 'studentIds':
            if (!Array.isArray(value) || value.length === 0) return true;
            const studentIdSet = new Set(value.map(v => String(v)));
            return studentIdSet.has(String(a.studentId));
          default:
            return true;
        }
      });
      return matches;
    });
    console.log("AbsenceContext: getAbsences returning filtered list:", filtered);
    return filtered;
  };

  const removeAbsence = async (id) => {
    try {
      setError(null);
      const listSnapshot = Array.isArray(absences) ? absences : [];
      const target = listSnapshot.find((record) => Number(record.id) === Number(id));
      if (!target) return;

      const targetDate = target.date ? String(target.date).split("T")[0] : "";
      const hasEntireDay = listSnapshot.some((record) => {
        const recordDate = record.date ? String(record.date).split("T")[0] : "";
        return (
          Number(record.studentId) === Number(target.studentId) &&
          recordDate === targetDate &&
          Number(record.session) === -1
        );
      });

      if (hasEntireDay) {
        const sameDayIds = listSnapshot
          .filter((record) => {
            const recordDate = record.date ? String(record.date).split("T")[0] : "";
            return (
              Number(record.studentId) === Number(target.studentId) &&
              recordDate === targetDate
            );
          })
          .map((record) => record.id);

        await Promise.all(sameDayIds.map((recordId) => absenceService.deleteAbsence(recordId)));
      } else {
        await absenceService.deleteAbsence(id);
      }
      setAbsences((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const target = list.find((record) => Number(record.id) === Number(id));
        if (!target) return list;

        const targetDate = target.date ? String(target.date).split("T")[0] : "";
        const hasEntireDay = list.some((record) => {
          const recordDate = record.date ? String(record.date).split("T")[0] : "";
          return (
            Number(record.studentId) === Number(target.studentId) &&
            recordDate === targetDate &&
            Number(record.session) === -1
          );
        });

        if (hasEntireDay) {
          return list.filter((record) => {
            const recordDate = record.date ? String(record.date).split("T")[0] : "";
            return !(
              Number(record.studentId) === Number(target.studentId) &&
              recordDate === targetDate
            );
          });
        }

        return list.filter((record) => Number(record.id) !== Number(id));
      });
    } catch (err) {
      setError(err.message || 'Failed to remove absence record');
    }
  };

  return (
    <AbsenceContext.Provider
      value={{
        absences: Array.isArray(absences) ? absences : [],
        setAbsences,
        loading,
        error,
        addAbsence,
        getAbsences,
        removeAbsence,
        loadAbsences,
      }}
    >
      {children}
    </AbsenceContext.Provider>
  );
};

export const useAbsence = () => {
  const ctx = useContext(AbsenceContext);
  if (!ctx) throw new Error('useAbsence must be used within an AbsenceProvider');
  return ctx;
};

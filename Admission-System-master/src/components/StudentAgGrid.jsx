/**
 * Backward-compatibility shim.
 * AdminDashboardPage imports this file unchanged — it now delegates to the
 * new production-grade StudentGrid component.
 *
 * Props forwarded transparently:
 *   students, isLoading, error, onRefresh (new),
 *   calculatePercentage, getExamTotal, getExamMaximum,
 *   handleViewStudentDetails
 */
export { default } from './StudentGrid/index.jsx';

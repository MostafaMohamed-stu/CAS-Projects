# Frontend Utils

هذا المجلد يحتوي على الملفات المساعدة والـ constants المستخدمة في الـ frontend.

## statusConstants.js

يحتوي على جميع الـ status constants المستخدمة في الـ frontend لتطابق الـ backend StatusConstants.

### الاستخدام

```javascript
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants";

// استخدام الـ constants
if (task.statusId === STATUS_CONSTANTS.TASK_COMPLETED) {
  // المهمة مكتملة
}

// استخدام الـ helper functions
const statusText = StatusHelpers.getStatusText(statusId, deadline, isPendingTask);
const statusColor = StatusHelpers.getStatusColor(statusId, deadline, isPendingTask);
```

### الـ Constants المتاحة

#### Task Status IDs
- `TASK_PENDING` (1) - المهمة في انتظار البدء
- `TASK_IN_PROGRESS` (2) - المهمة قيد التنفيذ
- `TASK_COMPLETED` (12) - المهمة مكتملة
- `TASK_REJECTED` (6) - المهمة مرفوضة
- `TASK_SUBMITTED_ON_TIME` (10) - المهمة تم تسليمها في الوقت المحدد
- `TASK_SUBMITTED_LATE` (11) - المهمة تم تسليمها متأخرة
- `TASK_COMPLETED_LATE` (13) - المهمة تم إكمالها متأخرة

#### Report Status IDs
- `REPORT_SUBMITTED` (1) - التقرير تم تقديمه
- `REPORT_UNDER_REVIEW` (2) - التقرير قيد المراجعة
- `REPORT_APPROVED` (3) - التقرير معتمد
- `REPORT_REJECTED` (4) - التقرير مرفوض
- `REPORT_CONFIRMED` (5) - التقرير مؤكد

#### General Status IDs
- `ACTIVE` (1) - نشط/مفعل
- `INACTIVE` (2) - غير نشط/معطل

### Helper Functions

- `getTaskSubmissionStatus(isLate)` - يحصل على الـ status المناسب بناءً على توقيت التسليم
- `getTaskCompletionStatus(isCompletedLate)` - يحصل على الـ status المناسب بناءً على توقيت الإكمال
- `getDefaultReportStatus()` - يحصل على الـ status الافتراضي للتقرير
- `getStatusText(statusId, deadline, isPendingTask)` - يحصل على نص الـ status
- `getStatusColor(statusId, deadline, isPendingTask)` - يحصل على لون الـ status

## كيفية التحديث

إذا كنت تريد تغيير أي من الـ status IDs، قم بتعديل القيم في ملف `statusConstants.js` فقط. هذا سيؤثر على جميع الأماكن التي تستخدم هذه الـ constants في الـ frontend.

### مثال على التغيير

```javascript
// لتغيير TASK_REJECTED من 6 إلى 7
export const STATUS_CONSTANTS = {
  // ...
  TASK_REJECTED: 7, // بدلاً من 6
  // ...
};
```

هذا التغيير سيؤثر تلقائياً على جميع الأماكن التي تستخدم `STATUS_CONSTANTS.TASK_REJECTED` في الـ frontend.

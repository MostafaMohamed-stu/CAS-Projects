# Status Constants

هذا المجلد يحتوي على جميع الـ constants المستخدمة في النظام لتسهيل إدارة الـ status IDs.

## StatusConstants.cs

يحتوي هذا الملف على جميع الـ status IDs المستخدمة في النظام، مقسمة حسب النوع:

### Task Status IDs
- `TaskPending` (1L) - المهمة في انتظار البدء
- `TaskInProgress` (2L) - المهمة قيد التنفيذ
- `TaskCompleted` (12L) - المهمة مكتملة
- `TaskRejected` (6L) - المهمة مرفوضة
- `TaskSubmittedOnTime` (10L) - المهمة تم تسليمها في الوقت المحدد
- `TaskSubmittedLate` (11L) - المهمة تم تسليمها متأخرة
- `TaskCompletedLate` (13L) - المهمة تم إكمالها متأخرة

### Report Status IDs
- `ReportSubmitted` (1L) - التقرير تم تقديمه (الحالة الافتراضية)
- `ReportUnderReview` (2L) - التقرير قيد المراجعة
- `ReportApproved` (3L) - التقرير معتمد
- `ReportRejected` (4L) - التقرير مرفوض

### General Status IDs
- `Active` (1L) - نشط/مفعل
- `Inactive` (2L) - غير نشط/معطل

### Helper Methods
- `GetTaskSubmissionStatus(bool isLate)` - يحصل على الـ status المناسب بناءً على توقيت التسليم
- `GetTaskCompletionStatus(bool isCompletedLate)` - يحصل على الـ status المناسب بناءً على توقيت الإكمال
- `GetDefaultReportStatus()` - يحصل على الـ status الافتراضي للتقرير

## كيفية الاستخدام

بدلاً من استخدام الأرقام مباشرة في الكود:

```csharp
// ❌ الطريقة القديمة
submission.StatusId = 6; // rejected

// ✅ الطريقة الجديدة
submission.StatusId = StatusConstants.TaskRejected;
```

## كيفية تغيير الـ Status IDs

إذا كنت تريد تغيير أي من الـ status IDs، قم بتعديل القيم في ملف `StatusConstants.cs` فقط. هذا سيؤثر على جميع الأماكن التي تستخدم هذه الـ constants في النظام.

## مثال على التغيير

إذا كنت تريد تغيير ID المهمة المرفوضة من 6 إلى 7:

```csharp
// في StatusConstants.cs
public const long TaskRejected = 7L; // بدلاً من 6L
```

هذا التغيير سيؤثر تلقائياً على جميع الأماكن التي تستخدم `StatusConstants.TaskRejected` في النظام.

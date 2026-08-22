SELECT 
    
    StudName =a.FullNameAR,
	SocialID =a.NationalId,
	Prep_Scores = concat('MathPrep=', ap.MathScore,'|','EnglishPrep=',ap.EnglishScore),
    [Prep_Final%] =convert(decimal(10,2), ap.ThirdPrepScore*100.0/(1.0*280.0)),
    [MinistryExam%] = ap.MinistryExamPercentage,
    i.InterviewersScores,
	i.Interviewers_SUM_Scores,
	i.Interviewers_Count ,
	i.[Interviewers_AVG_Scores%],
	SchoolExamSectionScores=E.ExamSectionScores
	,SchoolExamSection_SUM_Scores=E.ExamSection_SUM_Scores
	,SchoolExamSection_Count=E.ExamSection_Count
	,[SchoolExamSection_Scores_AVG%]=E.[ExamSection_Scores_AVG%]
	, [ResultAdmission1%] = Convert(Decimal(6,2),(i.[Interviewers_AVG_Scores%]+E.[ExamSection_Scores_AVG%])/2.0)
	, [ResultAdmission2%] = Convert(Decimal(6,2),(convert(decimal(10,2), ap.ThirdPrepScore*100.0/(1.0*280.0))+ap.MinistryExamPercentage+i.[Interviewers_AVG_Scores%]+E.[ExamSection_Scores_AVG%])/4.0)
FROM dbo.Account a
INNER JOIN dbo.AdmissionProfile ap
    ON a.Id = ap.AccountId
INNER JOIN (
SELECT   InterviewersScores=  STRING_AGG(ii.score, ', ') ,
		Interviewers_SUM_Scores=Sum(ii.score),
		Interviewers_Count =Count(ii.score),
		[Interviewers_AVG_Scores%]=Convert(Decimal(10,2), (Sum(ii.score)/(1.0*Count(ii.score)))*100.0/40.0),
		AccountId
    FROM dbo.InterviewScore ii
	Group 	by AccountId
	) i    ON a.Id = i.AccountId
inner join (
SELECT [AccountId]
      ,ExamSectionScores= Concat('[ExamArabicScore]=',[ExamArabicScore], '|',
	  '[ExamEnglishScore]=',[ExamEnglishScore],'|',
      '[ExamMathScore]=',[ExamMathScore],'|',
      '[ExamSoftwareScore]=',[ExamSoftwareScore],'|'
      ) 
		,ExamSection_SUM_Scores=([ExamArabicScore]+[ExamEnglishScore]+[ExamMathScore]+[ExamSoftwareScore])
		,ExamSection_Count=4
		,[ExamSection_Scores_AVG%]=Convert(Decimal(10,2), ([ExamArabicScore]+[ExamEnglishScore]+[ExamMathScore]+[ExamSoftwareScore])*100.0/60.0)		
  FROM [dbo].[StudentExamResult] s) E
on a.id = E.AccountID
WHERE
a.IsActive =1
--a.Id > 35;


/*
SELECT   ConcatenatedString
=  STRING_AGG(i.score, ', ') 
    FROM dbo.InterviewScore i
	where i.AccountId = 46


SELECT [AccountId]
      ,[ExamArabicScore]
      ,[ExamEnglishScore]
      ,[ExamMathScore]
      ,[ExamSoftwareScore]
  FROM [dbo].[StudentExamResult] s
  where s.AccountId = 46

 


*/


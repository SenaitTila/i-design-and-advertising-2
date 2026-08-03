import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/authApi';

const Quizzes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Layout States
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(1); 

  // Core Submission and Selection Tracking States
  const [selectedAnswers, setSelectedAnswers] = useState({}); 
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null); 

  // Countdown Tracking Matrix
  const [timeLeft, setTimeLeft] = useState(null); 
  const timerRef = useRef(null);
  const answersRef = useRef(selectedAnswers);
  const timeLeftRef = useRef(timeLeft);

  // Keep references synced for closures
  useEffect(() => {
    answersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // 1. Fetch data on initialization and handle attempt resets or prior submissions
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await API.get(`/student/quizzes/course/${courseId}`);
        const { data, restoredSession, results: existingResults } = response.data;
        
        if (!data) {
          throw new Error("The database returned an empty record matrix for this route.");
        }
        
        setQuiz(data);

        const parsedTitle = typeof data.title === 'object' && data.title !== null 
          ? data.title.text 
          : data.title;
        document.title = `${parsedTitle || "Quiz Assessment"} | Creative Academy`;

        if (data.questionsPerPage && Number(data.questionsPerPage) > 0) {
          setQuestionsPerPage(Number(data.questionsPerPage));
        } else {
          setQuestionsPerPage(1); 
        }

        // Handle completed vs active states and fresh attempt resets
        if (existingResults || restoredSession?.isSubmitted) {
          setResults(existingResults || restoredSession.results);
          setTimeLeft(0);
        } else {
          // Fresh attempt or ongoing session initialization
          setSelectedAnswers(restoredSession?.answers || {});
          setResults(null);
          setCurrentPage(1); // Reset to first page for new attempts

          if (restoredSession?.timeLeft !== undefined && restoredSession.timeLeft !== null) {
            setTimeLeft(restoredSession.timeLeft);
          } else if (data.duration && Number(data.duration) > 0) {
            setTimeLeft(Number(data.duration) * 60); 
          } else {
            setTimeLeft(3600); 
          }
        }

      } catch (err) {
        console.error("Fetch intercepted catch error block:", err);
        setError(err.response?.data?.error || err.message || "No quiz configuration found for this course track.");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchQuizDetails();
  }, [courseId]);

  // Shared Core Submission Processor Engine
  const executeFinalSubmission = useCallback(async (currentAnswers) => {
    if (!quiz || submitting || results) return;
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const completePayloadPipeline = Object.entries(currentAnswers).map(([qId, index]) => ({
        questionId: qId,
        selectedOptionIndex: index !== undefined ? index : null
      }));

      quiz.questions.forEach((q) => {
        if (currentAnswers[q._id] === undefined) {
          completePayloadPipeline.push({ questionId: q._id, selectedOptionIndex: null });
        }
      });

      const response = await API.post(`/student/quizzes/${quiz._id}/submit`, {
        courseId,
        answers: completePayloadPipeline,
      });
      
      setResults(response.data.data);
    } catch (err) {
      alert(err.response?.data?.error || "Evaluation engine dropped configuration checks.");
    } finally {
      setSubmitting(false);
    }
  }, [quiz, courseId, submitting, results]);

  const handleAutoSubmitQuiz = useCallback(async () => {
    console.warn("Time horizon reached absolute threshold value. Triggering safe data dispatch cascade.");
    await executeFinalSubmission(answersRef.current);
  }, [executeFinalSubmission]);

  // 2. Countdown Tick Mechanism (Decrements every second locally)
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || results || error || !quiz) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitQuiz(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, results, error, quiz, handleAutoSubmitQuiz]);

  // 3. Continuous Database Synchronization (Syncs choices & time silently in background using _skipGlobalLoading)
  useEffect(() => {
    if (loading || error || results || !quiz || timeLeft === null || timeLeft <= 0) return;

    const synchronizeSessionToDatabase = async () => {
      try {
        await API.post('/student/quizzes/sync-session', {
          courseId,
          quizId: quiz._id,
          answers: answersRef.current,
          timeLeft: timeLeftRef.current
        }, { _skipGlobalLoading: true });
      } catch (err) {
        console.error('Telemetry matrix session synchronization dropped:', err);
      }
    };

    const syncDebounceHandler = setTimeout(() => {
      synchronizeSessionToDatabase();
    }, 1000);

    return () => clearTimeout(syncDebounceHandler);
  }, [selectedAnswers, timeLeft, quiz, loading, error, results, courseId]);

  // Instant save on user selection click (Silently synced in background using _skipGlobalLoading)
  const handleOptionSelect = async (questionId, optionIndex) => {
    if (results || timeLeft === 0 || submitting) return; 
    
    const updatedAnswers = {
      ...selectedAnswers,
      [questionId]: optionIndex,
    };
    
    setSelectedAnswers(updatedAnswers);

    try {
      await API.post('/student/quizzes/sync-session', {
        courseId,
        quizId: quiz._id,
        answers: updatedAnswers,
        timeLeft: timeLeftRef.current
      }, { _skipGlobalLoading: true });
    } catch (err) {
      console.error("Instant option database sync failed:", err);
    }
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!quiz || !quiz.questions) return;

    const totalQuestionsCount = quiz.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < totalQuestionsCount && !window.confirm("You have unanswered questions. Are you sure you want to submit your final attempts?")) {
      return;
    }

    await executeFinalSubmission(selectedAnswers);
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 tracking-wide">Compiling Assessment Engine...</p>
        </div>
      </div>
    );
  }

  const totalQuestionsList = quiz?.questions || [];
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestionsSlice = totalQuestionsList.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPagesCount = Math.ceil(totalQuestionsList.length / questionsPerPage) || 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
      <main className="flex-grow max-w-4xl w-full mx-auto p-4 md:p-8">
        {error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-12 shadow-md">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-lg font-bold text-slate-800 mt-4">Module Unresolved</h2>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="mt-6 inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl transition-colors text-white shadow-sm shadow-indigo-100"
            >
              ← Back to Course Theater
            </button>
          </div>
        ) : (
          quiz && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm relative overflow-hidden">
                <div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold tracking-wider uppercase px-2.5 py-1 rounded-md">
                    Knowledge Assessment Pipeline
                  </span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-2">
                    {typeof quiz.title === 'object' && quiz.title !== null
                      ? quiz.title.text || "Course Final Evaluation"
                      : quiz.title || "Course Final Evaluation"
                    }
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Passing Threshold Requirement: <span className="text-indigo-600 font-semibold">{quiz.passingPercentageRequired || quiz.passingPercentage || 0}%</span>
                  </p>
                </div>

                {!results && timeLeft !== null && (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                    timeLeft < 300 
                      ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-lg">{timeLeft < 300 ? "⏳" : "⏱️"}</span>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Time Left Matrix</span>
                      <span className="font-mono text-base font-bold leading-none mt-0.5">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                )}

                {!results && (
                  <button
                    onClick={() => {
                      if(window.confirm("Your progress and countdown timer are safely saved in the database. Exit portal view anyway?")) {
                        navigate(`/student/courses/${courseId}`);
                      }
                    }}
                    className="self-start md:self-center px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors shadow-sm"
                  >
                    ← Exit Quiz
                  </button>
                )}
              </div>

              {results && (
                <div className={`border rounded-2xl p-6 shadow-sm transition-all duration-500 ${
                  results.hasPassed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-rose-50/50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{results.hasPassed ? "🎉" : "📉"}</span>
                        <h2 className="text-lg font-bold">
                          {results.hasPassed ? "Assessment Examination Cleared!" : "Clearance Threshold Unfulfilled"}
                        </h2>
                      </div>
                      <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                        {results.hasPassed 
                          ? "Congratulations! You have validated the required tracking framework credentials successfully. Your completion credential certificate has been issued."
                          : "Your current evaluation drop matrix downscaled beneath passing baseline parameters. Please review your material resources and attempt the checkpoint node structure later."
                        }
                      </p>
                      
                      {results.hasPassed && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const verifiedToken = results.certificate?.certificateId || results.certificateId;
                              if (verifiedToken) {
                                navigate(`/verify/certificate/${verifiedToken}`);
                              } else {
                                alert("Certificate registration trace missing from response matrix.");
                              }
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <span>🎓 View Official Certificate Credential</span>
                            <span className="text-emerald-200">→</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 bg-white p-4 rounded-xl border border-slate-200 min-w-[140px] shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Your Score</span>
                      <span className={`text-3xl font-black mt-0.5 ${results.hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {results.percentage}%
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-1">
                        {results.score} / {results.totalQuestions} Correct
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {totalQuestionsList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <span className="text-3xl">📁</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-3">No Active Questions Found</h3>
                  <p className="text-xs text-slate-400 mt-1">This quiz track model contains no validated execution nodes yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleSubmitQuiz} className="space-y-4">
                    {currentQuestionsSlice.map((question, relativeIdx) => {
                      if (!question) return null;
                      
                      const absoluteIdx = indexOfFirstQuestion + relativeIdx;
                      const isAnswered = selectedAnswers[question._id] !== undefined;
                      
                      const isObjectFormat = typeof question.questionText === 'object' && question.questionText !== null;
                      const questionHeadingString = isObjectFormat ? question.questionText.text : question.questionText;
                      const questionAssociatedImage = isObjectFormat ? question.questionText.imageURL : null;
                      
                      const optionsList = Array.isArray(question.options) ? question.options : [];

                      return (
                        <div 
                          key={question._id || absoluteIdx}
                          className={`bg-white border rounded-2xl p-5 md:p-6 transition-all duration-300 shadow-sm ${
                            isAnswered ? 'border-indigo-200 ring-1 ring-indigo-50 bg-indigo-50/5' : 'border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                              isAnswered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {absoluteIdx + 1}
                            </span>
                            <div className="flex-grow space-y-4 w-full min-w-0">
                              <h3 className="text-base font-semibold text-slate-800 tracking-tight leading-relaxed break-words">
                                {typeof questionHeadingString === 'object' ? JSON.stringify(questionHeadingString) : questionHeadingString || "Evaluation Checkpoint Request Statement"}
                              </h3>
                              
                              {questionAssociatedImage && (
                                <div className="my-4 max-w-xl w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex justify-center items-center p-2 shadow-inner">
                                  <img 
                                    src={questionAssociatedImage} 
                                    alt={`Context asset for sequence ${absoluteIdx + 1}`} 
                                    className="max-h-[320px] w-auto max-w-full object-contain rounded-lg"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {optionsList.map((option, oIdx) => {
                                  const isSelected = selectedAnswers[question._id] === oIdx;
                                  
                                  let optionDisplayString = option;
                                  if (typeof option === 'object' && option !== null) {
                                    optionDisplayString = option.text || option.value || JSON.stringify(option);
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      disabled={!!results || timeLeft === 0 || submitting}
                                      onClick={() => handleOptionSelect(question._id, oIdx)}
                                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-3 group ${
                                        isSelected 
                                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:hover:bg-slate-50/50 disabled:hover:border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 truncate">
                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 transition-colors ${
                                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                          {String.fromCharCode(65 + oIdx)}
                                        </span>
                                        <span className="truncate">{optionDisplayString}</span>
                                      </div>
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected ? 'border-white bg-white' : 'border-slate-300 bg-white'
                                      }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                          &larr; Previous
                        </button>

                        <div className="hidden sm:flex items-center gap-1">
                          {[...Array(totalPagesCount)].map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors ${
                                currentPage === i + 1 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={currentPage === totalPagesCount}
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPagesCount))}
                          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                          Next &rarr;
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium hidden md:inline">
                          Page {currentPage} of {totalPagesCount}
                        </span>
                        {!results && (
                          <button
                            type="submit"
                            disabled={submitting || timeLeft === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-md shadow-indigo-100 rounded-xl transition-all disabled:opacity-50 tracking-tight"
                          >
                            {submitting ? <span>Processing Submissions...</span> : <span>Submit Exam Entry</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Quizzes;
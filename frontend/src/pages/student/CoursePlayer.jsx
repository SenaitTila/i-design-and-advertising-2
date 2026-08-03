// C:\creative-academy\src\pages\student\CoursePlayer.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import API from '../../api/authApi';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Primary Structural States
  const [course, setCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Tracking Progress Matrices
  const [isCompleted, setIsCompleted] = useState(false);
  const [certificateId, setCertificateId] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState([]);

  // Fetch initial configuration on mount/reload
  useEffect(() => {
    let isMounted = true;
    
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        setHasError(false);
        const { data } = await API.get(`/student/courses/${courseId}`);
        const responsePayload = data?.data || data;
        
        if (!responsePayload) {
          throw new Error("Empty payload matrix received from backend endpoint.");
        }

        if (isMounted) {
          setIsCompleted(!!responsePayload.isCompleted);
          setCertificateId(responsePayload.certificateId || null);
          
          const cleanCompletedVideos = responsePayload.completedVideos
            ? responsePayload.completedVideos.map(id => String(id))
            : [];
            
          setWatchedVideos(cleanCompletedVideos);
          setCourse(responsePayload);
          
          if (responsePayload.videos && responsePayload.videos.length > 0) {
            setActiveVideo(responsePayload.videos[0]);
          }
        }
      } catch (err) {
        console.error("Failed handling video course streaming context pipeline:", err);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourseDetails();
    
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Handle routing fallback if a 404 occurs to break render cascades
  useEffect(() => {
    if (hasError) {
      alert("Unauthorized access, missing entry matching or invalid course route context.");
      navigate('/student/my-courses', { replace: true });
    }
  }, [hasError, navigate]);

  // Dynamic Title Manager
  useEffect(() => {
    if (activeVideo?.title) {
      document.title = `${activeVideo.title} | I Design & Advertising`;
    } else if (course?.title) {
      document.title = `${course.title} | I Design & Advertising`;
    }
  }, [activeVideo, course]);

  // Memoized lists to optimize multi-render recalculations
  const videoList = useMemo(() => course?.videos || [], [course]);
  
  const currentVideoIdx = useMemo(() => {
    if (!activeVideo || videoList.length === 0) return -1;
    return videoList.findIndex(vid => String(vid._id) === String(activeVideo._id));
  }, [activeVideo, videoList]);

  const hasMultipleVideos = videoList.length > 1;
  const isAtFinalVideo = videoList.length > 0 && currentVideoIdx === videoList.length - 1;

  const allVideosWatched = useMemo(() => {
    if (videoList.length === 0) return false;
    return videoList.every(vid => watchedVideos.includes(String(vid._id)));
  }, [videoList, watchedVideos]);

  const handleVideoCompletionSync = useCallback(async (videoId) => {
    if (!videoId) return;
    const targetVideoStrId = String(videoId);

    setWatchedVideos((prev) => {
      if (!prev.includes(targetVideoStrId)) {
        return [...prev, targetVideoStrId];
      }
      return prev;
    });

    try {
      const { data } = await API.post('/student/progress/video-complete', {
        courseId,
        videoId: targetVideoStrId
      });

      const progressPayload = data?.data || data;
      if (progressPayload && progressPayload.completedVideos) {
        setWatchedVideos(progressPayload.completedVideos.map(id => String(id)));
        if (progressPayload.isCompleted !== undefined) {
          setIsCompleted(!!progressPayload.isCompleted);
        }
        if (progressPayload.certificateId !== undefined) {
          setCertificateId(progressPayload.certificateId || null);
        }
      }
    } catch (err) {
      console.warn("Background telemetry database synchronization deferred:", err);
    }
  }, [courseId]);

  const handleVideoEnded = useCallback(() => {
    if (activeVideo) {
      handleVideoCompletionSync(activeVideo._id);
    }
    if (currentVideoIdx !== -1 && currentVideoIdx < videoList.length - 1) {
      setActiveVideo(videoList[currentVideoIdx + 1]);
    }
  }, [activeVideo, currentVideoIdx, videoList, handleVideoCompletionSync]);

  const playNextVideo = useCallback(() => {
    if (currentVideoIdx !== -1 && currentVideoIdx < videoList.length - 1) {
      setActiveVideo(videoList[currentVideoIdx + 1]);
    }
  }, [currentVideoIdx, videoList]);

  const playPrevVideo = useCallback(() => {
    if (currentVideoIdx > 0) {
      setActiveVideo(videoList[currentVideoIdx - 1]);
    }
  }, [currentVideoIdx, videoList]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!hasMultipleVideos) return;
      if (e.key === 'ArrowRight') playNextVideo();
      if (e.key === 'ArrowLeft') playPrevVideo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultipleVideos, playNextVideo, playPrevVideo]);

  const handleQuizOrCertificateAction = () => {
    if (certificateId) {
      navigate(`/verify/certificate/${certificateId}`);
    } else {
      navigate(`/student/quizzes/course/${courseId}`);
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold tracking-wide text-gray-200">Synchronizing Course Profile...</p>
          <p className="text-xs text-gray-500 max-w-[250px]">Restoring lesson tracking registries.</p>
        </div>
      </div>
    );
  }

  const displayAssessmentButton = isCompleted || allVideosWatched || isAtFinalVideo;

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 selection:bg-indigo-500/30 pb-24 lg:pb-0">
      <Header />
      
      <div className="flex-grow flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto overflow-hidden">
        {/* LEFT GRID COLUMN */}
        <div className="flex-grow p-3 sm:p-4 lg:p-6 flex flex-col justify-start space-y-4 lg:w-2/3 overflow-y-auto">
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800/60 relative group">
            {activeVideo ? (
              <video 
                key={activeVideo._id} 
                src={activeVideo.videoUrl} 
                controls 
                autoPlay
                controlsList="nodownload" 
                onEnded={handleVideoEnded} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm italic">
                No active streaming media assets indexed.
              </div>
            )}
          </div>
          
          <div className="bg-gray-900/60 p-4 sm:p-5 rounded-xl border border-gray-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeVideo ? activeVideo.title : course.title}
              </h2>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Module Container: <span className="text-indigo-400">{course.title}</span>
              </p>
            </div>

            {hasMultipleVideos && (
              <div className="hidden lg:flex items-center space-x-2 shrink-0">
                <button
                  onClick={playPrevVideo}
                  disabled={currentVideoIdx === 0}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs font-semibold border border-gray-700 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                >
                  &larr; Previous
                </button>
                <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded-md border border-gray-800">
                  {currentVideoIdx + 1} / {videoList.length}
                </span>
                <button
                  onClick={playNextVideo}
                  disabled={isAtFinalVideo}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs font-semibold border border-gray-700 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT GRID COLUMN */}
        <div className="w-full lg:w-1/3 bg-gray-900/30 border-t lg:border-t-0 lg:border-l border-gray-800/80 flex flex-col lg:max-h-[calc(100vh-64px)]">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/20">
            <div className="space-y-0.5">
              <h3 className="font-bold text-white text-md">Course Syllabus</h3>
              <p className="text-xs text-gray-400 font-mono">
                {watchedVideos.length} of {videoList.length} Lessons Finished
              </p>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-1 max-h-[320px] lg:max-h-none">
            {videoList.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 text-center">No structural timeline contents found.</p>
            ) : (
              videoList.map((vid, idx) => {
                const isSelected = String(activeVideo?._id) === String(vid._id);
                const isWatched = watchedVideos.includes(String(vid._id));
                
                return (
                  <button 
                    key={vid._id}
                    onClick={() => setActiveVideo(vid)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs font-medium space-x-3 group ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 font-semibold' 
                        : 'hover:bg-gray-800/50 text-gray-300 bg-gray-900/40 border border-transparent hover:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className={`font-mono text-[11px] w-4 shrink-0 flex items-center justify-center ${
                        isSelected ? 'text-indigo-100' : isWatched ? 'text-emerald-400 font-bold' : 'text-gray-500 group-hover:text-gray-400'
                      }`}>
                        {isSelected ? '▶' : isWatched ? '✓' : idx + 1}
                      </span>
                      <span className={`truncate ${isWatched && !isSelected ? 'text-gray-400 line-through decoration-gray-700' : ''}`}>
                        {vid.title}
                      </span>
                    </div>
                    <span className={`font-mono shrink-0 px-2 py-0.5 rounded text-[10px] tracking-wide ${
                      isSelected ? 'bg-indigo-700 text-indigo-100' : isWatched ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/20' : 'bg-gray-950 text-gray-500'
                    }`}>
                      {vid.duration || '0:00'}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Desktop Evaluation Button */}
          <div className="hidden lg:block p-4 bg-gray-900/40 border-t border-gray-800 mt-auto">
            <button
              onClick={handleQuizOrCertificateAction}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-xl transition-all tracking-tight active:scale-[0.98]
                ${certificateId 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/10' 
                  : displayAssessmentButton
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/10' 
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
            >
              <span>{certificateId ? "🏆" : "📝"}</span>
              {certificateId ? "View Earned Certificate" : displayAssessmentButton ? "Take Course Quiz & Get Certified" : "Jump to Course Assessment Quiz"}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM CONTROL DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 p-3 flex flex-col gap-2 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] lg:hidden">
        {/* Mobile Assessment Trigger */}
        {(displayAssessmentButton || certificateId) && (
          <button
            onClick={handleQuizOrCertificateAction}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md
              ${certificateId ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/10' : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/10'}`}
          >
            <span>{certificateId ? "🏆" : "📝"}</span>
            {certificateId ? "View Certificate" : "Take Course Quiz"}
          </button>
        )}

        <div className="flex items-center justify-between w-full gap-3">
          <button
            onClick={playPrevVideo}
            disabled={currentVideoIdx === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-800 border border-gray-700 text-xs font-bold text-center text-gray-200 active:bg-gray-700 disabled:opacity-30 transition-all select-none touch-manipulation"
          >
            &larr; Prev
          </button>
          
          <div className="px-4 py-2 bg-gray-950 rounded-xl border border-gray-800 text-center shrink-0 min-w-[70px] select-none">
            <span className="text-xs font-mono font-bold text-gray-300 block">
              {currentVideoIdx + 1} / {videoList.length}
            </span>
          </div>

          <button
            onClick={isAtFinalVideo ? handleVideoEnded : playNextVideo}
            disabled={isAtFinalVideo && certificateId}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-xs font-bold text-center text-white active:bg-indigo-500 disabled:opacity-30 transition-all select-none touch-manipulation shadow-md shadow-indigo-600/10"
          >
            {isAtFinalVideo ? "Finish Unit ✓" : "Next &rarr;"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
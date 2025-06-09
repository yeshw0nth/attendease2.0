'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Users, Calendar, BarChart, Target, Trophy, Sparkles, Bell, Share2, Download, Settings, ChevronRight, Flame, Undo2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AttendanceStats {
  present: number;
  absent: number;
  targetPercentage: number;
  streak: number;
  history: Array<{
    date: string;
    status: 'present' | 'absent';
    note?: string;
  }>;
  notifications: boolean;
  reminders: Array<{
    time: string;
    enabled: boolean;
  }>;
  currentPercentage: number;
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} • ${formattedHours}:${formattedMinutes} ${ampm}`;
}

export default function Home() {
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    targetPercentage: 75,
    streak: 0,
    history: [],
    notifications: true,
    reminders: [
      { time: '09:00', enabled: true },
      { time: '14:00', enabled: false },
    ],
    currentPercentage: 0,
  });

  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'present' | 'absent' | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // Load saved stats from localStorage
    const savedStats = localStorage.getItem('attendanceStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Save stats to localStorage whenever they change
    localStorage.setItem('attendanceStats', JSON.stringify(stats));
  }, [stats]);

  const total = stats.present + stats.absent;
  const percentage = total > 0 ? (stats.present / total) * 100 : 0;

  const handlePresent = () => {
    const now = new Date();
    setStats(prev => ({
      ...prev,
      present: prev.present + 1,
      streak: prev.streak + 1,
      history: [
        {
          date: now.toISOString(),
          status: 'present',
        },
        ...prev.history,
      ],
    }));
    setLastAction('present');
    showActionFeedback('Marked as Present');
  };

  const handleAbsent = () => {
    const now = new Date();
    setStats(prev => ({
      ...prev,
      absent: prev.absent + 1,
      streak: 0,
      history: [
        {
          date: now.toISOString(),
          status: 'absent',
        },
        ...prev.history,
      ],
    }));
    setLastAction('absent');
    showActionFeedback('Marked as Absent');
  };

  const handleUndo = () => {
    if (lastAction === 'present' && stats.present > 0) {
      setStats(prev => ({
        ...prev,
        present: prev.present - 1,
        streak: Math.max(0, prev.streak - 1),
        history: prev.history.slice(1),
      }));
    } else if (lastAction === 'absent' && stats.absent > 0) {
      setStats(prev => ({
        ...prev,
        absent: prev.absent - 1,
        history: prev.history.slice(1),
      }));
    }
    showActionFeedback('Action undone');
    setLastAction(null);
  };

  const showActionFeedback = (message: string) => {
    setShowFeedback(message);
    setTimeout(() => setShowFeedback(null), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Attendance Stats',
          text: `I've maintained ${percentage.toFixed(1)}% attendance with a ${stats.streak} day streak!`,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowShareSheet(true);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AttendEase</h1>
            <p className="text-sm text-muted-foreground">Track attendance with ease</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowShareSheet(true)}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <div className="text-2xl font-bold mt-1">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Records tracked
            </p>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <div className="text-2xl font-bold text-green-500 mt-1">{stats.present}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Marked present
            </p>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <div className="text-2xl font-bold text-red-500 mt-1">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Marked absent
            </p>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-sm font-medium">Target</CardTitle>
            <div className="text-2xl font-bold text-blue-500 mt-1">{stats.targetPercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Target attendance
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Section - Mobile Optimized */}
      <Card className="mb-6">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Attendance Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Progress</span>
                <span className="font-medium">{stats.currentPercentage}%</span>
              </div>
              <Progress value={stats.currentPercentage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Target</span>
                <span className="font-medium">{stats.targetPercentage}%</span>
              </div>
              <Progress value={stats.targetPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <Button
          size="lg"
          className="h-14 text-base font-medium"
          onClick={handlePresent}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Present
        </Button>
        <Button
          size="lg"
          variant="destructive"
          className="h-14 text-base font-medium"
          onClick={handleAbsent}
        >
          <XCircle className="w-5 h-5 mr-2" />
          Absent
        </Button>
      </div>

      {/* Streak Card - Mobile Optimized */}
      <Card className="mb-6">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Current Streak</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.streak}</div>
                <p className="text-sm text-muted-foreground">Days</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={handleUndo}
              disabled={!lastAction}
            >
              <Undo2 className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Section - Mobile Optimized */}
      <Card className="mb-6">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent History
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="text-sm text-muted-foreground"
            >
              {isHistoryOpen ? 'Show Less' : 'Show More'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <motion.div
            initial={false}
            animate={{ height: isHistoryOpen ? 'auto' : '200px' }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {stats.history.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {record.status === 'present' ? (
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(new Date(record.date))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Share Sheet - Mobile Optimized */}
      <AnimatePresence>
        {showShareSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowShareSheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-background/80 backdrop-blur-lg rounded-t-2xl p-6 w-full max-w-md border-t border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1 w-12 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-6 text-center">Share Attendance</h3>
              <div className="grid grid-cols-3 gap-4">
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Share2 className="w-7 h-7 text-blue-500" />
                  </div>
                  <span className="text-sm">Copy Link</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Download className="w-7 h-7 text-green-500" />
                  </div>
                  <span className="text-sm">Export</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
                  <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Settings className="w-7 h-7 text-purple-500" />
                  </div>
                  <span className="text-sm">More</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Toast - Mobile Optimized */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-lg border border-border px-6 py-4 rounded-full shadow-lg flex items-center gap-3 z-50"
          >
            {showFeedback.includes('Present') ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : showFeedback.includes('Absent') ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
            <span className="text-sm font-medium">{showFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
} 
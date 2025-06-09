'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Moon, Sun, Settings, X, Download, Trash2, Target, Bell, Share2, Calendar, BarChart, Users, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export function SettingsDialog() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState([
    { time: '09:00', enabled: true },
    { time: '14:00', enabled: false },
  ]);

  useEffect(() => {
    setMounted(true);
    // Load settings from localStorage
    const savedTarget = localStorage.getItem('targetPercentage');
    const savedNotifications = localStorage.getItem('notifications');
    const savedReminders = localStorage.getItem('reminders');
    
    if (savedTarget) setTargetPercentage(parseInt(savedTarget, 10));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  const handleTargetChange = (value: number) => {
    setTargetPercentage(value);
    localStorage.setItem('targetPercentage', value.toString());
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem('notifications', JSON.stringify(enabled));
  };

  const handleReminderToggle = (index: number) => {
    const newReminders = [...reminders];
    newReminders[index].enabled = !newReminders[index].enabled;
    setReminders(newReminders);
    localStorage.setItem('reminders', JSON.stringify(newReminders));
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all attendance data? This cannot be undone.')) {
      localStorage.removeItem('attendanceStats');
      window.location.reload();
    }
  };

  if (!mounted) return null;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-lg"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Settings</CardTitle>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </Dialog.Close>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Appearance</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Target Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Attendance</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Target Percentage</span>
                    <span className="text-sm font-medium">{targetPercentage}%</span>
                  </div>
                  <Slider
                    value={[targetPercentage]}
                    onValueChange={([value]) => handleTargetChange(value)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable Notifications</span>
                    <Switch
                      checked={notifications}
                      onCheckedChange={handleNotificationToggle}
                    />
                  </div>
                  {notifications && (
                    <div className="space-y-2">
                      {reminders.map((reminder, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{reminder.time}</span>
                          <Switch
                            checked={reminder.enabled}
                            onCheckedChange={() => handleReminderToggle(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Management Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Data Management</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between"
                    onClick={() => {
                      // Export data logic
                      const data = localStorage.getItem('attendanceStats');
                      const blob = new Blob([data || ''], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'attendance-data.json';
                      a.click();
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export Data
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full flex items-center justify-between"
                    onClick={handleReset}
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Reset All Data
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">About</h3>
                <div className="text-sm text-muted-foreground">
                  <p>AttendEASE v1.0.0</p>
                  <p className="mt-1">A modern attendance tracking solution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 
export const childProfile = {
  name: "Omar",
  age: 7,
  focusMode: "Active",
  status: "Online",
};

export const kpis = {
  todayFocusMinutes: 42,
  weeklyProgressPct: 78,
  // NOTE: no overall quiz accuracy (removed by request)
};

export const weeklyMinutes = [
  { day: "Mon", minutes: 18 },
  { day: "Tue", minutes: 25 },
  { day: "Wed", minutes: 21 },
  { day: "Thu", minutes: 30 },
  { day: "Fri", minutes: 27 },
  { day: "Sat", minutes: 33 },
  { day: "Sun", minutes: 40 },
];

export const masteryBySubject = [
  { subject: "Math", mastery: 62, colorKey: "green" },
  { subject: "Astronomy", mastery: 74, colorKey: "purple" },
  { subject: "Reading", mastery: 58, colorKey: "orange" },
  { subject: "Logic", mastery: 66, colorKey: "green" },
];

export const weakAreas = [
  { subject: "Math • Fractions", note: "Lower mastery in fraction comparisons.", severity: "Needs support" },
  { subject: "Math • Word Problems", note: "More time needed to interpret questions.", severity: "Needs support" },
  { subject: "Astronomy • Constellations", note: "Confuses similar star patterns.", severity: "Practice more" },
];

export const recentSessions = [
  { id: 1, game: "Astronomy Game", duration: 14, time: "Today 5:10 PM", outcome: "Completed 3 missions" },
  { id: 2, game: "Math Game", duration: 18, time: "Today 4:30 PM", outcome: "Practiced multiplication" },
  { id: 3, game: "AI Chat", duration: 6, time: "Yesterday 8:02 PM", outcome: "Asked for hints" },
];

export const defaultLimits = {
  dailyMinutesLimit: 60,
  sessionMinutesLimit: 25,
  breakMinutes: 7,
  bedtimeHour: 20, // 8 PM
  bedtimeMinute: 30,
  blockAfterBedtime: true,
};

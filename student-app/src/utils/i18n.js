const resources = {
  en: {
    hello: 'Hello',
    currentStage: 'Current Stage',
    stageOf: 'Stage {{current}} of {{total}}',
    nextDeadline: 'Next Deadline',
    recentUpdates: 'Recent Updates',
    seeAll: 'See all',
    payments: 'Payments',
    myProgress: 'My Progress',
    myPayments: 'My Payments',
    myDeadlines: 'My Deadlines',
    notifications: 'Notifications',
    home: 'Home',
    serviceFee: 'Service Fee',
    totalPaid: 'Total Paid',
    remaining: 'Remaining',
    noDeadlines: 'No upcoming deadlines — your DC agent will add them here',
    noNotifications: 'No notifications yet',
    noPayments: 'No payments recorded yet',
    daysLeft: '{{n}} days left',
    dayLeft: '1 day left',
    today: 'TODAY',
    tomorrow: 'tomorrow',
    overdue: 'OVERDUE',
    logout: 'Log out',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Log in to track your application',
    phone: 'Phone number',
    password: 'Password',
    login: 'Log In',
    wrongCredentials: 'Incorrect phone number or password',
    somethingWrong: 'Something went wrong, please try again',
    completed: 'Completed',
    current: 'Current',
    upcoming: 'Upcoming',
    past: 'Past',
    markAllRead: 'Mark all as read',
    unread: 'unread',
    in: 'in',
  },
};

let currentLocale = 'en';

export const setLocale = (locale) => { currentLocale = locale; };
export const getLocale = () => currentLocale;

export const t = (key, params = {}) => {
  let str = resources[currentLocale]?.[key] ?? resources.en[key] ?? key;
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  });
  return str;
};

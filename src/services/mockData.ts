import { Task, User, ActivityLog, WeatherData, Issue, Notification } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'emp1',
    name: 'Silas Green',
    username: 'silas',
    password: 'employee123',
    role: 'employee',
    department: 'birds',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp2',
    name: 'John Carver',
    username: 'john',
    password: 'employee123',
    role: 'employee',
    department: 'fish',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp3',
    name: 'Clara Fields',
    username: 'clara',
    password: 'employee123',
    role: 'employee',
    department: 'calves',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mgr1',
    name: 'Marcus Brody',
    username: 'marcus',
    email: 'marcus@farmflow.com',
    password: 'manager123',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_TASKS: Task[] = [
  // Birds tasks
  {
    id: 'b1',
    title: 'Morning Poultry Feeding',
    category: 'birds',
    subcategory: 'Feed',
    status: 'completed',
    assignedTo: 'Silas Green',
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    completedBy: 'Silas Green',
    priority: 'high',
    notes: 'Coops 1-4 fed. Feed consumption normal.',
    details: { feedPounds: 120 }
  },
  {
    id: 'b2',
    title: 'Water Line Check & Refill',
    category: 'birds',
    subcategory: 'Water',
    status: 'pending',
    assignedTo: 'Silas Green',
    priority: 'high',
  },
  {
    id: 'b3',
    title: 'Coop 3 Sanitization',
    category: 'birds',
    subcategory: 'Cleaning',
    status: 'pending',
    assignedTo: 'Silas Green',
    priority: 'medium',
  },
  {
    id: 'b4',
    title: 'Avian Flu Vaccination Batch A',
    category: 'birds',
    subcategory: 'Vaccination',
    status: 'pending',
    assignedTo: 'Silas Green',
    priority: 'high',
  },
  {
    id: 'b5',
    title: 'Egg Collection & Grading',
    category: 'birds',
    subcategory: 'Egg Collection',
    status: 'completed',
    assignedTo: 'Silas Green',
    completedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    completedBy: 'Silas Green',
    priority: 'medium',
    details: { eggsCount: 342, cracked: 3 }
  },

  // Fish tasks
  {
    id: 'f1',
    title: 'Pond A-D Feeding & Temperature',
    category: 'fish',
    subcategory: 'Feeding',
    status: 'completed',
    assignedTo: 'John Carver',
    completedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    completedBy: 'John Carver',
    priority: 'high',
    details: { feedType: 'Floating Pellets', amountKg: 45 }
  },
  {
    id: 'f2',
    title: 'Water pH & Ammonia Testing',
    category: 'fish',
    subcategory: 'Water Quality',
    status: 'pending',
    assignedTo: 'John Carver',
    priority: 'high',
  },
  {
    id: 'f3',
    title: 'Dissolved Oxygen Level Verification',
    category: 'fish',
    subcategory: 'Oxygen',
    status: 'pending',
    assignedTo: 'John Carver',
    priority: 'high',
  },
  {
    id: 'p1',
    title: 'Pond Water Level Inspection',
    category: 'pond',
    subcategory: 'Water Level',
    status: 'pending',
    assignedTo: 'John Carver',
    priority: 'medium',
  },
  {
    id: 'p2',
    title: 'Pond Algae Clearance & Filter Check',
    category: 'pond',
    subcategory: 'Maintenance',
    status: 'pending',
    assignedTo: 'John Carver',
    priority: 'high',
  },

  // Calves tasks
  {
    id: 'c1',
    title: 'Morning Calf Milk Replacer Feeding',
    category: 'calves',
    subcategory: 'Milk',
    status: 'completed',
    assignedTo: 'Clara Fields',
    completedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    completedBy: 'Clara Fields',
    priority: 'high',
    details: { milkVolumeLiters: 48 }
  },
  {
    id: 'c2',
    title: 'Weighing Session Batch B',
    category: 'calves',
    subcategory: 'Weight',
    status: 'pending',
    assignedTo: 'Clara Fields',
    priority: 'medium',
  },
  {
    id: 'c3',
    title: 'Calf Pen 2 Straw Bedding Refresh',
    category: 'calves',
    subcategory: 'Cleaning',
    status: 'pending',
    assignedTo: 'Clara Fields',
    priority: 'low',
  },

  // Cow Shed tasks
  {
    id: 'cs1',
    title: 'Cow Shed A Milking & Cleaning',
    category: 'cow_shed',
    subcategory: 'Cleaning',
    status: 'completed',
    assignedTo: 'Clara Fields',
    completedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedBy: 'Clara Fields',
    priority: 'high',
  },
  {
    id: 'cs2',
    title: 'Cow Feeding & Water Trough Refill',
    category: 'cow_shed',
    subcategory: 'Feed',
    status: 'pending',
    assignedTo: 'Clara Fields',
    priority: 'high',
  },

  // Vehicles tasks
  {
    id: 'v1',
    title: 'John Deere Tractor Refueling',
    category: 'vehicles',
    subcategory: 'Fuel',
    status: 'pending',
    assignedTo: 'John Carver',
    priority: 'medium',
  },
  {
    id: 'v2',
    title: 'Delivery Truck Pre-trip Inspection',
    category: 'vehicles',
    subcategory: 'Status',
    status: 'completed',
    assignedTo: 'John Carver',
    completedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    completedBy: 'John Carver',
    priority: 'high',
    details: { oilLevel: 'Good', tires: 'Inspect OK' }
  },

  // Maintenance tasks
  {
    id: 'm1',
    title: 'Daily Generator Health Check',
    category: 'maintenance',
    subcategory: 'Daily',
    status: 'pending',
    assignedTo: 'Silas Green',
    priority: 'high',
  },
  {
    id: 'm2',
    title: 'Weekly Water Filtration Backwash',
    category: 'maintenance',
    subcategory: 'Weekly',
    status: 'pending',
    assignedTo: 'John Carver',
    priority: 'medium',
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act1',
    userId: 'emp3',
    userName: 'Clara Fields',
    action: 'Completed Cow Shed A Milking & Cleaning',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    category: 'cow_shed'
  },
  {
    id: 'act2',
    userId: 'emp3',
    userName: 'Clara Fields',
    action: 'Completed Morning Calf Milk Replacer Feeding',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    category: 'calves'
  },
  {
    id: 'act3',
    userId: 'emp2',
    userName: 'John Carver',
    action: 'Fed fish in pond A-D',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    category: 'fish'
  },
  {
    id: 'act4',
    userId: 'emp1',
    userName: 'Silas Green',
    action: 'Completed Morning Poultry Feeding',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    category: 'birds'
  },
  {
    id: 'act5',
    userId: 'emp1',
    userName: 'Silas Green',
    action: 'Completed Egg Collection & Grading',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'birds'
  }
];

export const WEATHER_MOCK: WeatherData = {
  temp: 24,
  condition: 'Partly Cloudy',
  humidity: 65,
  windSpeed: 12
};

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'iss1',
    taskId: 'b2',
    taskTitle: 'Water Line Check & Refill',
    category: 'birds',
    reportedBy: 'Silas Green',
    reportedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    priority: 'high',
    type: 'equipment',
    description: 'The automated water dispenser in Coop 2 has a cracked fitting and is slowly leaking water onto the floor bedding. Needs replacement connector.',
    status: 'pending',
    imageUri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'iss2',
    taskId: 'cs2',
    taskTitle: 'Cow Feeding & Water Trough Refill',
    category: 'cow_shed',
    reportedBy: 'Clara Fields',
    reportedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    priority: 'medium',
    type: 'supply',
    description: 'Feed silage stock in shed B is running low. We only have about 2 bags left, which will last till tomorrow morning. Ordering new batch is urgent.',
    status: 'resolved',
    imageUri: 'https://images.unsplash.com/photo-1500937386664-56d159062215?w=500&auto=format&fit=crop&q=80',
    resolutionNotes: 'Manager ordered 10 units of feed, arriving this afternoon.'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'not1',
    title: 'New Issue Reported ⚠️',
    message: 'Silas Green reported: Coop 2 water line dispenser is leaking.',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    category: 'birds',
    read: false,
    type: 'issue_reported'
  },
  {
    id: 'not2',
    title: 'Task Rescheduled 📅',
    message: 'Milking & Cleaning reassigned to Clara Fields.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    category: 'cow_shed',
    read: true,
    type: 'task_rescheduled'
  }
];

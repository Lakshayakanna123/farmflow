import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, User, ActivityLog, FarmSummary, TaskCategory, Issue, Notification } from '../types';
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_ACTIVITIES, INITIAL_ISSUES, INITIAL_NOTIFICATIONS } from './mockData';

const KEYS = {
  USER: 'fws_user',
  TASKS: 'fws_tasks',
  ACTIVITIES: 'fws_activities',
  ISSUES: 'fws_issues',
  NOTIFICATIONS: 'fws_notifications'
};

export const StorageService = {
  // --- USER AUTH / SESSION ---
  async login(username: string): Promise<User | null> {
    const user = INITIAL_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );
    if (user) {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem(KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  // --- TASKS ---
  async getTasks(): Promise<Task[]> {
    const tasksStr = await AsyncStorage.getItem(KEYS.TASKS);
    if (!tasksStr) {
      // Seed initial tasks
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(tasksStr);
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },

  async toggleTask(taskId: string, userName: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex > -1) {
      const task = tasks[taskIndex];
      const isCompleting = task.status === 'pending';
      
      task.status = isCompleting ? 'completed' : 'pending';
      task.completedAt = isCompleting ? new Date().toISOString() : undefined;
      task.completedBy = isCompleting ? userName : undefined;

      await this.saveTasks(tasks);

      // Log activity
      const actionText = isCompleting 
        ? `Completed "${task.title}"` 
        : `Reopened "${task.title}"`;
      await this.logActivity(userName, actionText, task.category);
    }
    return this.getTasks();
  },

  async updateTaskDetails(taskId: string, details: Record<string, any>, notes?: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex > -1) {
      tasks[taskIndex].details = { ...tasks[taskIndex].details, ...details };
      if (notes !== undefined) {
        tasks[taskIndex].notes = notes;
      }
      await this.saveTasks(tasks);
    }
    return this.getTasks();
  },

  // --- ACTIVITIES ---
  async getActivities(): Promise<ActivityLog[]> {
    const actStr = await AsyncStorage.getItem(KEYS.ACTIVITIES);
    if (!actStr) {
      await AsyncStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
      return INITIAL_ACTIVITIES;
    }
    return JSON.parse(actStr);
  },

  async logActivity(userName: string, action: string, category: TaskCategory): Promise<ActivityLog> {
    const activities = await this.getActivities();
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      userId: userName.toLowerCase().replace(/\s+/g, '_'),
      userName,
      action,
      timestamp: new Date().toISOString(),
      category
    };
    
    // Add to top and limit to 50 logs
    const updated = [newLog, ...activities].slice(0, 50);
    await AsyncStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(updated));
    return newLog;
  },

  // --- ANALYTICS ---
  async getSummary(): Promise<FarmSummary> {
    const tasks = await this.getTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const categories: TaskCategory[] = ['birds', 'fish', 'calves', 'cow_shed', 'vehicles', 'maintenance'];
    const byCategory = {} as Record<TaskCategory, { total: number; completed: number }>;

    categories.forEach((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      byCategory[cat] = {
        total: catTasks.length,
        completed: catTasks.filter((t) => t.status === 'completed').length
      };
    });

    return {
      totalTasks,
      completedTasks,
      completionRate,
      byCategory
    };
  },

  // --- ISSUES ---
  async getIssues(): Promise<Issue[]> {
    const issuesStr = await AsyncStorage.getItem(KEYS.ISSUES);
    if (!issuesStr) {
      await AsyncStorage.setItem(KEYS.ISSUES, JSON.stringify(INITIAL_ISSUES));
      return INITIAL_ISSUES;
    }
    return JSON.parse(issuesStr);
  },

  async saveIssues(issues: Issue[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.ISSUES, JSON.stringify(issues));
  },

  async reportIssue(issueDetails: Omit<Issue, 'id' | 'reportedAt' | 'status'>, imageUri?: string): Promise<Issue> {
    const issues = await this.getIssues();
    const newIssue: Issue = {
      ...issueDetails,
      id: `iss_${Date.now()}`,
      reportedAt: new Date().toISOString(),
      status: 'pending',
      imageUri
    };

    const updated = [newIssue, ...issues];
    await this.saveIssues(updated);

    // Create a notification for managers
    const notificationMessage = `${newIssue.reportedBy} reported a ${newIssue.priority} priority ${newIssue.type.replace('_', ' ')} issue in ${newIssue.category.replace('_', ' ')}${newIssue.taskTitle ? ` (Task: ${newIssue.taskTitle})` : ''}.`;
    await this.createNotification(
      'New Issue Reported ⚠️',
      notificationMessage,
      newIssue.category,
      'issue_reported'
    );

    // Log activity
    await this.logActivity(newIssue.reportedBy, `Reported issue: ${newIssue.description.substring(0, 30)}...`, newIssue.category);

    return newIssue;
  },

  async resolveIssue(issueId: string, resolutionNotes?: string): Promise<Issue[]> {
    const issues = await this.getIssues();
    const index = issues.findIndex(i => i.id === issueId);
    if (index > -1) {
      issues[index].status = 'resolved';
      issues[index].resolutionNotes = resolutionNotes;
      await this.saveIssues(issues);

      // Log activity
      const user = await this.getCurrentUser();
      const userName = user ? user.name : 'Manager';
      await this.logActivity(userName, `Resolved issue: ${issues[index].description.substring(0, 30)}...`, issues[index].category);
    }
    return this.getIssues();
  },

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<Notification[]> {
    const notificationsStr = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
    if (!notificationsStr) {
      await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(notificationsStr);
  },

  async saveNotifications(notifications: Notification[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  async createNotification(title: string, message: string, category: TaskCategory, type: Notification['type']): Promise<Notification> {
    const notifications = await this.getNotifications();
    const newNotification: Notification = {
      id: `not_${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      category,
      read: false,
      type
    };

    const updated = [newNotification, ...notifications].slice(0, 50); // limit to 50
    await this.saveNotifications(updated);
    return newNotification;
  },

  async markNotificationRead(notificationId: string): Promise<Notification[]> {
    const notifications = await this.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      notifications[index].read = true;
      await this.saveNotifications(notifications);
    }
    return this.getNotifications();
  },

  async markAllNotificationsRead(): Promise<Notification[]> {
    const notifications = await this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    await this.saveNotifications(updated);
    return updated;
  },

  // --- RESCHEDULING ---
  async rescheduleTask(
    taskId: string, 
    newDueDate: string, 
    newAssignee: string, 
    newPriority: 'low' | 'medium' | 'high', 
    reason: string
  ): Promise<Task[]> {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      const task = tasks[taskIndex];
      
      // Update task fields
      task.originalDueDate = task.originalDueDate || task.dueDate || new Date().toISOString();
      task.dueDate = newDueDate;
      task.assignedTo = newAssignee;
      task.priority = newPriority;
      task.rescheduledReason = reason;
      task.rescheduledAt = new Date().toISOString();
      
      await this.saveTasks(tasks);

      // Create manager/worker notifications
      const notificationMsg = `Task "${task.title}" has been rescheduled to ${new Date(newDueDate).toLocaleDateString()} and assigned to ${newAssignee}. Reason: ${reason}`;
      await this.createNotification(
        'Task Rescheduled 📅',
        notificationMsg,
        task.category,
        'task_rescheduled'
      );

      // Log activity
      const user = await this.getCurrentUser();
      const userName = user ? user.name : 'Manager';
      await this.logActivity(
        userName, 
        `Rescheduled "${task.title}" (assigned to ${newAssignee})`, 
        task.category
      );
    }
    return this.getTasks();
  },

  // --- SEED RESET ---
  async resetAllData(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TASKS);
    await AsyncStorage.removeItem(KEYS.ACTIVITIES);
    await AsyncStorage.removeItem(KEYS.ISSUES);
    await AsyncStorage.removeItem(KEYS.NOTIFICATIONS);
  }
};

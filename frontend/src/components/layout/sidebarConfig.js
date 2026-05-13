/**
 * Sidebar Configuration
 * Centralized sidebar menu items for each role
 */

import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Shield,
  Cpu,
  ClipboardList,
  Zap,
  Scroll,
  AlertCircle,
  TrendingUp,
  Search,
  Activity,
  Database,
} from 'lucide-react';

export const adminSidebarItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Infrastructure',
    href: '/admin/infrastructure',
    icon: Cpu,
  },
  {
    label: 'Security Center',
    href: '/admin/security-center',
    icon: Shield,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    label: 'Datasets',
    href: '/admin/datasets',
    icon: Database,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ClipboardList,
  },
  {
    label: 'AI Controls',
    href: '/admin/ai-controls',
    icon: Zap,
  },
];

export const userSidebarItems = [
  {
    label: 'Dashboard',
    href: '/user/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Live Monitoring',
    href: '/user/live-monitoring',
    icon: Activity,
  },
  {
    label: 'Logs',
    href: '/user/logs',
    icon: Scroll,
  },
  {
    label: 'Datasets',
    href: '/user/datasets',
    icon: Database,
  },
  {
    label: 'Alerts',
    href: '/user/alerts',
    icon: AlertCircle,
  },
  {
    label: 'Anomalies',
    href: '/user/anomalies',
    icon: TrendingUp,
  },
  {
    label: 'Investigations',
    href: '/user/investigations',
    icon: Search,
  },
  {
    label: 'AI Insights',
    href: '/user/ai-insights',
    icon: Zap,
  },
];

export const viewerSidebarItems = [
  {
    label: 'Dashboard',
    href: '/viewer/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Live Monitoring',
    href: '/viewer/live-monitoring',
    icon: Activity,
  },
  {
    label: 'Logs View',
    href: '/viewer/logs',
    icon: Scroll,
  },
  {
    label: 'Datasets',
    href: '/viewer/datasets',
    icon: Database,
  },
  {
    label: 'Alerts View',
    href: '/viewer/alerts',
    icon: AlertCircle,
  },
];

export default {
  adminSidebarItems,
  userSidebarItems,
  viewerSidebarItems,
};

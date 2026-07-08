export type IconType =
  | 'grid' | 'document' | 'people' | 'house' | 'diamond'
  | 'list' | 'globe' | 'shield' | 'danger' | 'box'
  | 'chart-bar' | 'lock' | 'link' | 'clock' | 'key'
  | 'line3' | 'graph' | 'arrow' | 'settings' | 'mga';

export interface IconAttrs {
  viewBox: string;
  paths: string;
  strokeWidth: string;
}

export const ICONS: Record<IconType, IconAttrs> = {
  grid: {
    viewBox: '0 0 24 24',
    paths: '<rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />',
    strokeWidth: '1.8',
  },
  document: {
    viewBox: '0 0 24 24',
    paths: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />',
    strokeWidth: '2',
  },
  people: {
    viewBox: '0 0 24 24',
    paths: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    strokeWidth: '2',
  },
  house: {
    viewBox: '0 0 24 24',
    paths: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />',
    strokeWidth: '2',
  },
  diamond: {
    viewBox: '0 0 24 24',
    paths: '<polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />',
    strokeWidth: '2',
  },
  list: {
    viewBox: '0 0 24 24',
    paths: '<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />',
    strokeWidth: '2',
  },
  globe: {
    viewBox: '0 0 24 24',
    paths: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
    strokeWidth: '2',
  },
  shield: {
    viewBox: '0 0 24 24',
    paths: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />',
    strokeWidth: '2',
  },
  danger: {
    viewBox: '0 0 24 24',
    paths: '<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />',
    strokeWidth: '2',
  },
  box: {
    viewBox: '0 0 24 24',
    paths: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />',
    strokeWidth: '2',
  },
  'chart-bar': {
    viewBox: '0 0 24 24',
    paths: '<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />',
    strokeWidth: '2',
  },
  lock: {
    viewBox: '0 0 24 24',
    paths: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    strokeWidth: '2',
  },
  link: {
    viewBox: '0 0 24 24',
    paths: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    strokeWidth: '2',
  },
  clock: {
    viewBox: '0 0 24 24',
    paths: '<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />',
    strokeWidth: '2',
  },
  key: {
    viewBox: '0 0 24 24',
    paths: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />',
    strokeWidth: '2',
  },
  line3: {
    viewBox: '0 0 24 24',
    paths: '<line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />',
    strokeWidth: '2',
  },
  graph: {
    viewBox: '0 0 24 24',
    paths: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />',
    strokeWidth: '2',
  },
  arrow: {
    viewBox: '0 0 24 24',
    paths: '<line x1="12" y1="3" x2="12" y2="21" /><path d="M12 8l-7 4v3l7-4" /><path d="M12 8l7 4v3l-7-4" /><path d="M3 21h18" />',
    strokeWidth: '2',
  },
  settings: {
    viewBox: '0 0 24 24',
    paths: '<circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />',
    strokeWidth: '1.8',
  },
  mga: {
    viewBox: '0 0 24 24',
    paths: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />',
    strokeWidth: '1.8',
  },
};

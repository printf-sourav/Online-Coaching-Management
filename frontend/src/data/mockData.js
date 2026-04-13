// UI-only utility maps — kept on client; all data objects moved to src/api/index.js

export const subjectColors = {
  Mathematics: 'var(--grad-primary)',
  Physics: 'var(--grad-accent)',
  Chemistry: 'var(--grad-rose)',
  English: 'var(--grad-amber)',
  Biology: 'var(--grad-sky)',
};

export const statusConfig = {
  excellent:  { label: 'Excellent',   cls: 'bd-success' },
  good:       { label: 'Good',        cls: 'bd-accent' },
  average:    { label: 'Average',     cls: 'bd-amber' },
  needsHelp:  { label: 'Needs Help',  cls: 'bd-rose' },
  submitted:  { label: 'Submitted',   cls: 'bd-success' },
  pending:    { label: 'Pending',     cls: 'bd-amber' },
  missing:    { label: 'Missing',     cls: 'bd-rose' },
  graded:     { label: 'Graded',      cls: 'bd-accent' },
  late:       { label: 'Late',        cls: 'bd-rose' },
  live:       { label: 'Live Now',    cls: 'bd-rose' },
  upcoming:   { label: 'Upcoming',    cls: 'bd-primary' },
  scheduled:  { label: 'Scheduled',   cls: 'bd-primary' },
  completed:  { label: 'Completed',   cls: 'bd-success' },
  cancelled:  { label: 'Cancelled',   cls: 'bd-muted' },
  active:     { label: 'Active',      cls: 'bd-accent' },
  paid:       { label: 'Paid',        cls: 'bd-success' },
  due:        { label: 'Due',         cls: 'bd-amber' },
};

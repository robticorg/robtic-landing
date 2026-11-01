// The built-in features: [image, title, text] — one picture each; the text shows on hover. Screenshots vs.
// illustrations differ in alt. The admin console can replace the whole list (Landing -> Features).
export const SHOTS = ['workspaces', 'add', 'console', 'editor', 'teams', 'resources'];
export const BUILTIN_FEATURES: Array<[string, string, string]> = [
    ['workspaces', 'Workspaces', 'Apps, databases, backups, SFTP, schedules and alerts on one canvas, joined to what they belong to.'],
    ['add', 'Add anything', 'Upload your files, start from a ready Discord bot, or clone a repository from GitHub.'],
    ['console', 'Live console', 'Start, stop and restart, type commands and read the logs as they happen.'],
    ['editor', 'Code editor', 'Edit and save your code in the browser, upload whole folders, or use SFTP.'],
    ['teams', 'Teams', 'Owners, admins, managers and members, each with the workspaces they need.'],
    ['resources', 'Shared resources', 'Each workspace gets its share of memory, CPU and storage; its apps share it.'],
    ['databases', 'MongoDB and Redis', "A database or a cache in one click, its connection already in your apps' environment."],
    ['backups', 'Backups and schedules', 'Copies to restore or download, made by hand or on a schedule.'],
    ['alerts', 'Alerts on Discord', 'Crashes, restarts and backups, told in your own channel.'],
    ['github', 'GitHub', 'Clone, deploy again in one click, or put an app on GitHub for you.'],
    ['domains', 'Your own domain', 'A web address for every app, or your own domain with HTTPS.'],
    ['secrets', 'Encrypted secrets', 'Environment variables encrypted; an uploaded .env is moved into them.'],
];

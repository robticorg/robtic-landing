This page explains how Robtic handles what you host: your apps, their files and the data around them. Your account itself is covered in [Account Privacy](/privacy/account).

## What we store for you

- Your apps' files and logs, and the backups you make.
- Databases and cache you add (MongoDB and Redis).
- Environment variables, kept encrypted; a `.env` file you upload is moved into them.
- Settings you give us: alert webhooks, schedules, custom domains, GitHub repositories you connect.

## Who can see it

- You, and the people you invite or give access to in your workspace or team, with the permissions you choose.
- Robtic's administrators, only when needed to run the service, fix a problem you ask about, or deal with abuse.
- Nobody else, unless the law requires it.

## Where it goes

- The servers Robtic runs on, where your apps, files, backups and databases are stored.
- Cloudflare, which carries traffic to the site, to apps' web addresses and to custom domains.
- GitHub, when you clone, deploy or push a repository.
- Discord, when an alert is sent to your webhook.

## How long we keep it

- Your apps and their files, for as long as the app exists. When a plan ends they are kept for a while; long after, they may be removed after an email to you.
- Backups until you delete them, turn backups off for the app, or delete the app.
- Databases until you remove them or their workspace.

## Security

Apps run separated from each other, secrets and tokens are encrypted, connections use HTTPS, and SFTP signs in with your account. No system is perfectly secure; tell us if you find a problem.

## Your choices

- Download your files and backups at any time from the panel.
- Delete an app, a backup or a database whenever you want; it is gone for good.
- Ask us to remove everything you host together with your account.

> **Draft.** This page is a first version for review and may change.

This page explains what **Scam Guard** keeps about the servers it is in and their members, why, and what you can do about it. Using the bot follows the [Scam Guard Terms](/terms/scam-guard); your Robtic account itself is covered in [Account Privacy](/privacy/account).

## What we collect

- **Server settings** chosen by administrators: whether the bot is on, how many channels and seconds count as a raid, which kinds of image are watched, the actions, the alert channel and roles to ping, and the ignored channels and trusted roles.
- **Recent posts, in memory only:** for each image posted, a fingerprint of it (the file's name and size, or its link), who posted it, where and when. This is never written to disk and is forgotten within 10 minutes.
- **Stopped raids:** for each raid the bot stopped, the member's id and username, the channels, how many messages were deleted, whether the timeout worked, the kind of image and the time.
- **Ids:** Discord user, server, channel and role ids, needed to link all of the above.

The bot does not keep the text of messages or the images themselves.

## Why we use it

- To spot a raid as it happens and act on it the way the server set up.
- To show administrators the raids stopped in their server, in the dashboard.

## Who can see it

- The server's administrators see the stopped raids in the dashboard. Anyone who can read the alert channel sees the alerts posted there.
- Robtic's administrators, only when needed to run the bot, fix a problem you ask about, or deal with abuse.

## How long we keep it

- Recent posts: under 10 minutes, in memory.
- Stopped raids: 30 days, then deleted.
- When the bot is removed, the server's settings are kept for 30 days in case it is added back, then deleted.

## Your choices

- Administrators can turn the bot off, ignore channels and trust roles, which stops collecting for them.
- Members can ask the server's administrators, or us, for a copy of what is kept about them, or to remove it from a server.

## Changes

If this page changes in an important way, we will tell server administrators in the dashboard before it applies.

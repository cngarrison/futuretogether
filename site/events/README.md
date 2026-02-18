# Event System Configuration

This directory contains YAML configuration files for events. Each file defines a
separate event instance.

## File Format

Event configuration files should be named with the pattern: `{slug}-{date}.yaml`

Example: `discuss-our-future-2025-01-21.yaml`

## Configuration Structure

```yaml
---
id: discuss-our-future-2025-01-21 # Unique ID (slug + date)
slug: discuss-our-future # URL slug (multiple dates share same slug)
title: "Event Title" # Display title
description: |
  Multi-line description of the event.
  Supports multiple paragraphs.
date: 2025-01-20T23:00:00Z # UTC time (use https://www.timeanddate.com/worldclock/converter.html)
timezone: Australia/Sydney # For display formatting (shows local time to users)
duration: 45 # Duration in minutes
capacity: 30 # Maximum attendees
registrationDeadline: 1 # Hours before event to close registration
meetingLink: https://meet.google.com/xxx # Google Meet URL
posterImage: /static/events/slug/poster.png # Event poster image path
isActive: true # Enable/disable registration
presentedBy: Charlie Garrison # Optional: Person presenting
sponsoredBy: Beyond Better # Optional: Organization hosting
topics: # Optional list of discussion topics
  - "Topic 1"
  - "Topic 2"
```

## Creating a New Event

1. Create a new YAML file in this directory
2. Follow the naming convention: `{slug}-{YYYY-MM-DD}.yaml`
3. Configure all required fields
4. Add poster image to `/static/events/{slug}/poster.png`
5. Restart the server to load the new event

## Multiple Date Instances

To create recurring events:

- Use the same `slug` value
- Different `id` values (include date)
- Separate YAML files for each date

The public page `/events/{slug}` will automatically show the next available
event based on:

- `isActive: true`
- Registration deadline not passed
- Capacity not reached

## Event Lifecycle

1. **Active & Open**: Event is in the future, has capacity, before deadline
2. **Full**: Registration count >= capacity (switches to next event)
3. **Deadline Passed**: Within registration deadline hours (switches to next
   event)
4. **Past**: Event date has passed (shown in admin as past event)

## Admin Access

- View all events: `/staff/events`
- View registrations: `/staff/events/{slug}`
- Download CSV: Click "Download CSV" on registration page

## Environment Variables Required

```bash
FT_RESEND_API_KEY=re_xxxxx
FT_RESEND_FROM_EMAIL=hello@futuretogether.community
FT_RESEND_FROM_NAME="Future Together"
```

## Reminder System

Reminders are sent via cron jobs calling the API:

```bash
# Day before (24 hours)
curl -X POST https://futuretogether.community/api/events/reminders/send?type=day_before

# Hour before
curl -X POST https://futuretogether.community/api/events/reminders/send?type=hour_before
```

For local testing

```bash
# Day before (24 hours)
curl -X POST http://127.0.0.1:8000/api/events/reminders/send?type=day_before

# Hour before
curl -X POST http://127.0.0.1:8000/api/events/reminders/send?type=hour_before
```

Recommended cron schedule:

```cron
# Check for day-before reminders daily at 9am
0 9 * * * curl -X POST https://yourdomain.com/api/events/reminders/send?type=day_before

# Check for hour-before reminders every hour
0 * * * * curl -X POST https://yourdomain.com/api/events/reminders/send?type=hour_before
```

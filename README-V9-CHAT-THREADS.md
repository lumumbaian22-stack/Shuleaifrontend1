# Shule AI Frontend V9 - Teacher Chat + Student Classroom Threads

## New frontend features

### Teacher Dashboard
The Teacher `Messages/Chat` section now shows:
- WhatsApp-style direct teacher chat.
- Group chat tab.
- Automatic Staff Room group.
- Group info panel.
- Award buttons on received messages:
  - ⭐ +1
  - ⭐ +3
  - ⭐ +5 + 🔥 streak

### Student Dashboard
The Student `Chat/Classroom` section now shows:
- Structured classroom threads.
- Thread replies.
- Achievement panel.
- Total points and streaks from teacher awards.

## Deploy order

1. Deploy backend V9 first.
2. Run backend migrations.
3. Restart backend.
4. Replace frontend with this V9 package.

## Notes

The visual layer preserves:
- V8 production dashboard design.
- Landing page.
- Student login fix.
- Hidden Super Admin access.

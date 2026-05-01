# Shule AI Frontend V9.3

## Fixed

### 1. Admin Department "View Group Chat"
Admin Departments now opens the exact department group chat in a modal.

Admin can:
- View department group messages
- See members
- See department head
- Send admin message into the department group

### 2. Global Profile Pictures
Profile picture system is simplified and stabilized.

Profile pictures:
- Persist in `user` and `shule_user` localStorage
- Apply to known profile/avatar elements
- Apply to explicit `[data-profile-image]` avatars
- Open full-size preview when clicked

Removed the aggressive MutationObserver that was causing profile rendering issues.

### 3. Smart Duty Verification
Admin Duty section now has:
- Duty generation period: weekly/monthly/termly/yearly
- GPS geofence settings
- QR token requirement
- School latitude/longitude
- Teacher reporting time + grace minutes
- Student reporting time + grace minutes
- Compliance report
- Late arrival register
- Daily QR token print view

Teacher Duty section now has:
- GPS capture
- QR/token input
- Verified check-in
- Verified check-out
- Timestamp tracking
- Weekly duty preview

## Deploy Order

1. Deploy backend V9.3
2. Run `npm run migrate`
3. Restart backend
4. Replace frontend with V9.3

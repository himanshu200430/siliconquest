# Quiz Cooldown System Documentation

## Overview
The quiz cooldown system implements a progressive penalty for wrong answers in the AR character quiz. Each wrong answer increases the cooldown period, preventing rapid-fire guessing and encouraging thoughtful answers.

## Features

### Progressive Cooldown
- **First wrong answer**: 60 seconds cooldown
- **Each subsequent wrong answer**: Additional 30 seconds
- **Question-specific**: Cooldowns don't carry over between different characters
- **Persistent**: Cooldowns are stored in browser localStorage and persist across sessions

### Cooldown Duration Formula
```
cooldown_seconds = 60 + (wrong_attempts * 30)
```

Examples:
- 1st wrong answer: 60 seconds
- 2nd wrong answer: 90 seconds (60 + 30)
- 3rd wrong answer: 120 seconds (60 + 60)
- 4th wrong answer: 150 seconds (60 + 90)

## Implementation

### Files Modified

#### 1. `src/utils/quizCooldown.ts` (NEW)
Core cooldown management utilities:
- `getCooldownRemaining(characterId)`: Check remaining cooldown seconds
- `setWrongAnswerCooldown(characterId)`: Set progressive cooldown after wrong answer
- `clearCooldown(characterId)`: Clear cooldown after correct answer
- `formatCooldownTime(seconds)`: Format seconds as MM:SS
- `cleanupExpiredCooldowns()`: Remove expired cooldowns from storage

#### 2. `src/components/ARCamera.tsx`
Main integration:
- Added `cooldownSeconds` state to track active cooldown
- Added `cooldownIntervalRef` for timer management
- `startCooldownTimer()`: Start countdown timer that updates every second
- `clearCooldownTimer()`: Stop timer and clear state
- Check cooldown on character detection
- Set cooldown on wrong answer submission
- Clear cooldown on correct answer
- Pass cooldown info to UI overlay

#### 3. `src/components/ar-camera/ui/DetectedCharacterOverlay.tsx`
UI updates:
- Added `cooldownSeconds` prop
- Display cooldown timer in MM:SS format
- Disable "Collect Character" button during cooldown
- Show "On cooldown" status with animated timer

## User Experience Flow

### Normal Flow (No Cooldown)
1. User detects character via AR
2. Character overlay shows "Character detected!"
3. User clicks "Collect Character"
4. Quiz modal appears
5. User answers question

### After Wrong Answer
1. User submits incorrect answer
2. Quiz shows "✗ Try Again" for 1.5 seconds
3. Quiz closes automatically
4. Cooldown timer starts (60s, 90s, 120s, etc.)
5. Character overlay shows "On cooldown" with countdown
6. "Collect Character" button is disabled
7. Timer counts down in MM:SS format (e.g., "1:30")
8. After timer expires, user can try again

### After Correct Answer
1. User submits correct answer
2. Cooldown is cleared for that character
3. Character is marked as caught
4. Wrong attempt counter resets to 0

## Storage Format

### LocalStorage Key
```
quiz_cooldowns
```

### Data Structure
```json
{
  "c101": {
    "expiresAt": 1697234567890,
    "attempts": 2
  },
  "c202": {
    "expiresAt": 1697234600000,
    "attempts": 1
  }
}
```

- `expiresAt`: Unix timestamp (milliseconds) when cooldown expires
- `attempts`: Number of wrong attempts for progressive calculation

## Technical Details

### Timer Management
- Uses `setInterval` to update countdown every second
- Interval is cleared when:
  - Cooldown expires
  - User closes AR camera
  - User switches tiers
  - Target is lost from view
  - Component unmounts

### Performance Considerations
- Only one timer runs at a time per component instance
- Cleanup happens on component unmount to prevent memory leaks
- Expired cooldowns are automatically removed from localStorage

### Edge Cases Handled
1. **Multiple wrong attempts**: Each increments cooldown by 30s
2. **Page refresh**: Cooldowns persist via localStorage
3. **Character caught by other team**: Cooldown remains until caught by user's team
4. **Switching tiers**: Timer is cleared, but cooldown data persists
5. **Closing AR camera**: Timer is cleared, cooldown persists

## Testing Checklist

- [ ] First wrong answer triggers 60s cooldown
- [ ] Second wrong answer triggers 90s cooldown
- [ ] Third wrong answer triggers 120s cooldown
- [ ] Cooldown timer displays and counts down correctly
- [ ] "Collect Character" button disabled during cooldown
- [ ] Correct answer clears cooldown for that character
- [ ] Cooldown persists after page refresh
- [ ] Cooldown is character-specific (doesn't affect other characters)
- [ ] Timer clears when AR camera is closed
- [ ] Timer clears when tier is switched
- [ ] No memory leaks (intervals properly cleaned up)

## Future Enhancements

Possible improvements:
1. **Visual feedback**: Progress bar for cooldown
2. **Sound effects**: Audio cue when cooldown expires
3. **Admin override**: Admin can reset cooldowns
4. **Global cooldown cap**: Maximum cooldown limit (e.g., 5 minutes)
5. **Hints system**: Show hints after multiple wrong attempts
6. **Analytics**: Track cooldown effectiveness and user behavior

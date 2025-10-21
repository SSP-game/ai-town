# Survey Configuration Guide

This guide explains how to customize the psychological survey using the JSON configuration file.

## Configuration File Location

The survey configuration is located at: `data/survey-config.json`

## How to Modify the Survey

1. Edit the `data/survey-config.json` file
2. Save your changes
3. The survey will automatically update in the browser (via Vite HMR) without needing to restart the dev server

## JSON Structure

### Top Level
```json
{
  "title": "Survey Title",
  "description": "Survey description shown to users",
  "sections": [...]
}
```

### Sections
Each section represents a category of questions:

```json
{
  "id": "unique_section_id",
  "title": "Section Title",
  "color": "blue",  // Options: blue, green, purple, yellow, red, pink
  "questions": [...]
}
```

### Question Types

#### 1. Scale Questions (1-5 rating)
```json
{
  "id": "questionId",
  "type": "scale",
  "label": "Question text",
  "description": "Optional description",
  "required": true,
  "min": 1,
  "max": 5,
  "lowLabel": "Label for minimum value",
  "highLabel": "Label for maximum value",
  "defaultValue": 3
}
```

#### 2. Multiple Choice Questions
```json
{
  "id": "questionId",
  "type": "choice",
  "label": "Question text",
  "description": "Optional description",
  "required": true,
  "options": [
    { "value": "option1", "label": "Option 1 Display Text" },
    { "value": "option2", "label": "Option 2 Display Text" },
    { "value": "option3", "label": "Option 3 Display Text" }
  ],
  "defaultValue": "option1"
}
```

#### 3. Text Input Questions
```json
{
  "id": "questionId",
  "type": "text",
  "label": "Question text",
  "description": "Optional description",
  "required": false,
  "multiline": true,
  "rows": 3,
  "placeholder": "Placeholder text..."
}
```

## Important Notes

### Question IDs
- **CRITICAL**: Question IDs must match the fields expected by the backend
- Current expected fields in `convex/survey.ts`:
  - `currentMood`
  - `stressLevel`
  - `anxietyLevel`
  - `energyLevel`
  - `socialPreference`
  - `socialAnxiety`
  - `lifeSatisfaction`
  - `sleepQuality`
  - `recentChallenges` (optional)
  - `positiveExperiences` (optional)
  - `futureGoals` (optional)

### Adding New Questions

If you want to add completely new questions (not just modify existing ones):

1. Add the question to `survey-config.json`
2. Update `convex/schema.ts` to include the new field in the `surveys` table
3. Update `convex/survey.ts` to accept the new field in the `submitSurvey` mutation

### Example: Adding a New Question

1. **Add to config** (`data/survey-config.json`):
```json
{
  "id": "motivation",
  "type": "scale",
  "label": "How motivated do you feel?",
  "description": "Rate your current motivation level",
  "required": true,
  "min": 1,
  "max": 5,
  "lowLabel": "Not Motivated",
  "highLabel": "Highly Motivated",
  "defaultValue": 3
}
```

2. **Update schema** (`convex/schema.ts`):
```typescript
answers: v.object({
  // ... existing fields
  motivation: v.number(), // Add this line
}),
```

3. **Update mutation** (`convex/survey.ts`):
```typescript
answers: v.object({
  // ... existing fields
  motivation: v.number(), // Add this line
}),
```

## Colors Available

- `blue` - Blue accent (default for emotions)
- `green` - Green accent (default for social)
- `purple` - Purple accent (default for life satisfaction)
- `yellow` - Yellow accent (default for reflections)
- `red` - Red accent
- `pink` - Pink accent

## Testing Your Changes

1. Edit `data/survey-config.json`
2. Save the file
3. The browser will automatically reload (HMR)
4. Click the "Survey" button in the game
5. Verify your changes appear correctly

## Tips

- Keep question labels concise (1-2 lines)
- Use descriptions for additional context
- Make sure all required questions have appropriate defaults
- Test the survey after making changes
- Use meaningful IDs that match the question content

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

**With Option Descriptions** (displays in vertical layout with radio buttons):
```json
{
  "id": "questionId",
  "type": "choice",
  "label": "Question text",
  "description": "Optional description",
  "required": true,
  "options": [
    {
      "value": "option1",
      "label": "Option 1 Title",
      "description": "Detailed explanation of what this option means"
    },
    {
      "value": "option2",
      "label": "Option 2 Title",
      "description": "Detailed explanation of what this option means"
    }
  ],
  "defaultValue": "option1"
}
```
*Note: When any option includes a `description` field, the question will automatically display in a vertical radio-button layout. Without descriptions, it uses a compact horizontal button layout.*

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

#### 4. Multi-Choice Questions (Multiple Selection)
```json
{
  "id": "questionId",
  "type": "multi-choice",
  "label": "Question text",
  "description": "Select all that apply",
  "required": false,
  "options": [
    { "value": "option1", "label": "Option 1" },
    { "value": "option2", "label": "Option 2" },
    { "value": "option3", "label": "Option 3" }
  ],
  "minSelections": 1,
  "maxSelections": 3,
  "defaultValue": []
}
```

#### 5. Boolean/Toggle Questions (Yes/No)
```json
{
  "id": "questionId",
  "type": "boolean",
  "label": "Question text",
  "description": "Optional description",
  "required": true,
  "trueLabel": "Yes",
  "falseLabel": "No",
  "defaultValue": false
}
```

#### 6. Matrix Questions (Multiple Sub-Questions with Same Scale)
```json
{
  "id": "questionId",
  "type": "matrix",
  "label": "Main question text",
  "description": "Rate each item below",
  "required": true,
  "subQuestions": [
    { "id": "subQ1", "label": "Sub-question 1" },
    { "id": "subQ2", "label": "Sub-question 2" },
    { "id": "subQ3", "label": "Sub-question 3" }
  ],
  "scaleOptions": [
    { "value": 1, "label": "1" },
    { "value": 2, "label": "2" },
    { "value": 3, "label": "3" },
    { "value": 4, "label": "4" },
    { "value": 5, "label": "5" }
  ]
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
  - `spendingHabits` (optional, string)
  - `hobbies` (optional, array of strings)
  - `exerciseRegularly` (optional, boolean)
  - `dailyActivities` (optional, object with work/socializing/relaxing/learning fields)

### Adding New Questions

If you want to add completely new questions (not just modify existing ones):

1. Add the question to `survey-config.json`
2. Update `convex/schema.ts` to include the new field in the `surveys` table
3. Update `convex/survey.ts` to accept the new field in the `submitSurvey` mutation

### Example: Adding a New Question

#### Example 1: Adding a Scale Question

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

#### Example 2: Adding a Multi-Choice Question

1. **Add to config**:
```json
{
  "id": "preferredActivities",
  "type": "multi-choice",
  "label": "What activities do you prefer?",
  "description": "Select all that apply",
  "required": false,
  "options": [
    { "value": "indoor", "label": "Indoor Activities" },
    { "value": "outdoor", "label": "Outdoor Activities" },
    { "value": "creative", "label": "Creative Pursuits" }
  ],
  "defaultValue": []
}
```

2. **Update schema and mutation**:
```typescript
preferredActivities: v.optional(v.array(v.string())),
```

#### Example 3: Adding a Matrix Question

1. **Add to config**:
```json
{
  "id": "weekdayMood",
  "type": "matrix",
  "label": "How do you typically feel on each day?",
  "required": true,
  "subQuestions": [
    { "id": "monday", "label": "Monday" },
    { "id": "friday", "label": "Friday" }
  ],
  "scaleOptions": [
    { "value": 1, "label": "Bad" },
    { "value": 5, "label": "Great" }
  ]
}
```

2. **Update schema and mutation**:
```typescript
weekdayMood: v.optional(v.object({
  monday: v.number(),
  friday: v.number(),
})),
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

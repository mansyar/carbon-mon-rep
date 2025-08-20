Data Entry — Single Emission Form (mockup)

Layout:
- Page / Modal title: "Add Emission"
- Site selector (dropdown)
- Emission type (text or lookup)
- Value (number input) and Unit (dropdown)
- Timestamp (datetime picker)
- Reference ID (optional text)
- Action buttons: Cancel, Save

Behavior notes:
- Client-side validation: required fields, numeric value >= 0, timestamp format
- Show server-side validation errors inline
- On success: show toast "Emission created" and navigate back to Emissions list
- Accessibility: labels for all inputs, keyboard focus on first field, ARIA for error messages

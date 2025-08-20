Mockups / Wireframes (text placeholders)

These are simple, shareable wireframe sketches to guide UI implementation. Replace with images or Figma links as needed.

1) Login screen (docs/mockups/login.md)
---------------------
[Login Page]
---------------------
| Logo                     |
| -----------------------  |
| Username/email [________] |
| Password       [________] |
| [ ] Remember me           |
| [ Login ]    [Forgot?]    |
---------------------
Notes:
- Show inline validation for required fields.
- Show generic error message for invalid credentials.

2) Data Entry — Single Emission Form (docs/mockups/data-entry.md)
---------------------
[Data Entry — Add Emission]
---------------------
Site:    [ v Select site            ]
Type:    [ emission_type text      ]
Value:   [ 123.45      ]  Unit: [ kg v ]
Time:    [ 2025-08-18 07:00 ] (picker)
Ref ID:  [ optional         ]
[ Cancel ]   [ Save ]
---------------------
Notes:
- Client validation for required fields and numeric value >= 0.
- Success toast and navigate to list.

3) Bulk Upload page (docs/mockups/bulk-upload.md)
---------------------
[Bulk Upload]
---------------------
[Choose file]  (supports .csv, .xlsx)
Template: [ v select mapping       ]
[Preview mapping]  [Start upload]
Progress:
- Row 1: OK
- Row 2: Error: missing value
- ...
[Download error report]
---------------------
Notes:
- Show progress bar and per-row summary table.

4) Reports page / Report Builder (docs/mockups/reports.md)
---------------------
[Reports]
---------------------
Site: [ v select site ]   Interval: [ daily v ]
From: [ 2025-07-01 ]  To: [ 2025-07-31 ]
[Generate report]
History:
- 2025-07-01  Monthly report (Ready) [Download]
- 2025-06-01  Monthly report (Ready) [Download]
---------------------
Notes:
- Show queued state and download links.

5) Audit Logs page (docs/mockups/audit-logs.md)
---------------------
[Audit Logs]
---------------------
Filters: Site [ ], User [ ], Action [ ], From [ ], To [ ] [Apply]
Results:
| Time | User | Action | Resource | Diff |
|------|------|--------|----------|------|
| ...  | ...  | CREATE | emission | {...} |
[Export CSV] [Export PDF]
---------------------
Notes:
- Diff expandable per row.

File notes:
- These are text placeholders. Replace with PNGs or Figma URLs when available.
- Use filenames above to reference each mockup in docs/vertical-slices.md.

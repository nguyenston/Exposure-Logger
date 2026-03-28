# Current Release Notes

This file is the working draft for the next app-store release.

Workflow:

1. Add short user-facing bullets here as features or fixes land.
2. When cutting a real release, bump `expo.version` in `app.json` if the public release version should change.
3. Before publishing, trim this down to the final Play/App Store release note text.
4. After the release is submitted, reset this file back to the template for the next cycle.

Current draft:

- Adds in-app help pages for roll detail, exposure entry, editing, and the gear registry.
- Expands gear registry metadata for lenses, and adds nickname-aware camera bodies for easier multi-body tracking.
- Moves box ISO to film-stock metadata, with auto-fill from film names and cleaner roll forms.
- Warns before starting a new roll on a camera that already has an active roll loaded.
- Adds roll search and filtering, including searchable camera and film-stock filters plus date-range pickers.
- Polishes dictation and entry flow with safer frame parsing, corrected roll-detail swipe direction, and a cleaner gear-registry shortcut in settings.

Reset template:

```md
# Current Release Notes

This file is the working draft for the next app-store release.

Workflow:

1. Add short user-facing bullets here as features or fixes land.
2. When cutting a real release, bump `expo.version` in `app.json` if the public release version should change.
3. Before publishing, trim this down to the final Play/App Store release note text.
4. After the release is submitted, reset this file back to the template for the next cycle.

Current draft:

- 
```

# Current Release Notes

This file is the working draft for the next app-store release.

Workflow:

1. Add short user-facing bullets here as features or fixes land.
2. When cutting a real release, bump `expo.version` in `app.json` if the public release version should change.
3. Before publishing, trim this down to the final Play/App Store release note text.
4. After the release is submitted, reset this file back to the template for the next cycle.

Current draft:

- Simplifies the exposure form layout and preserves in-progress add/edit drafts when navigating away and back.
- Replaces raw timestamp editing with friendlier date/time controls while keeping ISO storage under the hood.
- Refines roll detail and new-roll/new-exposure screens for faster access and cleaner layout.
- Replaces the hidden hold-to-voice add gesture with a clearer split add / voice-add control on roll detail.
- Tunes voice capture so it is less eager to stop mid-phrase and uses a shorter max listening timeout.
- Adds a share/export chooser on roll detail with printable roll-level PDF export alongside CSV.
- Smooths the gear selector overlay so it opens and closes without the earlier flicker/jump.
- Refreshes the app/store artwork and adds a hosted privacy-policy page plus feature graphic.
- Moves native-module development to the Expo development client workflow.

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

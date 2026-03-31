# In-App Help

## Purpose

Provide lightweight, screen-specific instruction pages for the parts of the app that have non-obvious behavior.

This is not meant to replace full documentation.

It is meant to give users a quick explanation of:

- what a screen is for
- shortcuts and gestures
- unusual behaviors that are easy to miss

## Header Entry Point

Add an `i` button in the header bar.

Placement:

- header right
- next to the settings button

Behavior:

- tapping the `i` button opens the instruction page for the current screen

## Initial Screen Coverage

Start with help pages for:

- roll detail
- new exposure
- edit exposure
- gear registry

Do not force every screen to have one.

This should stay focused on screens where:

- gestures exist
- voice shortcuts exist
- hardware shortcuts exist
- non-obvious data-entry behavior exists

## Content Style

Each help page should stay short and practical.

Recommended structure:

1. what this screen is for
2. key actions
3. shortcuts / gestures
4. important behaviors or caveats

Good examples of things to explain:

### Roll detail

- swipe collapsed exposure cards left/right
- page indicator meaning
- quick add vs voice add
- volume up opens New Exposure; a second volume up on that screen starts voice recording
- export options

### New exposure

- add vs insert behavior
- target frame selection
- voice dictation commands
- concrete example dictation phrases
- volume up / volume down shortcuts

### Edit exposure

- voice dictation support
- concrete example dictation phrases
- volume-button shortcuts
- draft behavior while navigating

### Gear registry

- quick-create vs full registry editing
- lens metadata fields
- auto-filled focal length / max aperture from lens name

## Implementation Direction

Recommended implementation:

- one shared help screen component
- static content defined per screen
- route-based pages such as:
  - `/help/roll-detail`
  - `/help/new-exposure`
  - `/help/edit-exposure`
  - `/help/gear-registry`

This is better than hardcoding help text directly into each screen.

## Recommendation

Ship this as a lightweight system:

- one reusable route/screen
- one header `i` button
- initial coverage only for the four screens above

That gives discoverability without cluttering the main workflow.

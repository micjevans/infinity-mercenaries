# Mercenaries App Logic

This folder is the migration landing zone for pure company-manager logic from the older React/Firebase project.

The first import keeps faction and market JSON local under `src/data/infinity` so we can build the React manager without depending on a backend. Later, if the faction bundle becomes too heavy, we can move the faction JSON to a publicly shared Google Drive file and load it on demand in the client when a player opens recruitment or changes sectorials.

Keep modules in this folder framework-agnostic. React islands should call this code, but this code should not import React, Astro components, browser routing, Firebase, or Google Drive APIs directly.

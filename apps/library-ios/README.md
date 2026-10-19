# Commonplace for iOS

Native SwiftUI client (iOS 17+) for the [Commonplace web app](../library). It uses the same REST API, so quotes stay in sync between web and phone.

Features: browse, search, and filter by type or tag, pull to refresh, swipe to delete, create and edit quotes (with notes and tags), added/edited timestamps, related-quote suggestions with reasons, and a share sheet.

## Build

The Xcode project is generated from `project.yml` with [XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
cd apps/library-ios
xcodegen generate
open Commonplace.xcodeproj
```

Select your team under *Signing & Capabilities*, then run on a simulator or your iPhone.

## Connect

On first launch, open **Settings** and enter:

- **Server**: your deployed web app, such as `commonplace.vercel.app`. While developing, use `http://<your-mac>.local:3000` and run `npm run dev -- -H 0.0.0.0` in `apps/library`. Local-network http is allowed.
- **Access token**: the web app's `FACETS_API_TOKEN`, stored in the Keychain.

Use **Test connection** to check both.

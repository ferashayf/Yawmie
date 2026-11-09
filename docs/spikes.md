# Spikes — results

Quick tests run before building, to answer the risky questions. Test pages were thrown away; only the answers stay here.

Test page for spikes 1–2: https://ferashayf.github.io/yawmie-spike/ (throwaway public repo `ferashayf/yawmie-spike`, delete after testing).
Test artifact for spike 3: https://claude.ai/artifact/RbvRgzGXrQifk3NvRafWgx (private).

## 1. Persistent storage on iPhone

| Check | Result |
|---|---|
| Safari tab: `persist()` / `persisted()` | false / false (2026-11-09) |
| Safari tab: saving in IndexedDB | works (counter reached 12) |
| Safari's user agent | says "iOS 18.7" on an iOS 26 phone: Safari freezes this number, so the app must never rely on it |
| Home Screen icon: `persist()` / `persisted()` | **true** / false on the first open from the icon; **true / true** after closing and reopening |
| Icon sees Safari's data? | **No.** Safari had 12, the icon started at 0: separate storage, as expected |
| Data after closing the app and restarting the phone | **Kept** (counter 2 → 2) |
| Data after 3 days | **On hold**: the test page is offline since `yawmie-spike` went private. Check later (make it public again) or skip: `persisted()` is true and data survived a restart |

**Decision:** keep the plan. Home Screen apps get protected storage; Safari tabs don't (so the Safari card U3 matters). `persisted()` can still say false on the very first open, right after `persist()` said true, so Settings → Data protection shows "Protected" when **either** `persist()` answered true this session **or** `persisted()` is true.

## 2. "Yawmie Reminder" shortcut

The shortcut (built 2026-11-09): Get Dictionary from Shortcut Input → Get Value for `title` → Get Value for `when` → Add New Reminder (title = the `title` value, Alert at time = the `when` value). The alert field takes only one value, so Yawmie sends date and time together: `{ "title": "…", "when": "YYYY-MM-DD HH:mm" }`.

| Check | Result |
|---|---|
| Link `shortcuts://run-shortcut?name=Yawmie%20Reminder&input=text&text=<JSON>` from the Home Screen app | **Works.** No "Open in Shortcuts?" question; it opens Shortcuts straight away |
| First run | iPhone asks "Allow 'Yawmie Reminder' to output 1 reminder?" (Don't Allow / Allow Once / Always Allow). Setup must tell people to pick **Always Allow** |
| Reminder created | **Yes**: "Test reminder", today 9:30 PM, right date and time |
| After it runs | Stays in the Shortcuts app with a small "◀ Y Spike" back link at the top left; it does **not** jump back by itself |
| Alert rings at 21:30 | **Yes**, rang on time (2026-11-09) |
| Arabic title | pending |
| Repeat on iOS 26 | not checked (v1 sends only the next date anyway, PRD R2) |
| Inside the Claude artifact | **Doesn't open** (spike 3) → hidden there |

**Before sharing the shortcut:** set its list to the default list (it points at the owner's own list now), then share an iCloud link from setup step 7.

**Decision so far:** keep reminders through the shortcut. Yawmie sends `{title, when}`.

## 3. Artifact `db`: who can save

Published privately with `db` rule `data/users/{self}` read + write `interact`, plus `user` and `downloads`.

| Check | Result |
|---|---|
| Owner, Claude app on iPhone: save to `data/users/<id>/` | **Works** |
| Saved data after fully closing and reopening Claude | **Kept** (counter 2 → 2, 2026-11-09) |
| 10 pieces of 60,000 Arabic characters (time, quota) | **Works**: 6.4 s for all 10 (~0.6 s per piece), read back identical, no quota error. A normal Yawmie save is 1–2 pieces |
| `downloads.save` (Export) | **Works**: the iPhone shows a save prompt; cancelling returns `declined` (the app must treat that as "cancelled", not an error) |
| Mic (speech API) | **Doesn't work** inside the artifact (nothing happens) → hidden, keyboard-mic hint instead |
| Shortcut link from inside the artifact | **Doesn't open** Shortcuts → Remind me is hidden in the artifact (`ARTIFACT_REMINDERS = false`) |
| Other people saving in a shared copy | Not tested: Claude's rules say public-link viewers can never write |

**Decision (2026-11-09):** each person who wants the artifact publishes **their own copy** from the GitHub repo (`dist-artifact/index.html` in a release), so they are its owner and can save. No shared Yawmie artifact. In the artifact: no Yawmie mic (people use the iPhone keyboard's mic) and no reminders.

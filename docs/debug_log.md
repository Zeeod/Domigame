# Debug Log
## DOM Inspection Result
- **Result**: The "ÉCART" button (`.zone-5-trash`) exists but contains ONLY text node "ÉCART".
- **Badge**: No red badge element (or any other children) exists within the button.
- **Hypothesis**: The conditional rendering `{pub.trash.length > 0 && (...)}` is evaluating to `false` or forcing a null return, causing React not to mount the element.
- **Verification**: The inspector shows cards in trash, so `pub.trash` should be populated.
- **Next Step**: Force the badge to render unconditionally to confirm positioning, then debug the `pub.trash.length` value by printing it.

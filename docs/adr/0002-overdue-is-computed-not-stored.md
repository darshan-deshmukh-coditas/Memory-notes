# Overdue is computed at read time, never stored

The store holds only `open` or `done`. `overdue` is worked out on every read from the due date and "today" (the system date, or `--today`). We rejected storing an `overdue` status, because it would go stale as days pass and would need a sweep to keep right. Because "today" is injected, results are repeatable in tests (NFR-M2). Status is exclusive: done, overdue or open, so `--status open` hides overdue items. See FRD D1, D44, D54.

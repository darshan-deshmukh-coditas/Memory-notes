# Ingest never deletes items

`ingest` only adds or updates items. When a line is removed from a note, its stored item stays unchanged, and ids are never reused. We rejected marking items stale and hiding them, because the tool exists so that action items are not lost (BO-2), and a stale status would add a state the BRD never asked for. The cost is that an item whose line was deleted or heavily reworded stays until the user marks it `done`. See FRD D13, D14, D52.

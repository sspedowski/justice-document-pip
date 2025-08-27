from .rules import rule, RuleContext, Contradiction

@rule
def location_mismatch(ctx: RuleContext):
    """
    Statement shape:
      {"type":"LOCATION","event_id":"evt1","location":"Los Angeles CA"}

    Emits a contradiction for each pair of distinct locations tied to the
    same event. (Pairs limited to representative pairs to avoid explosion.)
    """
    by_event = {}
    for s in ctx.statements:
        if s.get("type") != "LOCATION":
            continue
        ev = s.get("event_id")
        loc = (s.get("location") or "").strip()
        if not ev or not loc:
            continue
        by_event.setdefault(ev, {}).setdefault(loc.lower(), []).append(s)

    out = []
    for ev, loc_groups in by_event.items():
        loc_keys = list(loc_groups.keys())
        if len(loc_keys) <= 1:
            continue
        base_loc = loc_keys[0]
        for other in loc_keys[1:]:
            a = loc_groups[base_loc][0]
            b = loc_groups[other][0]
            out.append(Contradiction(
                rule="location_mismatch",
                severity="medium",
                key=ev,
                rationale=f"Event {ev} assigned multiple locations: '{base_loc}' vs '{other}'.",
                a=a, b=b
            ))
    return out
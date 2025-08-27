from .rules import rule, RuleContext, Contradiction

@rule
def presence_absence_conflict(ctx: RuleContext):
    """
    Statement shape expected:
      {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":True}
      {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":False}
    
    Detects when a party is marked both present and absent for the same event.
    """
    by_event_party = {}
    for s in ctx.statements:
        if s.get("type") != "PRESENCE":
            continue
        event_id = s.get("event_id")
        party = s.get("party")
        present = s.get("present")
        if not event_id or not party or present is None:
            continue
        key = f"{event_id}:{party}"
        by_event_party.setdefault(key, {}).setdefault(present, []).append(s)
    
    contradictions = []
    for key, presence_groups in by_event_party.items():
        if True in presence_groups and False in presence_groups:
            a = presence_groups[True][0]
            b = presence_groups[False][0]
            contradictions.append(Contradiction(
                rule="presence_absence_conflict",
                severity="medium",
                key=key,
                rationale=f"Party marked both present and absent for {key}.",
                a=a, b=b
            ))
    return contradictions

@rule
def event_date_disagreement(ctx: RuleContext):
    """
    Statement shape expected:
      {"type":"EVENT_DATE","event_id":"evt1","date":"2025-01-01"}
      {"type":"EVENT_DATE","event_id":"evt1","date":"2025-01-05"}
    
    Detects multiple different dates for the same event.
    """
    by_event = {}
    for s in ctx.statements:
        if s.get("type") != "EVENT_DATE":
            continue
        event_id = s.get("event_id")
        date = s.get("date")
        if not event_id or not date:
            continue
        by_event.setdefault(event_id, {}).setdefault(date, []).append(s)
    
    contradictions = []
    for event_id, date_groups in by_event.items():
        dates = list(date_groups.keys())
        if len(dates) <= 1:
            continue
        # Compare all pairs of different dates
        for i, date_a in enumerate(dates):
            for date_b in dates[i+1:]:
                a = date_groups[date_a][0]
                b = date_groups[date_b][0]
                contradictions.append(Contradiction(
                    rule="event_date_disagreement",
                    severity="high",
                    key=event_id,
                    rationale=f"Event {event_id} has conflicting dates: {date_a} vs {date_b}.",
                    a=a, b=b
                ))
    return contradictions

@rule
def numeric_amount_mismatch(ctx: RuleContext):
    """
    Statement shape expected:
      {"type":"AMOUNT","event_id":"evt1","value":5000,"currency":"USD"}
      {"type":"AMOUNT","event_id":"evt1","value":12000,"currency":"USD"}
    
    Detects different monetary amounts for the same event/context.
    """
    by_event = {}
    for s in ctx.statements:
        if s.get("type") != "AMOUNT":
            continue
        event_id = s.get("event_id")
        value = s.get("value")
        currency = s.get("currency", "USD")
        if not event_id or value is None:
            continue
        key = f"{event_id}:{currency}"
        by_event.setdefault(key, {}).setdefault(value, []).append(s)
    
    contradictions = []
    for key, value_groups in by_event.items():
        values = list(value_groups.keys())
        if len(values) <= 1:
            continue
        # Compare all pairs of different values
        for i, val_a in enumerate(values):
            for val_b in values[i+1:]:
                a = value_groups[val_a][0]
                b = value_groups[val_b][0]
                contradictions.append(Contradiction(
                    rule="numeric_amount_mismatch",
                    severity="medium",
                    key=key,
                    rationale=f"Amount mismatch for {key}: {val_a} vs {val_b}.",
                    a=a, b=b
                ))
    return contradictions
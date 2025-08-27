from .rules import rule, RuleContext, Contradiction

OPPOSITES = {
    "granted": "denied",
    "approved": "rejected",
    "open": "closed",
    "closed": "open",  # allow detection even if only reversed mapping encountered
    "accepted": "rejected",
}

def _norm(val: str):
    return (val or "").strip().lower()

@rule
def status_flip_without_transition(ctx: RuleContext):
    """
    Statement shape expected:
      {"type":"STATUS","target":"motion123","status":"granted"}
    or  {"type":"STATUS","case_id":"case42","status":"closed"}

    Flags contradictions when a target/case has opposite terminal statuses
    (e.g., granted vs denied) without modeling an intermediate transition.
    """
    by_target = {}
    for s in ctx.statements:
        if s.get("type") != "STATUS":
            continue
        tgt = s.get("target") or s.get("case_id")
        status = _norm(s.get("status"))
        if not tgt or not status:
            continue
        by_target.setdefault(tgt, {}).setdefault(status, []).append(s)

    out = []
    for tgt, status_groups in by_target.items():
        statuses = list(status_groups.keys())
        for st in statuses:
            opp = OPPOSITES.get(st)
            if opp and opp in status_groups:
                a = status_groups[st][0]
                b = status_groups[opp][0]
                out.append(Contradiction(
                    rule="status_flip_without_transition",
                    severity="high",
                    key=tgt,
                    rationale=f"Target {tgt} marked both {st} and {opp}.",
                    a=a, b=b
                ))
    return out
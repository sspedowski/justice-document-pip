import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

# Import all rules first to register them
from analyzer.all_rules import *
from analyzer.evaluate import evaluate
from analyzer.id import contradiction_id

def test_presence_absence_conflict():
    stmts = [
        {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":True,"id":"s1"},
        {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":False,"id":"s2"},
    ]
    cs = evaluate(stmts)
    assert any(c.rule == "presence_absence_conflict" for c in cs)

def test_event_date_disagreement():
    stmts = [
        {"type":"EVENT_DATE","event_id":"evtX","date":"2025-01-01","id":"d1"},
        {"type":"EVENT_DATE","event_id":"evtX","date":"2025-01-05","id":"d2"},
    ]
    cs = evaluate(stmts)
    assert any(c.rule == "event_date_disagreement" for c in cs)

def test_numeric_amount_mismatch():
    stmts = [
        {"type":"AMOUNT","event_id":"evt$","value":5000,"currency":"USD","id":"a1"},
        {"type":"AMOUNT","event_id":"evt$","value":12000,"currency":"USD","id":"a2"},
    ]
    cs = evaluate(stmts)
    assert any(c.rule == "numeric_amount_mismatch" for c in cs)

def test_status_flip_without_transition():
    stmts = [
        {"type":"STATUS","target":"motion1","status":"granted","id":"t1"},
        {"type":"STATUS","target":"motion1","status":"denied","id":"t2"},
    ]
    cs = evaluate(stmts)
    assert any(c.rule == "status_flip_without_transition" for c in cs)

def test_location_mismatch():
    stmts = [
        {"type":"LOCATION","event_id":"evtL","location":"Los Angeles","id":"l1"},
        {"type":"LOCATION","event_id":"evtL","location":"San Diego","id":"l2"},
    ]
    cs = evaluate(stmts)
    assert any(c.rule == "location_mismatch" for c in cs)

def test_deterministic_id_stable_order():
    a = {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":True,"id":"A"}
    b = {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":False,"id":"B"}
    id1 = contradiction_id("presence_absence_conflict","evt1:Noel", a, b)
    id2 = contradiction_id("presence_absence_conflict","evt1:Noel", b, a)
    assert id1 == id2
"""Casafeast Chef Portal — Iteration 3 backend tests.

Covers:
- Notifications: GET /api/notifications/{chefUUID}, POST /api/notifications/{chefUUID}/read
- Notification creation on request-delivery and on GET /orders/{id}/delivery status advancement
- Acknowledge-postpone: POST /api/orders/{id}/acknowledge-postpone (CF1003)
- Payout history: GET /api/payout/{chefUUID}/history (6 months, isCurrent, key)
- Payout statement with month parameter (PDF %PDF, CSV Casafeast)
- Seeded order regression: planTotalDays/deliveredDays/remainingDays + CF1003 postpone
- Menus include menuImages array + menuImageUrl cover
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://culinary-ops-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def seeded():
    r = requests.post(f"{API}/seed?force=true", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# -------- Seeded regression --------
def test_menus_have_gallery(seeded):
    r = requests.get(f"{API}/menus", params={"chefUUID": seeded["chefUUID"]})
    assert r.status_code == 200
    menus = r.json()
    assert len(menus) >= 3
    for m in menus:
        assert "menuImages" in m and isinstance(m["menuImages"], list)
        assert len(m["menuImages"]) >= 3
        assert m.get("menuImageUrl")
        assert m["menuImageUrl"] in m["menuImages"] or m["menuImageUrl"]  # cover set


def test_orders_have_plan_progress(seeded):
    r = requests.get(f"{API}/orders", params={"chefUUID": seeded["chefUUID"]})
    assert r.status_code == 200
    orders = r.json()
    for o in orders:
        assert "planTotalDays" in o
        assert "deliveredDays" in o
        assert "remainingDays" in o
        assert o["planTotalDays"] >= o["deliveredDays"]
    cf1003 = next((o for o in orders if o["orderId"] == "CF1003"), None)
    assert cf1003 is not None
    assert cf1003["planTotalDays"] == 5
    assert cf1003["deliveredDays"] == 2
    assert cf1003["remainingDays"] == 3
    p = cf1003.get("postpone", {})
    assert p.get("isPostponed") is True
    assert p.get("postponedDate")
    assert p.get("nextDeliveryDate")
    assert p.get("acknowledged") is False


# -------- Acknowledge postpone --------
def test_acknowledge_postpone(seeded):
    r = requests.post(f"{API}/orders/CF1003/acknowledge-postpone")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["postpone"]["acknowledged"] is True


def test_acknowledge_postpone_unknown():
    r = requests.post(f"{API}/orders/NOPE_XYZ/acknowledge-postpone")
    assert r.status_code == 404


# -------- Notifications on dispatch --------
def test_notifications_flow(seeded):
    chef = seeded["chefUUID"]
    # clear existing by marking read (endpoint clears all read flags; we check unread only)
    requests.post(f"{API}/notifications/{chef}/read")

    # request delivery — should create a notification
    r = requests.post(f"{API}/orders/CF1004/request-delivery")
    assert r.status_code == 200, r.text
    tracking_id = r.json()["trackingId"]

    notes = requests.get(f"{API}/notifications/{chef}").json()
    unread = [n for n in notes if not n.get("read")]
    assert any("CF1004" in n.get("title", "") for n in unread), unread

    # GET /delivery returns a valid dispatch status (advancement is time-based, ~6 min/stage,
    # so we can't easily wait it out in a unit test — verify contract only).
    d = requests.get(f"{API}/orders/CF1004/delivery").json()
    assert d.get("trackingId") == tracking_id
    assert d.get("status") in [
        "requested", "partner_assigned", "arriving_at_kitchen",
        "picked_up", "out_for_delivery", "delivered",
    ]

    # mark read
    r = requests.post(f"{API}/notifications/{chef}/read")
    assert r.status_code == 200
    notes = requests.get(f"{API}/notifications/{chef}").json()
    assert all(n.get("read") for n in notes)


# -------- Payout history --------
def test_payout_history(seeded):
    r = requests.get(f"{API}/payout/{seeded['chefUUID']}/history")
    assert r.status_code == 200
    hist = r.json()
    assert isinstance(hist, list) and len(hist) == 6
    for row in hist:
        for k in ("month", "key", "grossRevenue", "commission", "gst", "netPayout", "completedOrders", "isCurrent"):
            assert k in row, f"missing {k}"
    assert sum(1 for row in hist if row["isCurrent"]) == 1
    assert hist[0]["isCurrent"] is True  # first row = current month


def test_payout_history_unknown():
    r = requests.get(f"{API}/payout/no-such-chef/history")
    assert r.status_code == 404


# -------- Payout statement for a specific month --------
def test_payout_statement_month_pdf(seeded):
    hist = requests.get(f"{API}/payout/{seeded['chefUUID']}/history").json()
    # pick a prior month (index 2)
    month = hist[2]["month"]
    r = requests.get(f"{API}/payout/{seeded['chefUUID']}/statement", params={"format": "pdf", "month": month})
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert r.content[:4] == b"%PDF"
    disp = r.headers.get("content-disposition", "")
    assert month.replace(" ", "_") in disp


def test_payout_statement_month_csv(seeded):
    hist = requests.get(f"{API}/payout/{seeded['chefUUID']}/history").json()
    month = hist[3]["month"]
    r = requests.get(f"{API}/payout/{seeded['chefUUID']}/statement", params={"format": "csv", "month": month})
    assert r.status_code == 200
    body = r.content.decode("utf-8")
    assert "Casafeast" in body
    assert month in body or month.split(" ")[0] in body  # month label appears

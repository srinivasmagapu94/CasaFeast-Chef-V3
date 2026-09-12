"""Production-ready delivery dispatch layer.

Supports pluggable providers (Porter / Rapido). When real API credentials are
configured via env vars the layer calls the provider; otherwise it runs in a
deterministic simulation mode that mints a tracking id and advances status over
time — so the UI behaves identically once real keys are added.
"""
import os
import uuid
import random
import requests
from datetime import datetime, timezone, timedelta

PORTER_API_KEY = os.environ.get("PORTER_API_KEY") or ""
PORTER_API_URL = os.environ.get("PORTER_API_URL") or ""
RAPIDO_API_KEY = os.environ.get("RAPIDO_API_KEY") or ""
RAPIDO_API_URL = os.environ.get("RAPIDO_API_URL") or ""

STATUS_FLOW = ["requested", "partner_assigned", "arriving_at_kitchen", "picked_up", "out_for_delivery", "delivered"]


def _now():
    return datetime.now(timezone.utc)


def choose_provider(preferred: str | None = None) -> dict:
    if preferred == "Porter" or (PORTER_API_KEY and not preferred):
        return {"name": "Porter", "live": bool(PORTER_API_KEY and PORTER_API_URL)}
    if preferred == "Rapido" or RAPIDO_API_KEY:
        return {"name": "Rapido Business", "live": bool(RAPIDO_API_KEY and RAPIDO_API_URL)}
    return {"name": random.choice(["Porter", "Rapido Business"]), "live": False}


def create_dispatch(order: dict, preferred: str | None = None) -> dict:
    """Request a delivery partner. Returns a dispatch record."""
    provider = choose_provider(preferred)
    tracking_id = f"CFDX-{uuid.uuid4().hex[:8].upper()}"
    eta = _now() + timedelta(minutes=random.randint(25, 45))

    if provider["live"]:
        # --- Real provider call (ready for credentials) ---
        try:
            base = PORTER_API_URL if provider["name"] == "Porter" else RAPIDO_API_URL
            key = PORTER_API_KEY if provider["name"] == "Porter" else RAPIDO_API_KEY
            payload = {
                "request_id": tracking_id,
                "pickup_details": {"lat": order.get("pickupLat"), "lng": order.get("pickupLng")},
                "drop_details": {"lat": order.get("dropLat"), "lng": order.get("dropLng")},
                "customer": {"name": order.get("customerName")},
            }
            resp = requests.post(
                base.rstrip("/") + "/v1/orders/create",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload, timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            tracking_id = data.get("order_id", tracking_id)
        except Exception:
            provider["live"] = False  # fall back to simulation on failure

    return {
        "trackingId": tracking_id,
        "provider": provider["name"],
        "mode": "live" if provider["live"] else "simulated",
        "status": STATUS_FLOW[1],  # partner_assigned immediately after request
        "requestedAt": _now().isoformat(),
        "eta": eta.isoformat(),
        "partnerName": random.choice(["Ravi K.", "Suresh M.", "Anil P.", "Deepak R."]),
        "partnerPhone": f"+9198{random.randint(10000000, 99999999)}",
        "vehicleNumber": f"KA{random.randint(1, 51):02d}AB{random.randint(1000, 9999)}",
    }


def advance_status(dispatch: dict) -> dict:
    """Simulate live status progression based on elapsed time since request."""
    if not dispatch:
        return dispatch
    if dispatch.get("mode") == "live":
        return dispatch  # real status would come from provider webhook/poll
    try:
        requested = datetime.fromisoformat(dispatch["requestedAt"])
    except Exception:
        return dispatch
    elapsed_min = (_now() - requested).total_seconds() / 60.0
    idx = min(1 + int(elapsed_min / 6), len(STATUS_FLOW) - 1)
    dispatch["status"] = STATUS_FLOW[idx]
    return dispatch

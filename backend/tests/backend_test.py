"""Casafeast Chef Portal — Backend API regression tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://culinary-ops-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def seeded():
    r = requests.post(f"{API}/seed?force=true", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "chefUUID" in data and "newChefUUID" in data
    return data


# -------- Health / root --------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "Casafeast" in r.json().get("message", "")


# -------- Validation --------
def test_validate_mobile_valid(seeded):
    r = requests.get(f"{API}/validateMobileNumber/9876543210")
    assert r.status_code == 200
    d = r.json()
    assert d["isMobileNumberValid"] is True
    assert d["accountExists"] is True
    assert d["chefUUID"] == seeded["chefUUID"]


def test_validate_mobile_invalid():
    r = requests.get(f"{API}/validateMobileNumber/12345")
    assert r.status_code == 200
    assert r.json()["isMobileNumberValid"] is False


def test_validate_email(seeded):
    r = requests.get(f"{API}/validateEmail/demo@casafeast.com")
    assert r.status_code == 200
    d = r.json()
    assert d["isEmailValid"] is True
    assert d["accountExists"] is True


# -------- Auth (login OTP simulated) --------
def test_login_send_otp(seeded):
    r = requests.post(f"{API}/login", json={"identifier": "demo@casafeast.com"})
    assert r.status_code == 200
    d = r.json()
    assert d["otpSent"] is True
    assert "demoOtp" in d and len(d["demoOtp"]) == 6
    assert d["chefUUID"] == seeded["chefUUID"]


def test_login_unknown_identifier():
    r = requests.post(f"{API}/login", json={"identifier": "nobody@nowhere.com"})
    assert r.status_code == 404


def test_login_verify_success(seeded):
    r = requests.post(f"{API}/loginVerify", json={"identifier": "demo@casafeast.com", "otp": "123456"})
    assert r.status_code == 200
    d = r.json()
    assert "token" in d
    assert d["chefUUID"] == seeded["chefUUID"]


def test_login_verify_bad_otp():
    r = requests.post(f"{API}/loginVerify", json={"identifier": "demo@casafeast.com", "otp": "12"})
    assert r.status_code == 400


def test_login_verify_new_chef_phone(seeded):
    r = requests.post(f"{API}/loginVerify", json={"identifier": "9123456780", "otp": "654321"})
    assert r.status_code == 200
    assert r.json()["chefUUID"] == seeded["newChefUUID"]


# -------- Chef fetch --------
def test_get_chef_demo(seeded):
    r = requests.get(f"{API}/chef/{seeded['chefUUID']}")
    assert r.status_code == 200
    d = r.json()
    assert d["email"] == "demo@casafeast.com"
    assert d["isActivated"] is True
    assert "_id" not in d


def test_get_chef_not_found():
    r = requests.get(f"{API}/chef/no-such-uuid")
    assert r.status_code == 404


# -------- Menus --------
def test_menus_demo_has_seed(seeded):
    r = requests.get(f"{API}/menus", params={"chefUUID": seeded["chefUUID"]})
    assert r.status_code == 200
    menus = r.json()
    assert len(menus) >= 3
    active = [m for m in menus if m.get("isActive")]
    inactive = [m for m in menus if not m.get("isActive")]
    assert len(active) == 2
    assert len(inactive) == 1


def test_menu_crud_flow(seeded):
    chef = seeded["chefUUID"]
    payload = {
        "chefUUID": chef,
        "menuName": "TEST_Menu",
        "itemTypes": ["Veg"],
        "isAvailableForLunch": True,
        "durations": [{"mealDuration": "Weekly 5-Days", "price": "999.00", "dailyVolumeLimit": "10"}],
        "isAddonAvailable": False, "addons": [], "isActive": True,
    }
    r = requests.post(f"{API}/menu", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    mid = created["menuId"]
    assert created["menuName"] == "TEST_Menu"

    # Toggle
    r = requests.patch(f"{API}/menu/{mid}/toggle")
    assert r.status_code == 200
    assert r.json()["isActive"] is False

    # Update
    payload["menuName"] = "TEST_Menu_Updated"
    r = requests.put(f"{API}/menu/{mid}", json=payload)
    assert r.status_code == 200
    assert r.json()["menuName"] == "TEST_Menu_Updated"

    # Delete (soft)
    r = requests.delete(f"{API}/menu/{mid}")
    assert r.status_code == 200
    assert r.json()["deleted"] is True

    # Verify in list
    r = requests.get(f"{API}/menus", params={"chefUUID": chef})
    got = next((m for m in r.json() if m["menuId"] == mid), None)
    assert got is not None
    assert got.get("softDeleted") is True
    assert got.get("expirationTimestamp")


# -------- Orders --------
def test_orders_and_actions(seeded):
    chef = seeded["chefUUID"]
    r = requests.get(f"{API}/orders", params={"chefUUID": chef})
    assert r.status_code == 200
    orders = r.json()
    assert len(orders) >= 5
    today = [o for o in orders if o["bucket"] == "Today"]
    upcoming = [o for o in orders if o["bucket"] == "Upcoming"]
    completed = [o for o in orders if o["bucket"] == "Completed"]
    assert today and upcoming and completed

    oid = today[0]["orderId"]
    r = requests.post(f"{API}/orders/{oid}/accept")
    assert r.status_code == 200 and r.json()["status"] == "accepted"

    oid2 = today[1]["orderId"] if len(today) > 1 else upcoming[0]["orderId"]
    r = requests.post(f"{API}/orders/{oid2}/reject", json={"reason": "Out of stock"})
    assert r.status_code == 200 and r.json()["status"] == "rejected"

    oid3 = upcoming[0]["orderId"]
    r = requests.post(f"{API}/orders/{oid3}/request-delivery")
    assert r.status_code == 200
    d = r.json()
    assert d["deliveryMode"] == "dispatched"
    assert d["deliveryPartner"] in ("Porter", "Rapido Business")


# -------- Revenue --------
def test_revenue(seeded):
    r = requests.get(f"{API}/revenue/{seeded['chefUUID']}")
    assert r.status_code == 200
    d = r.json()
    for k in ("grossRevenue", "commission", "gst", "netPayout", "weeklyTrend", "activeSubscriptions"):
        assert k in d
    assert len(d["weeklyTrend"]) == 7
    # commission 20%, gst 18% of commission
    if d["grossRevenue"]:
        assert round(d["grossRevenue"] * 0.20, 2) == d["commission"]
        assert round(d["commission"] * 0.18, 2) == d["gst"]


# -------- Onboarding --------
def test_onboarding_flow(seeded):
    chef = seeded["newChefUUID"]
    r = requests.post(f"{API}/onboarding/prescreening", json={
        "chefUUID": chef, "city": "Visakhapatnam", "area": "MVP Colony",
        "priorExperience": True, "hasFSSAI": True, "foodTypes": [], "acceptedTerms": True,
    })
    assert r.status_code == 200

    r = requests.post(f"{API}/onboarding/personal", json={
        "chefUUID": chef, "firstName": "Rohan", "lastName": "Mehta",
        "phoneNumber": "9123456780", "email": "newchef@casafeast.com",
    })
    assert r.status_code == 200

    r = requests.post(f"{API}/onboarding/fssai", json={
        "chefUUID": chef, "fssaiLicenseNumber": "12345678901234",
        "approvedCategories": ["Home Kitchen"], "fssaiDocuments": [],
    })
    assert r.status_code == 200

    r = requests.post(f"{API}/onboarding/bank", json={
        "chefUUID": chef, "accountHolderName": "Rohan Mehta",
        "bankName": "HDFC", "accountNumber": "12345678", "ifscCode": "HDFC0001234",
    })
    assert r.status_code == 200
    assert r.json()["onboardingSubmitted"] is True

    r = requests.get(f"{API}/onboarding/status/{chef}")
    assert r.status_code == 200
    d = r.json()
    assert d["onboardingSubmitted"] is True


# -------- Admin verification --------
def test_admin_verify_and_activate(seeded):
    chef = seeded["newChefUUID"]
    # reset first
    requests.post(f"{API}/admin/reset/{chef}")
    for t in ["kyc", "bank", "field"]:
        r = requests.post(f"{API}/admin/verify/{chef}/{t}")
        assert r.status_code == 200
    r = requests.get(f"{API}/chef/{chef}")
    d = r.json()
    v = d.get("verification", {})
    assert v.get("kyc") and v.get("bank") and v.get("field")
    assert d["isActivated"] is True


def test_admin_verify_invalid_track(seeded):
    r = requests.post(f"{API}/admin/verify/{seeded['newChefUUID']}/bogus")
    assert r.status_code == 400


def test_admin_chefs_list(seeded):
    r = requests.get(f"{API}/admin/chefs")
    assert r.status_code == 200
    lst = r.json()
    emails = {c["email"] for c in lst}
    assert "demo@casafeast.com" in emails
    assert "newchef@casafeast.com" in emails


# -------- Support ticket --------
def test_support_ticket(seeded):
    r = requests.post(f"{API}/support/ticket", json={"chefUUID": seeded["chefUUID"], "message": "TEST hello"})
    assert r.status_code == 200
    assert r.json()["submitted"] is True


# -------- Upload (simulated) --------
def test_upload():
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    r = requests.post(f"{API}/upload", files=files)
    assert r.status_code == 200
    d = r.json()
    assert d["fileName"] == "test.txt"
    assert d["size"] == 11
    assert "fileId" in d and "url" in d

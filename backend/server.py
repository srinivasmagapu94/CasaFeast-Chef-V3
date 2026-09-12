from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


# ------------------------- Models -------------------------
class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    mobileNumber: str
    captchaToken: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    mobileNumber: str
    otp: str


class LoginRequest(BaseModel):
    identifier: str  # phone or email


class LoginVerifyRequest(BaseModel):
    identifier: str
    otp: str


class SupportTicketRequest(BaseModel):
    chefUUID: str
    message: str


class FoodTypeDTO(BaseModel):
    foodType: str
    chefItem: List[str] = []
    chefCuisines: List[str] = []


class PreScreeningRequest(BaseModel):
    chefUUID: str
    city: str
    area: str
    priorExperience: bool = False
    hasFSSAI: bool = False
    foodTypes: List[FoodTypeDTO] = []
    acceptedTerms: bool = False


class KitchenAddress(BaseModel):
    kitchenName: str = ""
    addressLine1: str = ""
    addressLine2: str = ""
    state: str = ""
    city: str = ""
    pincode: str = ""


class PersonalDetailsRequest(BaseModel):
    chefUUID: str
    firstName: str
    lastName: str
    phoneNumber: str
    email: str
    gender: str = ""
    maritalStatus: str = ""
    isFamilyUnit: bool = False
    aadhaarNumber: str = ""
    kitchenAddress: KitchenAddress = Field(default_factory=KitchenAddress)
    kycDocuments: List[Dict[str, Any]] = []


class FSSAIDetailsRequest(BaseModel):
    chefUUID: str
    fssaiLicenseNumber: str
    licenseStatus: str = ""
    expiryDate: str = ""
    approvedCategories: List[str] = []
    fssaiDocuments: List[Dict[str, Any]] = []


class BankDetailsRequest(BaseModel):
    chefUUID: str
    accountHolderName: str
    bankName: str
    accountNumber: str
    ifscCode: str
    passbookDocuments: List[Dict[str, Any]] = []


class DurationDTO(BaseModel):
    mealDuration: str
    price: str
    dailyVolumeLimit: str


class AddonDTO(BaseModel):
    name: str
    price: str


class MenuRequest(BaseModel):
    chefUUID: str
    menuName: str
    menuDescription: str = ""
    menuInclusions: str = ""
    priorHoursNotice: str = "24"
    isActive: bool = True
    itemTypes: List[str] = []  # Veg, Non-Veg, Jain
    isAvailableForBreakfast: bool = False
    isAvailableForLunch: bool = False
    isAvailableForDinner: bool = False
    durations: List[DurationDTO] = []
    isAddonAvailable: bool = False
    addons: List[AddonDTO] = []
    menuImageUrl: str = ""


class RejectOrderRequest(BaseModel):
    reason: str = ""


# ------------------------- Auth / Onboarding -------------------------
@api_router.get("/")
async def root():
    return {"message": "Casafeast Chef Portal API"}


@api_router.get("/validateMobileNumber/{chefMobileNumber}")
async def validate_mobile(chefMobileNumber: str):
    digits = "".join(c for c in chefMobileNumber if c.isdigit())
    is_valid = len(digits) == 10
    existing = await db.chefs.find_one({"mobileNumber": digits})
    return {
        "isMobileNumberValid": is_valid,
        "accountExists": bool(existing),
        "chefUUID": existing["chefUUID"] if existing else None,
    }


@api_router.get("/validateEmail/{chefEmail}")
async def validate_email(chefEmail: str):
    valid_format = "@" in chefEmail and "." in chefEmail.split("@")[-1]
    existing = await db.chefs.find_one({"email": chefEmail.lower()})
    return {
        "isEmailValid": valid_format,
        "accountStatus": "active" if valid_format else "invalid",
        "accountExists": bool(existing),
    }


@api_router.post("/sendOTP")
async def send_otp(payload: Dict[str, str]):
    # Simulated OTP: return a demo code, any 6 digits accepted on verify
    demo_otp = f"{random.randint(100000, 999999)}"
    return {"otpSent": True, "demoOtp": demo_otp, "expiresInSeconds": 120}


@api_router.post("/verifyOTP")
async def verify_otp(req: VerifyOTPRequest):
    if len(req.otp) != 6 or not req.otp.isdigit():
        raise HTTPException(status_code=400, detail="Invalid OTP. Enter 6 digits.")
    digits = "".join(c for c in req.mobileNumber if c.isdigit())
    chef = await db.chefs.find_one({"mobileNumber": digits})
    if not chef:
        raise HTTPException(status_code=404, detail="No pending signup for this number.")
    await db.chefs.update_one({"chefUUID": chef["chefUUID"]}, {"$set": {"mobileVerified": True}})
    return {"verified": True, "chefUUID": chef["chefUUID"]}


@api_router.post("/signup")
async def signup(req: SignupRequest):
    digits = "".join(c for c in req.mobileNumber if c.isdigit())
    existing = await db.chefs.find_one({"$or": [{"mobileNumber": digits}, {"email": req.email.lower()}]})
    if existing:
        return {"chefUUID": existing["chefUUID"], "existing": True}
    chef_uuid = str(uuid.uuid4())
    doc = {
        "chefUUID": chef_uuid,
        "firstName": req.firstName,
        "lastName": req.lastName,
        "email": req.email.lower(),
        "mobileNumber": digits,
        "mobileVerified": False,
        "emailVerified": True,
        "isActivated": False,
        "onboardingSubmitted": False,
        "verification": {"kyc": False, "bank": False, "field": False},
        "createdAt": now_iso(),
    }
    await db.chefs.insert_one(doc)
    return {"chefUUID": chef_uuid, "existing": False}


@api_router.post("/login")
async def login(req: LoginRequest):
    ident = req.identifier.strip().lower()
    digits = "".join(c for c in ident if c.isdigit())
    chef = await db.chefs.find_one({"$or": [{"email": ident}, {"mobileNumber": digits}]})
    if not chef:
        raise HTTPException(status_code=404, detail="No account found. Please sign up first.")
    demo_otp = f"{random.randint(100000, 999999)}"
    return {"otpSent": True, "demoOtp": demo_otp, "expiresInSeconds": 120, "chefUUID": chef["chefUUID"]}


@api_router.post("/loginVerify")
async def login_verify(req: LoginVerifyRequest):
    if len(req.otp) != 6 or not req.otp.isdigit():
        raise HTTPException(status_code=400, detail="Invalid OTP. Enter 6 digits.")
    ident = req.identifier.strip().lower()
    digits = "".join(c for c in ident if c.isdigit())
    chef = await db.chefs.find_one({"$or": [{"email": ident}, {"mobileNumber": digits}]})
    if not chef:
        raise HTTPException(status_code=404, detail="No account found.")
    token = str(uuid.uuid4())
    await db.chefs.update_one({"chefUUID": chef["chefUUID"]}, {"$set": {"sessionToken": token}})
    return {"token": token, "chefUUID": chef["chefUUID"]}


@api_router.get("/chef/{chefUUID}")
async def get_chef(chefUUID: str):
    chef = await db.chefs.find_one({"chefUUID": chefUUID})
    if not chef:
        raise HTTPException(status_code=404, detail="Chef not found")
    return clean(chef)


@api_router.post("/support/ticket")
async def support_ticket(req: SupportTicketRequest):
    doc = {
        "ticketId": str(uuid.uuid4()),
        "chefUUID": req.chefUUID,
        "message": req.message,
        "status": "open",
        "createdAt": now_iso(),
    }
    await db.tickets.insert_one(doc)
    return {"submitted": True, "ticketId": doc["ticketId"]}


# ------------------------- File Upload (simulated) -------------------------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    file_id = str(uuid.uuid4())
    return {
        "fileId": file_id,
        "fileName": file.filename,
        "size": len(contents),
        "url": f"/uploads/{file_id}/{file.filename}",
        "uploadedAt": now_iso(),
    }


# ------------------------- Onboarding -------------------------
@api_router.post("/onboarding/prescreening")
async def save_prescreening(req: PreScreeningRequest):
    await db.chefs.update_one(
        {"chefUUID": req.chefUUID},
        {"$set": {"chefPreScreening": req.model_dump(), "updatedAt": now_iso()}},
    )
    return {"saved": True}


@api_router.post("/onboarding/personal")
async def save_personal(req: PersonalDetailsRequest):
    await db.chefs.update_one(
        {"chefUUID": req.chefUUID},
        {"$set": {"chefPersonalDetails": req.model_dump(), "updatedAt": now_iso()}},
    )
    return {"saved": True}


@api_router.post("/onboarding/fssai")
async def save_fssai(req: FSSAIDetailsRequest):
    await db.chefs.update_one(
        {"chefUUID": req.chefUUID},
        {"$set": {"chefFSSAIDetails": req.model_dump(), "updatedAt": now_iso()}},
    )
    return {"saved": True}


@api_router.post("/onboarding/bank")
async def save_bank(req: BankDetailsRequest):
    await db.chefs.update_one(
        {"chefUUID": req.chefUUID},
        {"$set": {"chefBankDetails": req.model_dump(), "onboardingSubmitted": True, "updatedAt": now_iso()}},
    )
    return {"saved": True, "onboardingSubmitted": True}


@api_router.get("/onboarding/status/{chefUUID}")
async def onboarding_status(chefUUID: str):
    chef = await db.chefs.find_one({"chefUUID": chefUUID})
    if not chef:
        raise HTTPException(status_code=404, detail="Chef not found")
    return {
        "onboardingSubmitted": chef.get("onboardingSubmitted", False),
        "isActivated": chef.get("isActivated", False),
        "verification": chef.get("verification", {"kyc": False, "bank": False, "field": False}),
    }


# ------------------------- Menu -------------------------
@api_router.post("/menu")
async def create_menu(req: MenuRequest):
    menu_id = str(uuid.uuid4())
    imgs = [
        "https://images.unsplash.com/photo-1542367592-8849eb950fd8?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "https://images.unsplash.com/photo-1588644525273-f37b60d78512?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    ]
    doc = req.model_dump()
    doc["menuId"] = menu_id
    doc["menuImageUrl"] = req.menuImageUrl or random.choice(imgs)
    doc["expirationTimestamp"] = None
    doc["createdAt"] = now_iso()
    await db.menus.insert_one(doc)
    return clean(doc)


@api_router.get("/menus")
async def get_menus(chefUUID: str):
    menus = await db.menus.find({"chefUUID": chefUUID}).to_list(1000)
    return [clean(m) for m in menus]


@api_router.put("/menu/{menuId}")
async def update_menu(menuId: str, req: MenuRequest):
    doc = req.model_dump()
    doc["updatedAt"] = now_iso()
    await db.menus.update_one({"menuId": menuId}, {"$set": doc})
    m = await db.menus.find_one({"menuId": menuId})
    if not m:
        raise HTTPException(status_code=404, detail="Menu not found")
    return clean(m)


@api_router.patch("/menu/{menuId}/toggle")
async def toggle_menu(menuId: str):
    m = await db.menus.find_one({"menuId": menuId})
    if not m:
        raise HTTPException(status_code=404, detail="Menu not found")
    new_state = not m.get("isActive", True)
    await db.menus.update_one({"menuId": menuId}, {"$set": {"isActive": new_state}})
    return {"menuId": menuId, "isActive": new_state}


@api_router.delete("/menu/{menuId}")
async def delete_menu(menuId: str):
    exp = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.menus.update_one(
        {"menuId": menuId},
        {"$set": {"isActive": False, "expirationTimestamp": exp, "softDeleted": True}},
    )
    return {"deleted": True, "expirationTimestamp": exp}


# ------------------------- Orders -------------------------
@api_router.get("/orders")
async def get_orders(chefUUID: str, tab: Optional[str] = None):
    q: Dict[str, Any] = {"chefUUID": chefUUID}
    if tab:
        q["bucket"] = tab
    orders = await db.orders.find(q).to_list(1000)
    return [clean(o) for o in orders]


@api_router.post("/orders/{orderId}/accept")
async def accept_order(orderId: str):
    await db.orders.update_one({"orderId": orderId}, {"$set": {"status": "accepted"}})
    return {"orderId": orderId, "status": "accepted"}


@api_router.post("/orders/{orderId}/reject")
async def reject_order(orderId: str, req: RejectOrderRequest):
    await db.orders.update_one(
        {"orderId": orderId}, {"$set": {"status": "rejected", "rejectReason": req.reason}}
    )
    return {"orderId": orderId, "status": "rejected"}


@api_router.post("/orders/{orderId}/request-delivery")
async def request_delivery(orderId: str):
    partner = random.choice(["Porter", "Rapido Business"])
    await db.orders.update_one(
        {"orderId": orderId}, {"$set": {"deliveryMode": "dispatched", "deliveryPartner": partner}}
    )
    return {"orderId": orderId, "deliveryMode": "dispatched", "deliveryPartner": partner}


# ------------------------- Revenue -------------------------
@api_router.get("/revenue/{chefUUID}")
async def revenue(chefUUID: str):
    orders = await db.orders.find({"chefUUID": chefUUID}).to_list(1000)
    completed = [o for o in orders if o.get("bucket") == "Completed"]
    gross = sum(float(o.get("orderValue", 0)) for o in completed)
    commission = round(gross * 0.20, 2)
    gst = round(commission * 0.18, 2)
    net = round(gross - commission - gst, 2)
    # weekly trend
    trend = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i, d in enumerate(days):
        base = sum(float(o.get("orderValue", 0)) for o in completed if int(o.get("dayIndex", 0)) == i)
        trend.append({"day": d, "revenue": round(base, 2)})
    subs = {"Weekly 5-Days": 0, "Monthly 20-Days": 0, "Quarterly 60-Days": 0}
    for o in orders:
        pkg = o.get("subscription", "")
        if pkg in subs:
            subs[pkg] += 1
    return {
        "grossRevenue": round(gross, 2),
        "commission": commission,
        "gst": gst,
        "netPayout": net,
        "completedOrders": len(completed),
        "totalOrders": len(orders),
        "activeSubscriptions": subs,
        "weeklyTrend": trend,
    }


# ------------------------- Admin -------------------------
@api_router.get("/admin/chefs")
async def admin_chefs():
    chefs = await db.chefs.find().to_list(1000)
    return [clean(c) for c in chefs]


@api_router.post("/admin/activate/{chefUUID}")
async def admin_activate(chefUUID: str):
    await db.chefs.update_one(
        {"chefUUID": chefUUID},
        {"$set": {"isActivated": True, "verification.kyc": True, "verification.bank": True, "verification.field": True}},
    )
    return {"activated": True}


@api_router.post("/admin/verify/{chefUUID}/{track}")
async def admin_verify(chefUUID: str, track: str):
    if track not in ("kyc", "bank", "field"):
        raise HTTPException(status_code=400, detail="Invalid track")
    await db.chefs.update_one({"chefUUID": chefUUID}, {"$set": {f"verification.{track}": True}})
    chef = await db.chefs.find_one({"chefUUID": chefUUID})
    v = chef.get("verification", {})
    if v.get("kyc") and v.get("bank") and v.get("field"):
        await db.chefs.update_one({"chefUUID": chefUUID}, {"$set": {"isActivated": True}})
    return {"verified": True, "track": track}


@api_router.post("/admin/reset/{chefUUID}")
async def admin_reset(chefUUID: str):
    await db.chefs.update_one(
        {"chefUUID": chefUUID},
        {"$set": {"isActivated": False, "verification": {"kyc": False, "bank": False, "field": False}}},
    )
    return {"reset": True}


# ------------------------- Seed -------------------------
@api_router.post("/seed")
async def seed(force: bool = False):
    existing = await db.chefs.find_one({"email": "demo@casafeast.com"})
    if existing and not force:
        return {"seeded": False, "chefUUID": existing["chefUUID"], "message": "Already seeded"}
    if force:
        await db.chefs.delete_many({"email": {"$in": ["demo@casafeast.com", "newchef@casafeast.com"]}})
    chef_uuid = str(uuid.uuid4())
    chef = {
        "chefUUID": chef_uuid,
        "firstName": "Ananya",
        "lastName": "Rao",
        "email": "demo@casafeast.com",
        "mobileNumber": "9876543210",
        "mobileVerified": True,
        "emailVerified": True,
        "isActivated": True,
        "onboardingSubmitted": True,
        "verification": {"kyc": True, "bank": True, "field": True},
        "createdAt": now_iso(),
    }
    await db.chefs.insert_one(chef)

    # a fresh unactivated chef for onboarding demo
    new_uuid = str(uuid.uuid4())
    new_chef = {
        "chefUUID": new_uuid,
        "firstName": "Rohan",
        "lastName": "Mehta",
        "email": "newchef@casafeast.com",
        "mobileNumber": "9123456780",
        "mobileVerified": True,
        "emailVerified": True,
        "isActivated": False,
        "onboardingSubmitted": False,
        "verification": {"kyc": False, "bank": False, "field": False},
        "createdAt": now_iso(),
    }
    await db.chefs.insert_one(new_chef)

    await db.menus.delete_many({"chefUUID": chef_uuid})
    imgs = [
        "https://images.unsplash.com/photo-1542367592-8849eb950fd8?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "https://images.unsplash.com/photo-1588644525273-f37b60d78512?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    ]
    sample_menus = [
        {
            "menuName": "South Indian Homestyle Thali", "menuDescription": "Authentic Andhra meals with unlimited rice, sambar, rasam and 3 curries.",
            "menuInclusions": "Rice, Sambar, Rasam, 3 Curries, Curd, Pickle, Papad",
            "itemTypes": ["Veg"], "isAvailableForBreakfast": False, "isAvailableForLunch": True, "isAvailableForDinner": True,
            "durations": [{"mealDuration": "Weekly 5-Days", "price": "1500.00", "dailyVolumeLimit": "25"}, {"mealDuration": "Monthly 20-Days", "price": "5600.00", "dailyVolumeLimit": "30"}],
            "isAddonAvailable": True, "addons": [{"name": "Extra Sweet", "price": "40.00"}], "isActive": True,
        },
        {
            "menuName": "Protein Power Non-Veg Box", "menuDescription": "High-protein chicken and egg meals for fitness enthusiasts.",
            "menuInclusions": "Grilled Chicken, Brown Rice, Egg Curry, Salad",
            "itemTypes": ["Non-Veg"], "isAvailableForBreakfast": True, "isAvailableForLunch": True, "isAvailableForDinner": False,
            "durations": [{"mealDuration": "Weekly 5-Days", "price": "2200.00", "dailyVolumeLimit": "20"}], "isAddonAvailable": False, "addons": [], "isActive": True,
        },
        {
            "menuName": "Jain Special Lunch", "menuDescription": "Pure Jain meals prepared without onion & garlic.",
            "menuInclusions": "Roti, Dal, Sabzi, Rice, Kheer",
            "itemTypes": ["Jain", "Veg"], "isAvailableForBreakfast": False, "isAvailableForLunch": True, "isAvailableForDinner": False,
            "durations": [{"mealDuration": "Monthly 20-Days", "price": "5000.00", "dailyVolumeLimit": "15"}, {"mealDuration": "Quarterly 60-Days", "price": "14000.00", "dailyVolumeLimit": "15"}], "isAddonAvailable": False, "addons": [], "isActive": False,
        },
    ]
    for i, sm in enumerate(sample_menus):
        sm.update({
            "menuId": str(uuid.uuid4()), "chefUUID": chef_uuid, "priorHoursNotice": "24",
            "menuImageUrl": imgs[i % len(imgs)], "expirationTimestamp": None, "createdAt": now_iso(),
        })
        await db.menus.insert_one(sm)

    await db.orders.delete_many({"chefUUID": chef_uuid})
    buckets = ["Today", "Today", "Upcoming", "Upcoming", "Completed", "Completed", "Completed"]
    slots = ["Breakfast", "Lunch", "Dinner"]
    subs = ["Weekly 5-Days", "Monthly 20-Days", "Quarterly 60-Days"]
    customers = ["Priya Sharma", "Karthik Reddy", "Meera Nair", "Aditya Kumar", "Sneha Iyer", "Vikram Singh", "Divya Menon"]
    items = ["South Indian Thali", "Protein Box", "Jain Special", "Mini Meals Combo"]
    for i, b in enumerate(buckets):
        order = {
            "orderId": f"CF{1001 + i}", "chefUUID": chef_uuid, "bucket": b,
            "customerName": customers[i % len(customers)], "timeSlot": slots[i % len(slots)],
            "subscription": subs[i % len(subs)], "items": items[i % len(items)],
            "orderValue": [450, 620, 380, 700, 520, 480, 650][i], "dayIndex": i % 7,
            "status": "accepted" if b == "Completed" else "pending",
            "deliveryMode": "dispatched" if b == "Completed" else "pending",
            "deliveryPartner": "Porter" if b == "Completed" else "",
            "createdAt": now_iso(),
        }
        await db.orders.insert_one(order)

    return {"seeded": True, "chefUUID": chef_uuid, "newChefUUID": new_uuid}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

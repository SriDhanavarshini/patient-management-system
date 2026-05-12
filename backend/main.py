from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from supabase import create_client, Client
from typing import Optional
from dotenv import load_dotenv
import os
import jwt
from jwt import PyJWKClient

# ─────────────────────────────────────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────────────────────────────────────

# ✅ Load .env FIRST before anything else
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # ✅ matches your .env
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

app = FastAPI(title="MediCore Doctor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
    max_age=86400,
)

# ✅ Now create client AFTER variables are defined
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

bearer_scheme = HTTPBearer()

# ─────────────────────────────────────────────────────────────────────────────
# JWT VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ROLE-BASED ACCESS CONTROL
# ─────────────────────────────────────────────────────────────────────────────
def require_doctor(payload: dict = Depends(verify_jwt)):
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user id in token")
    resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=403, detail="Access denied. Doctor profile not found.")
    return payload


def require_admin(payload: dict = Depends(verify_jwt)):
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user id in token")
    resp = supabase.table("admins").select("id").eq("id", user_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=403, detail="Access denied. Admin profile not found.")
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────────
class HistoryCreate(BaseModel):
    patient_id: str
    doctor_id: str
    diagnosis: str
    prescription: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("diagnosis")
    @classmethod
    def diagnosis_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Diagnosis cannot be empty")
        return v.strip()

    @field_validator("patient_id", "doctor_id")
    @classmethod
    def ids_not_empty(cls, v):
        if not v.strip():
            raise ValueError("ID cannot be empty")
        return v.strip()


class HistoryUpdate(BaseModel):
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None

class HistoryCreateDoctor(BaseModel):
    diagnosis: str
    prescription: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("diagnosis")
    @classmethod
    def diagnosis_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Diagnosis cannot be empty")
        return v.strip()


class DiagnosisRequest(BaseModel):
    symptoms: str

    @field_validator("symptoms")
    @classmethod
    def symptoms_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Symptoms cannot be empty")
        return v.strip()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "MediCore API is running", "status": "ok"}


@app.get("/auth/me")
def get_me(payload: dict = Depends(verify_jwt)):
    return {
        "user_id": payload.get("sub"),
        "email":   payload.get("email"),
        "role":    payload.get("user_metadata", {}).get("role"),
        "message": "Token is valid ✓"
    }

@app.get("/doctor/me/patients")
def get_my_patients(payload: dict = Depends(require_doctor)):
    user_id = payload.get("sub")
    doctor_resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    doctor_data = doctor_resp.data
    if not doctor_data:
        return {"patients": [], "count": 0}
    doctor_id = doctor_data.get("id")
    response = (
        supabase.table("patients")
        .select("id,name,age,gender,phone,email,blood_group,medical_history,status,created_at,doctor_id")
        .eq("doctor_id", doctor_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"patients": response.data or [], "count": len(response.data or [])}

@app.get("/doctor/me/patients/no-history")
def get_my_patients_no_history(payload: dict = Depends(require_doctor)):
    user_id = payload.get("sub")
    doctor_resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    doctor_data = doctor_resp.data
    if not doctor_data:
        return {"patients": [], "count": 0}
    doctor_id = doctor_data.get("id")
    patients_resp = (
        supabase.table("patients")
        .select("id,name,age,gender,phone,email,blood_group,medical_history,status,created_at,doctor_id")
        .eq("doctor_id", doctor_id)
        .order("created_at", desc=True)
        .execute()
    )
    patients = patients_resp.data or []
    if not patients:
        return {"patients": [], "count": 0}
    patient_ids = [p.get("id") for p in patients if p.get("id")]
    history_resp = (
        supabase.table("patient_history")
        .select("patient_id")
        .eq("doctor_id", doctor_id)
        .in_("patient_id", patient_ids)
        .execute()
    )
    has_history_ids = {row.get("patient_id") for row in (history_resp.data or []) if row.get("patient_id")}
    no_history = [p for p in patients if p.get("id") not in has_history_ids]
    return {"patients": no_history, "count": len(no_history)}

@app.get("/doctor/me/history")
def get_my_history(payload: dict = Depends(require_doctor)):
    user_id = payload.get("sub")
    doctor_resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    doctor_data = doctor_resp.data
    if not doctor_data:
        return {"records": [], "count": 0}
    doctor_id = doctor_data.get("id")
    history_resp = (
        supabase.table("patient_history")
        .select("id,patient_id,diagnosis,prescription,notes,created_at,doctor_id")
        .eq("doctor_id", doctor_id)
        .order("created_at", desc=True)
        .execute()
    )
    history_rows = history_resp.data or []
    if not history_rows:
        return {"records": [], "count": 0}
    patient_ids = list({r.get("patient_id") for r in history_rows if r.get("patient_id")})
    patients_resp = supabase.table("patients").select("id,name,status").in_("id", patient_ids).execute()
    patient_map = {p.get("id"): p for p in (patients_resp.data or []) if p.get("id")}
    records = []
    for r in history_rows:
        p = patient_map.get(r.get("patient_id")) or {}
        records.append({
            "id": r.get("id"),
            "patientId": r.get("patient_id"),
            "patientName": p.get("name"),
            "status": p.get("status"),
            "diagnosis": r.get("diagnosis"),
            "prescription": r.get("prescription"),
            "notes": r.get("notes"),
            "created_at": r.get("created_at"),
        })
    return {"records": records, "count": len(records)}


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str, payload: dict = Depends(require_doctor)):
    user_id = payload.get("sub")
    doctor_resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    if not doctor_resp.data:
        raise HTTPException(status_code=403, detail="Doctor profile not found")
    doctor_id = doctor_resp.data["id"]
    response = supabase.table("patients").select("*").eq("id", patient_id).eq("doctor_id", doctor_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Patient not found or access denied")
    return {"patient": response.data}

@app.get("/patients/{patient_id}/history")
def get_history(patient_id: str, payload: dict = Depends(require_doctor)):
    user_id = payload.get("sub")
    doctor_resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    if not doctor_resp.data:
        raise HTTPException(status_code=403, detail="Doctor profile not found")
    doctor_id = doctor_resp.data["id"]
    response = (
        supabase.table("patient_history")
        .select("id,diagnosis,prescription,notes,created_at,doctor_id")
        .eq("patient_id", patient_id)
        .eq("doctor_id", doctor_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"history": response.data or [], "count": len(response.data or [])}


@app.post("/patients/{patient_id}/history", status_code=201)
def add_history_for_patient(patient_id: str, body: HistoryCreateDoctor, payload: dict = Depends(require_doctor)):
    user_id = payload.get("sub")
    doctor_resp = supabase.table("doctors").select("id").eq("user_id", user_id).single().execute()
    if not doctor_resp.data:
        raise HTTPException(status_code=403, detail="Doctor profile not found")
    doctor_id = doctor_resp.data["id"]
    patient_resp = supabase.table("patients").select("id").eq("id", patient_id).eq("doctor_id", doctor_id).single().execute()
    if not patient_resp.data:
        raise HTTPException(status_code=404, detail="Patient not found or access denied")
    response = supabase.table("patient_history").insert({
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "diagnosis": body.diagnosis,
        "prescription": body.prescription,
        "notes": body.notes,
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to save record")
    return {"message": "Record saved", "record": response.data[0]}


@app.post("/patients/history", status_code=201)
def add_history(body: HistoryCreate, payload: dict = Depends(require_doctor)):
    response = supabase.table("patient_history").insert({
        "patient_id":   body.patient_id,
        "doctor_id":    body.doctor_id,
        "diagnosis":    body.diagnosis,
        "prescription": body.prescription,
        "notes":        body.notes,
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to save record")
    return {"message": "Record saved", "record": response.data[0]}


@app.put("/patients/history/{history_id}")
def update_history(history_id: str, body: HistoryUpdate, payload: dict = Depends(require_doctor)):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    response = supabase.table("patient_history").update(update_data).eq("id", history_id).execute()
    return {"message": "Record updated", "record": response.data[0] if response.data else {}}


@app.delete("/patients/history/{history_id}")
def delete_history(history_id: str, payload: dict = Depends(require_doctor)):
    supabase.table("patient_history").delete().eq("id", history_id).execute()
    return {"message": "Record deleted"}


@app.post("/suggest-diagnosis")
def suggest_diagnosis(body: DiagnosisRequest, payload: dict = Depends(require_doctor)):
    symptoms = body.symptoms.lower()
    rules = [
        (["fever", "cough", "cold", "runny nose"],           "Common Cold / Viral Fever",      "Paracetamol 500mg, rest, fluids"),
        (["fever", "headache", "body ache", "fatigue"],      "Influenza (Flu)",                 "Oseltamivir, rest, hydration"),
        (["chest pain", "breathlessness", "shortness"],      "Possible Cardiac issue",          "Urgent evaluation needed"),
        (["fever", "rash", "joint pain"],                    "Possible Dengue / Chikungunya",   "CBC test, rest, paracetamol"),
        (["stomach pain", "vomiting", "nausea", "diarrhea"], "Gastroenteritis",                 "ORS, light diet, probiotics"),
        (["headache", "nausea", "light sensitivity"],        "Migraine",                        "Sumatriptan / dark room rest"),
        (["cough", "breathlessness", "wheezing"],            "Asthma / Bronchitis",             "Bronchodilator, inhaler"),
        (["frequent urination", "thirst", "fatigue"],        "Possible Diabetes",               "Blood sugar test"),
        (["burning urination", "lower abdomen pain"],        "UTI",                             "Nitrofurantoin / Ciprofloxacin"),
        (["back pain", "stiffness", "joint pain"],           "Musculoskeletal / Arthritis",     "Ibuprofen, physiotherapy"),
    ]
    matches = [
        {"diagnosis": d, "suggested_prescription": p}
        for keywords, d, p in rules
        if any(kw in symptoms for kw in keywords)
    ]
    return {"suggestions": matches[:3], "note": "Suggestions only. Clinical judgment takes priority."}


@app.get("/admin/stats")
def admin_stats(payload: dict = Depends(require_admin)):
    patients = supabase.table("patients").select("id", count="exact").execute()
    doctors  = supabase.table("doctors").select("id", count="exact").execute()
    history  = supabase.table("patient_history").select("id", count="exact").execute()
    return {
        "total_patients":        patients.count,
        "total_doctors":         doctors.count,
        "total_history_records": history.count,
    }
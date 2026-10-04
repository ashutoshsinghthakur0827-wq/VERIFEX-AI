
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database
from app.database.connection import Base, engine
from app.database import models

# API routes
from app.api.routes.auth import router as auth_router
from app.api.routes import intake
from app.api.routes import claims
from app.api.routes import research
from app.api.routes import evidence
from app.api.routes import verification
from app.api.routes.report import router as report_router


# CORS configuration
# Set FRONTEND_URL in Render to your actual Vercel domain.
VERCEL_URL = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if VERCEL_URL:
    allowed_origins.append(VERCEL_URL)


# Initialize FastAPI application
app = FastAPI(
    title="Verifex AI API",
    description=(
        "Evidence-grounded verification platform "
        "powered by AI agents."
    ),
    version="1.0.0",
)


# CORS middleware for React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
# Ensure DATABASE_URL is correctly configured in Render.
@app.on_event("startup")
def create_database_tables():
    Base.metadata.create_all(bind=engine)


# Register API routers
app.include_router(auth_router)
app.include_router(intake.router)
app.include_router(claims.router)
app.include_router(research.router)
app.include_router(evidence.router)
app.include_router(verification.router)
app.include_router(report_router)


# Root endpoint
@app.get("/")
def home():
    return {
        "message": "Verifex AI API is running",
        "version": "1.0.0",
    }


# Health-check endpoint
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "Verifex AI API",
    }

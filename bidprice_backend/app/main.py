from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from datetime import datetime, timedelta
import asyncio
import os
import secrets
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker

from app.routers import auth, users, products, bids, payments, admin
from app.db_config import Base, engine, get_db, SessionLocal
from app.models import Product, User
from app.auth import get_password_hash
import uuid

security = HTTPBasic()

def verify_basic_auth(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = "devin"
    correct_password = "integration"
    is_correct_username = secrets.compare_digest(credentials.username, correct_username)
    is_correct_password = secrets.compare_digest(credentials.password, correct_password)
    if not (is_correct_username and is_correct_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    return True


app = FastAPI(title="BidPrice API", description="API for BidPrice auction platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://online-auction-app-actogcdb.devinapps.com",  # Production frontend
        "http://localhost:5173",  # Development frontend
        "http://localhost:3000",  # Allow local frontend
        "https://bidprice.gr",    # Domain
        "*"                       # Allow all origins temporarily for testing
    ],
    allow_credentials=True,  # Allow credentials with specific origins
    allow_methods=["*"],     # Allows all methods
    allow_headers=["*"],     # Allows all headers
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(bids.router)
app.include_router(payments.router)
app.include_router(admin.router)

UPLOAD_DIR_DEV = 'uploads'
UPLOAD_DIR_PROD = '/app/data/uploads'

is_production = os.getenv("FLY_APP_NAME") is not None
UPLOAD_DIR = UPLOAD_DIR_PROD if is_production else UPLOAD_DIR_DEV

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    if is_production:
        os.makedirs(UPLOAD_DIR_PROD, exist_ok=True)
    else:
        os.makedirs(UPLOAD_DIR_DEV, exist_ok=True)
    
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if not existing_user:
            new_user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                username="test_user",
                hashed_password=get_password_hash("password123"),
                is_admin=False
            )
            db.add(new_user)
            db.commit()
            print(f"Created test user: test_user with email: test@example.com")
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()
    
    asyncio.create_task(check_expired_auctions())

async def check_expired_auctions():
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    while True:
        db = SessionLocal()
        try:
            now = datetime.now()
            expired_products = (
                db.query(Product)
                .filter(Product.is_active == True)
                .filter(Product.auction_end_date < now)
                .all()
            )
            
            for product in expired_products:
                product.is_active = False
                print(f"Auction ended for product {product.id}: {product.title}")
            
            db.commit()
        except Exception as e:
            print(f"Error checking expired auctions: {e}")
            db.rollback()
        finally:
            db.close()
        
        await asyncio.sleep(60)

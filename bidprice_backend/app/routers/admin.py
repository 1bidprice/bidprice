from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db_config import get_db
from app.models import User
from app.auth import get_password_hash
import uuid

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

@router.post("/create-test-user", status_code=status.HTTP_201_CREATED)
def create_test_user(db: Session = Depends(get_db)):
    """Create a test user for development and testing purposes."""
    existing_user = db.query(User).filter(User.email == "test@example.com").first()
    if existing_user:
        return {"message": f"Test user already exists: {existing_user.username} with email: {existing_user.email}"}
    
    new_user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        username="test_user",
        hashed_password=get_password_hash("password123"),
        is_admin=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": f"Created test user: {new_user.username} with email: {new_user.email}"}

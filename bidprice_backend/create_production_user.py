from app.models import User
from app.auth import get_password_hash
from app.db_config import SessionLocal
import uuid

def create_test_user():
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print(f"Test user already exists: {existing_user.username} with email: {existing_user.email}")
            return existing_user
        
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
        
        print(f"Created test user: {new_user.username} with email: {new_user.email}")
        return new_user
    except Exception as e:
        db.rollback()
        print(f"Error creating test user: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()

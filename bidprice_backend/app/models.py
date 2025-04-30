from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, validator
import uuid
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship

from app.db_config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    is_admin = Column(Boolean, default=False)

    products = relationship("Product", back_populates="seller")
    bids = relationship("Bid", back_populates="bidder")
    purchases = relationship("Transaction", foreign_keys="[Transaction.buyer_id]", back_populates="buyer")
    sales = relationship("Transaction", foreign_keys="[Transaction.seller_id]", back_populates="seller")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True)
    description = Column(Text)
    starting_price = Column(Float)
    auction_end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)
    seller_id = Column(String, ForeignKey("users.id"))
    image_url = Column(String, nullable=True)  # New field for product images

    seller = relationship("User", back_populates="products")
    bids = relationship("Bid", back_populates="product")
    transactions = relationship("Transaction", back_populates="product")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.now)
    bidder_id = Column(String, ForeignKey("users.id"))
    product_id = Column(String, ForeignKey("products.id"))

    bidder = relationship("User", back_populates="bids")
    product = relationship("Product", back_populates="bids")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # pending, completed, failed, refunded
    payment_method = Column(String, nullable=False)  # credit_card, bank_transfer, paypal
    payment_processor = Column(String, nullable=False)  # stripe, vivawallet, paypal
    transaction_fee = Column(Float, default=0.0)
    product_id = Column(String, ForeignKey("products.id"))
    buyer_id = Column(String, ForeignKey("users.id"))
    seller_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    product = relationship("Product", back_populates="transactions")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="purchases")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="sales")

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    created_at: datetime
    is_admin: bool = False

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backward compatibility

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_admin: bool = False

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backward compatibility

class ProductBase(BaseModel):
    title: str
    description: str
    starting_price: float
    
    @validator('starting_price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v

class ProductCreate(ProductBase):
    auction_end_date: datetime
    
    @validator('auction_end_date')
    def end_date_must_be_future(cls, v):
        if v.tzinfo is not None:
            v = v.replace(tzinfo=None)
        if v <= datetime.now():
            raise ValueError('Auction end date must be in the future')
        return v

class ProductResponse(ProductBase):
    id: str
    seller_id: str
    auction_end_date: datetime
    created_at: datetime
    is_active: bool
    image_url: Optional[str] = None
    current_highest_bid: Optional[float] = None
    current_highest_bidder_id: Optional[str] = None

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backward compatibility

class BidBase(BaseModel):
    amount: float
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Bid amount must be positive')
        return v

class BidCreate(BidBase):
    product_id: str

class BidResponse(BidBase):
    id: str
    bidder_id: str
    product_id: str
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backward compatibility

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class TransactionBase(BaseModel):
    amount: float
    payment_method: str
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Transaction amount must be positive')
        return v

class TransactionCreate(TransactionBase):
    product_id: str

class TransactionResponse(TransactionBase):
    id: str
    status: str
    payment_processor: str
    transaction_fee: float
    product_id: str
    buyer_id: str
    seller_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backward compatibility

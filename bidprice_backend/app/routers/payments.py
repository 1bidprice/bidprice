from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import User, Product, Bid, Transaction, TransactionCreate, TransactionResponse, UserResponse
from app.db_config import get_db
from app.auth import get_current_active_user

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    transaction_data: TransactionCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == transaction_data.product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Προϊόν δεν βρέθηκε"
        )
    
    if product.auction_end_date > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Η δημοπρασία είναι ακόμα ενεργή"
        )
    
    highest_bid = db.query(Bid).filter(
        Bid.product_id == product.id
    ).order_by(desc(Bid.amount)).first()
    
    if not highest_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Δεν υπάρχουν προσφορές για αυτό το προϊόν"
        )
    
    if highest_bid.bidder_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Μόνο ο υψηλότερος πλειοδότης μπορεί να κάνει πληρωμή"
        )
    
    existing_transaction = db.query(Transaction).filter(
        Transaction.product_id == transaction_data.product_id,
        Transaction.buyer_id == current_user.id
    ).first()
    
    if existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Υπάρχει ήδη πληρωμή για αυτή τη δημοπρασία"
        )
    
    transaction_fee = highest_bid.amount * 0.05  # 5% platform fee
    
    new_transaction = Transaction(
        amount=highest_bid.amount,
        status="pending",
        payment_method=transaction_data.payment_method,
        payment_processor="viva_wallet",  # Default payment processor for Greek market
        transaction_fee=transaction_fee,
        product_id=transaction_data.product_id,
        buyer_id=current_user.id,
        seller_id=product.seller_id
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    
    return new_transaction

@router.get("/user/purchases", response_model=List[TransactionResponse])
async def get_user_purchases(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(Transaction.buyer_id == current_user.id).all()
    return transactions

@router.get("/user/sales", response_model=List[TransactionResponse])
async def get_user_sales(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(Transaction.seller_id == current_user.id).all()
    return transactions

@router.put("/{transaction_id}/complete", response_model=TransactionResponse)
async def complete_payment(
    transaction_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Συναλλαγή δεν βρέθηκε"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Μόνο ο αγοραστής μπορεί να ολοκληρώσει αυτή τη συναλλαγή"
        )
    
    if transaction.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Η συναλλαγή είναι ήδη σε κατάσταση {transaction.status}"
        )
    
    transaction.status = "completed"
    db.commit()
    db.refresh(transaction)
    
    return transaction

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Συναλλαγή δεν βρέθηκε"
        )
    
    if (transaction.buyer_id != current_user.id and 
        transaction.seller_id != current_user.id and 
        not current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Δεν έχετε πρόσβαση σε αυτή τη συναλλαγή"
        )
    
    return transaction

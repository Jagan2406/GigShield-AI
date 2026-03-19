from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20))
    plan = db.Column(db.String(20))
    city = db.Column(db.String(50))

class Claim(db.Model):
    __tablename__ = "claims"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.String(120), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    trigger_type = db.Column(db.String(100), nullable=False)
    payout = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120))
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime)
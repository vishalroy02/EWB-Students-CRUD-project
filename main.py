
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, get_db
from models import Student
from schemas import StudentCreate, StudentUpdate, StudentResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Students Database CRUD API",
    description="EWB Internship Project - Python Backend Development",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    
allow_origins=[
    "https://ewb-students-crud-project-frontend.vercel.app",
        "https://ewb-students-crud-project.vercel.app",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],

    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def home():
    return {
        "message": "Students CRUD API is running",
        "docs": "/docs"
    }


@app.post(
    "/students",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db)
):
    student = Student(**student_data.model_dump())

    db.add(student)

    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A student with this email already exists"
        )

    return student


@app.get("/students", response_model=list[StudentResponse])
def get_students(
    name: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if name:
        query = query.filter(Student.name.ilike(f"%{name}%"))

    return query.order_by(Student.id).all()


@app.get("/students/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


@app.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    updates = student_data.model_dump(exclude_unset=True)

    if any(value is None for value in updates.values()):
        raise HTTPException(
            status_code=422,
            detail="Fields cannot be null; omit fields you do not want to change"
        )

    for field, value in updates.items():
        setattr(student, field, value)

    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A student with this email already exists"
        )

    return student


@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully", "id": student_id}

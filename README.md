# Student Management System

A Student Management CRUD Web Application developed as part of the EWB Edu Tech Pvt. Ltd. internship assignment using Python, FastAPI, SQLite, HTML, CSS, and JavaScript.

## Features

- Add new student records
- View all students and individual student details
- Search students by name
- Update student information
- Delete student records
- Input validation and duplicate email prevention
- Persistent data storage using SQLite
- Interactive and responsive web interface

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, FastAPI
- **Database:** SQLite
- **ORM:** SQLAlchemy
- **Server:** Uvicorn
- **API Testing:** Swagger UI

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/students` | Create a student |
| GET | `/students` | Retrieve all students |
| GET | `/students/{student_id}` | Retrieve a student by ID |
| PUT | `/students/{student_id}` | Update student details |
| DELETE | `/students/{student_id}` | Delete a student |

## Database

SQLite stores student information, including student ID, name, date of birth, email, phone number, course, and address. The database table is created automatically when the backend starts.

## Future Enhancements

- User authentication and authorization
- Advanced search and pagination
- Online deployment
- Optional AI integration using Ollama

## Security

- Do not upload database files containing personal information.
- Do not commit passwords, API keys, or other secrets.
- Use dummy student records for testing.

## Project Status

The core Student CRUD application is implemented. The optional AI extension is not included.

## Author

Developed as part of the EWB Edu Tech Pvt. Ltd. Internship Program.

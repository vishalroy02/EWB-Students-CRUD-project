
const API_URL = "http://127.0.0.1:8000";

const form = document.getElementById("studentForm");
const formPanel = document.getElementById("formPanel");
const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");
const tableBody = document.getElementById("studentsTable");
const searchInput = document.getElementById("searchInput");
const messageBox = document.getElementById("message");

let editingId = null;
let messageTimer;

function showMessage(message, type = "success") {
    clearTimeout(messageTimer);
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.hidden = false;

    messageTimer = setTimeout(() => {
        messageBox.hidden = true;
    }, 5000);
}

async function apiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });
    } catch {
        throw new Error(
            "Unable to connect to the backend. Please check whether the FastAPI server is running."
        );
    }

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;

        try {
            const data = await response.json();

            if (Array.isArray(data.detail)) {
                errorMessage = data.detail
                    .map(item => `${item.loc?.slice(-1)[0] || "Field"}: ${item.msg}`)
                    .join(", ");
            } else if (typeof data.detail === "string") {
                errorMessage = data.detail;
            }
        } catch {
            
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) return null;
    return response.json();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "—";

    const parts = value.split("-");
    if (parts.length !== 3) return value;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


async function loadStudents(search = "") {
    tableBody.innerHTML = `
        <tr><td colspan="6" class="empty">Loading students...</td></tr>
    `;

    try {
        let students;
        const query = search.trim();

        if (query && /^\d+$/.test(query)) {
            // Search by numeric Student ID
            try {
                const student = await apiRequest(`/students/${query}`);
                students = [student];
            } catch (error) {
                if (error.message.includes("(404)")) {
                    students = [];
                } else {
                    throw error;
                }
            }
        } else {
            // Search by student name
            const path = query
                ? `/students?name=${encodeURIComponent(query)}`
                : "/students";

            students = await apiRequest(path);
        }

        renderStudents(students);
        updateStats(students);

    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        document.getElementById("totalStudents").textContent = "—";
        document.getElementById("totalCourses").textContent = "—";
        document.getElementById("recordCount").textContent = "Unable to load";
    }
}

function renderStudents(students) {
    document.getElementById("recordCount").textContent =
        `${students.length} record${students.length === 1 ? "" : "s"}`;

    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr><td colspan="6" class="empty">
                No students found. Add a new student to get started.
            </td></tr>
        `;
        return;
    }

    tableBody.innerHTML = students.map(student => `
        <tr>
            <td>#${escapeHTML(student.id)}</td>
            <td>
                <div class="student-name">${escapeHTML(student.name)}</div>
                <div class="student-email">${escapeHTML(student.email)}</div>
            </td>
            <td>${escapeHTML(formatDate(student.date_of_birth))}</td>
            <td>${escapeHTML(student.phone || "—")}</td>
            <td>
                <span class="course-badge">
                    ${escapeHTML(student.course || "Not specified")}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="action-btn edit-btn"
                        data-action="edit" data-id="${student.id}">
                        Edit
                    </button>
                    <button class="action-btn delete-btn"
                        data-action="delete" data-id="${student.id}">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function updateStats(students) {
    document.getElementById("totalStudents").textContent = students.length;

    const courses = new Set(
        students.map(student => student.course?.trim())
            .filter(Boolean)
    );

    document.getElementById("totalCourses").textContent = courses.size;
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Add New Student";
    saveBtn.textContent = "Save Student";
    saveBtn.disabled = false;
}


function openAddForm() {
    resetForm();
    formPanel.classList.add("form-visible");

    formPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("name").focus();
}

async function editStudent(id) {
    try {
        const student = await apiRequest(`/students/${id}`);

        editingId = id;

        for (const field of [
            "name", "date_of_birth", "email",
            "phone", "course", "address"
        ]) {
            document.getElementById(field).value = student[field] ?? "";
        }
        formPanel.classList.add("form-visible");
        formTitle.textContent = `Edit Student #${id}`;
        saveBtn.textContent = "Update Student";
        formPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function deleteStudent(id) {
    const confirmed = confirm(
        `Are you sure you want to delete student #${id}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
        await apiRequest(`/students/${id}`, {
            method: "DELETE"
        });

        if (editingId === id) resetForm();

        showMessage("Student deleted successfully.");
        await loadStudents(searchInput.value);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

tableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    if (!Number.isInteger(id) || id <= 0) return;

    if (button.dataset.action === "edit") editStudent(id);
    if (button.dataset.action === "delete") deleteStudent(id);
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    for (const field of ["phone", "course", "address"]) {
    if (data[field] === "") {
        delete data[field];
    }
}

    for (const key of Object.keys(data)) {
        data[key] = data[key].trim();
        if (data[key] === "") data[key] = null;
    }

    if (!data.name || !data.date_of_birth || !data.email) {
        showMessage("Name, date of birth and email are required.", "error");
        return;
    }

    if (data.date_of_birth > new Date().toISOString().slice(0, 10)) {
        showMessage("Date of birth cannot be in the future.", "error");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? "Updating..." : "Saving...";

    try {
        if (editingId !== null) {
            await apiRequest(`/students/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(data)
            });

            showMessage("Student updated successfully.");
        } else {
            await apiRequest("/students", {
                method: "POST",
                body: JSON.stringify(data)
            });

            showMessage("Student added successfully.");
        }

        resetForm();
        await loadStudents(searchInput.value);

    } catch (error) {
        showMessage(error.message, "error");
        saveBtn.disabled = false;
        saveBtn.textContent = editingId ? "Update Student" : "Save Student";
    }
});

document.getElementById("addNewBtn").addEventListener("click", openAddForm);


document.getElementById("cancelBtn").addEventListener("click", () => {
    resetForm();
    formPanel.classList.remove("form-visible");
});


document.getElementById("resetBtn").addEventListener("click", () => {
    resetForm();
});

document.getElementById("refreshBtn").addEventListener("click", () => {
    loadStudents(searchInput.value);
});

let searchTimer;

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadStudents(searchInput.value);
    }, 300);
});

loadStudents();

/* =====================================================
   RETAILFLOW PRO
   COMPLETE WORKFORCE MANAGEMENT SYSTEM
   Compatible with updated RetailFlow HTML
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. DATABASE
    // =====================================================

    const KEY = "retailflow_pro_database";

    const initialData = {
        employees: [
            {
                id: "EMP001",
                name: "Rahul Sharma",
                email: "rahul@example.com",
                phone: "9876543210",
                department: "Sales",
                position: "Sales Manager",
                joiningDate: "2026-01-10",
                salary: 35000,
                status: "Active"
            },
            {
                id: "EMP002",
                name: "Priya Verma",
                email: "priya@example.com",
                phone: "9876543211",
                department: "Human Resources",
                position: "HR Executive",
                joiningDate: "2026-02-15",
                salary: 30000,
                status: "Active"
            },
            {
                id: "EMP003",
                name: "Aman Singh",
                email: "aman@example.com",
                phone: "9876543212",
                department: "Inventory",
                position: "Supervisor",
                joiningDate: "2026-03-01",
                salary: 28000,
                status: "Active"
            }
        ],
        departments: [
            { name: "Sales", manager: "Rahul Sharma" },
            { name: "Human Resources", manager: "Priya Verma" },
            { name: "Inventory", manager: "Aman Singh" },
            { name: "Marketing", manager: "Not Assigned" },
            { name: "Customer Support", manager: "Not Assigned" },
            { name: "Finance", manager: "Not Assigned" }
        ],
        shifts: [],
        attendance: [],
        leaves: [],
        tasks: [],
        performance: [],
        overtime: [],
        recruitment: [],
        notifications: [],
        salaries: [],
        settings: {
            company: "Retail Store",
            currency: "INR"
        },
        profile: {
            name: "Admin",
            email: "admin@retailflow.com",
            phone: "",
            role: "Administrator"
        }
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function loadData() {
        try {
            const saved = localStorage.getItem(KEY);

            if (!saved) return clone(initialData);

            const data = JSON.parse(saved);

            Object.keys(initialData).forEach(key => {
                if (data[key] === undefined) {
                    data[key] = clone(initialData[key]);
                }
            });

            return data;
        } catch (error) {
            console.error("Database loading error:", error);
            return clone(initialData);
        }
    }

    let db = loadData();

    function saveData() {
        try {
            localStorage.setItem(KEY, JSON.stringify(db));
            updateDashboard();
        } catch (error) {
            console.error("Saving error:", error);
            alert("Unable to save data. Browser storage may be full.");
        }
    }

    // =====================================================
    // 2. HELPER FUNCTIONS
    // =====================================================

    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];

    function getToday() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }

    function newId(prefix) {
        return prefix + Date.now().toString(36).toUpperCase() +
            Math.random().toString(36).slice(2, 5).toUpperCase();
    }

    function safe(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function money(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: db.settings.currency || "INR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function timeNow() {
        return new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function message(title, description) {
        db.notifications.unshift({
            id: newId("NOT"),
            title,
            description,
            date: new Date().toLocaleString(),
            read: false
        });

        db.notifications = db.notifications.slice(0, 100);
        saveData();
        renderNotifications();
    }

    function badge(status) {
        const colors = {
            Active: "#dcf8ec",
            Present: "#dcf8ec",
            Approved: "#dcf8ec",
            Completed: "#dcf8ec",
            Pending: "#fff0d9",
            Applied: "#e9efff",
            Shortlisted: "#eee6ff",
            Interview: "#e5f5ff",
            Selected: "#dcf8ec",
            Rejected: "#ffe5e8",
            Absent: "#ffe5e8",
            Inactive: "#eeeaff"
        };

        return `<span class="status" style="background:${colors[status] || "#eeeaff"}">
        ${safe(status)}
    </span>`;
    }

    function showEmpty(text) {
        return `<div style="padding:30px;text-align:center;color:#999">
        <div style="font-size:35px">📭</div>
        ${safe(text)}
    </div>`;
    }

    function makeTable(headers, rows) {
        return `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
                </thead>
                <tbody>${rows || ""}</tbody>
            </table>
        </div>`;
    }

    function employeeByInput(value) {
        const query = String(value || "").trim().toLowerCase();

        return db.employees.find(e =>
            e.id.toLowerCase() === query ||
            e.name.toLowerCase() === query
        );
    }

    function container(id) {
        return document.getElementById(id);
    }

    function setContent(id, html) {
        const el = container(id);
        if (el) el.innerHTML = html;
    }

    // =====================================================
    // 3. NAVIGATION - ALL MODULES
    // =====================================================

    function openPage(id) {
        const page = container(id);

        if (!page || !page.classList.contains("page-section")) {
            console.warn("Page not found:", id);
            return;
        }

        $$(".page-section").forEach(p => p.classList.add("hidden"));
        page.classList.remove("hidden");

        $$(".menu-item").forEach(item => {
            item.classList.toggle("active", item.dataset.page === id);
        });

        const menu = $(`.menu-item[data-page="${id}"]`);
        const title = menu?.querySelector("span")?.textContent ||
            page.querySelector("h2")?.textContent ||
            "Dashboard";

        const titleElement = $("#pageTitle");
        if (titleElement) titleElement.textContent = title;

        $(".sidebar")?.classList.remove("open");

        renderPage(id);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.addEventListener("click", event => {
        const link = event.target.closest("[data-page]");
        if (!link) return;

        event.preventDefault();
        openPage(link.dataset.page);
    });

    $("#sidebarToggle")?.addEventListener("click", () => {
        $(".sidebar")?.classList.toggle("open");
    });

    $("#notificationBtn")?.addEventListener("click", () => {
        openPage("notifications");
    });

    // =====================================================
    // 4. DASHBOARD
    // =====================================================

    function updateDashboard() {
        const activeEmployees = db.employees.filter(
            e => e.status === "Active"
        );

        const todayRecords = db.attendance.filter(
            a => a.date === getToday()
        );

        const present = todayRecords.filter(
            a => a.status === "Present"
        ).length;

        const onLeave = db.leaves.filter(l =>
            l.status === "Approved" &&
            getToday() >= l.from &&
            getToday() <= l.to
        ).length;

        const shifts = db.shifts.filter(s => s.date === getToday());

        const updateText = (selector, value) => {
            const element = $(selector);
            if (element) element.textContent = value;
        };

        updateText("#totalEmployees", activeEmployees.length);
        updateText("#presentEmployees", present);
        updateText("#onLeave", onLeave);
        updateText("#activeShifts", shifts.length);
        updateText("#employeeTotal", db.employees.length);
        updateText("#presentCount", present);
        updateText("#absentCount", Math.max(0, activeEmployees.length - present));

        renderRecentEmployees();
        renderDashboardShifts();
        renderDashboardAttendance();
        updateNotificationBadge();
    }

    function renderRecentEmployees() {
        const tbody = $("#recentEmployees");
        if (!tbody) return;

        tbody.innerHTML = db.employees.slice(-5).reverse().map(e => `
        <tr>
            <td>
                <div class="employee-info">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}"
                    alt="">
                    <span>${safe(e.name)}</span>
                </div>
            </td>
            <td>${safe(e.department)}</td>
            <td>${safe(e.position)}</td>
            <td>${badge(e.status)}</td>
        </tr>
    `).join("") || `<tr><td colspan="4">No employees found</td></tr>`;
    }

    function renderDashboardShifts() {
        const items = $$("#dashboard .shift-item");
        if (!items.length) return;

        const todayShifts = db.shifts.filter(s => s.date === getToday());

        ["Morning", "Evening", "Night"].forEach((type, index) => {
            if (!items[index]) return;

            const count = todayShifts.filter(s => s.type === type).length;
            const heading = items[index].querySelector("h4");
            const badgeEl = items[index].querySelector(".shift-badge");

            if (heading) heading.textContent = type + " Shift";
            if (badgeEl) badgeEl.textContent = count + " Staff";
        });
    }

    function renderDashboardAttendance() {
        const card = $("#dashboard .attendance-card");
        if (!card) return;

        const total = Math.max(
            db.employees.filter(e => e.status === "Active").length, 1
        );

        const present = db.attendance.filter(
            a => a.date === getToday() && a.status === "Present"
        ).length;

        const onLeave = db.leaves.filter(l =>
            l.status === "Approved" &&
            getToday() >= l.from &&
            getToday() <= l.to
        ).length;

        const absent = Math.max(0, total - present - onLeave);

        const values = [
            Math.round(present / total * 100),
            Math.round(absent / total * 100),
            Math.round(onLeave / total * 100)
        ];

        card.querySelectorAll(".progress-info strong").forEach((el, i) => {
            if (values[i] !== undefined) el.textContent = values[i] + "%";
        });

        card.querySelectorAll(".progress-bar div").forEach((el, i) => {
            if (values[i] !== undefined) el.style.width = values[i] + "%";
        });
    }

    // =====================================================
    // 5. EMPLOYEE MANAGEMENT
    // =====================================================

    let editingId = null;

    $("#employeeFormContainer")?.classList.add("hidden");

    $("#addEmployeeBtn")?.addEventListener("click", () => {
        editingId = null;
        $("#employeeForm")?.reset();

        const heading = $("#employeeFormContainer h3");
        if (heading) heading.textContent = "➕ Add New Employee";

        $("#employeeFormContainer")?.classList.remove("hidden");
        $("#employeeFormContainer")?.scrollIntoView({ behavior: "smooth" });
    });

    function renderEmployees(search = "") {
        const tbody = $("#employeeTableBody");
        if (!tbody) return;

        const query = search.toLowerCase();

        const filtered = db.employees.filter(e =>
            [e.id, e.name, e.email, e.department, e.position, e.phone]
                .some(v => String(v).toLowerCase().includes(query))
        );

        tbody.innerHTML = filtered.map(e => `
        <tr>
            <td>${safe(e.id)}</td>
            <td>${safe(e.name)}</td>
            <td>${safe(e.department)}</td>
            <td>${safe(e.position)}</td>
            <td>${safe(e.phone)}</td>
            <td>${badge(e.status)}</td>
            <td>
                <button class="text-button"
                    data-action="edit-employee"
                    data-id="${safe(e.id)}">✏️ Edit</button>

                <button class="text-button"
                    data-action="delete-employee"
                    data-id="${safe(e.id)}">🗑️ Delete</button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="7">No employees found.</td></tr>`;
    }

    $("#employeeSearch")?.addEventListener("input", e => {
        renderEmployees(e.target.value);
    });

    $("#employeeForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const employee = {
            id: $("#employeeID").value.trim(),
            name: $("#employeeName").value.trim(),
            email: $("#employeeEmail").value.trim(),
            phone: $("#employeePhone").value.trim(),
            department: $("#employeeDepartment").value,
            position: $("#employeePosition").value.trim(),
            joiningDate: $("#joiningDate").value,
            salary: 25000,
            status: "Active"
        };

        const duplicate = db.employees.some(e =>
            e.id.toLowerCase() === employee.id.toLowerCase() &&
            e.id !== editingId
        );

        if (duplicate) {
            alert("This Employee ID already exists!");
            return;
        }

        if (editingId) {
            const old = db.employees.find(e => e.id === editingId);
            if (!old) return;

            employee.salary = old.salary;
            employee.status = old.status;
            Object.assign(old, employee);

            message("Employee Updated", employee.name + " details updated.");
        } else {
            db.employees.push(employee);
            message("Employee Added", employee.name + " added successfully.");
        }

        saveData();
        renderEmployees();
        $("#employeeForm").reset();
        $("#employeeFormContainer")?.classList.add("hidden");
        editingId = null;

        alert("✅ Employee saved successfully!");
    });

    // =====================================================
    // 6. SEPARATE EMPLOYEE REGISTRATION PAGE
    // =====================================================

    const registrationForm = $("#registrationForm");

    registrationForm?.addEventListener("submit", event => {
        event.preventDefault();

        const fields = registrationForm.querySelectorAll("input,select");

        if (fields.length < 12) {
            alert("Please check the employee registration form fields.");
            return;
        }

        const values = [...fields].map(field => field.value.trim());

        const employee = {
            id: values[7] || newId("EMP"),
            name: (values[0] + " " + values[1]).trim(),
            email: values[4],
            phone: values[5],
            department: values[8],
            position: values[9],
            joiningDate: values[10],
            salary: Number(values[11]) || 25000,
            status: "Active"
        };

        if (!employee.name || !employee.email ||
            !employee.department || !employee.position) {
            alert("Please complete the required employee information.");
            return;
        }

        if (db.employees.some(e =>
            e.id.toLowerCase() === employee.id.toLowerCase()
        )) {
            alert("Employee ID already exists!");
            return;
        }

        db.employees.push(employee);
        saveData();
        registrationForm.reset();

        message("Registration Complete", employee.name + " registered successfully.");
        alert("🎉 New employee registered!");
    });

    // =====================================================
    // 7. DEPARTMENT MANAGEMENT
    // =====================================================

    function renderDepartments() {
        const target = $("#departmentContainer");
        if (!target) return;

        target.innerHTML = db.departments.map((d, index) => `
        <div class="stat-card">
            <div class="stat-icon purple">🏢</div>
            <h3>${safe(d.name)}</h3>
            <p>Manager: ${safe(d.manager)}</p>
            <p>Employees: ${db.employees.filter(
            e => e.department === d.name
        ).length}</p>
            <button class="text-button"
                data-action="delete-department"
                data-index="${index}">🗑️ Delete</button>
        </div>
    `).join("");
    }

    $("#departmentForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const name = $("#newDepartment").value.trim();
        const manager = $("#departmentManager").value.trim() || "Not Assigned";

        if (db.departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
            alert("Department already exists!");
            return;
        }

        db.departments.push({ name, manager });

        const select = $("#employeeDepartment");
        if (select) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        }

        saveData();
        renderDepartments();
        event.target.reset();
        message("Department Created", name + " department added.");
    });

    // =====================================================
    // 8. SHIFT SCHEDULING
    // =====================================================

    $("#shiftForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const name = $("#shiftEmployee").value.trim();
        const employee = employeeByInput(name);

        if (!employee) {
            alert("Employee not found. Enter a registered employee name or ID.");
            return;
        }

        const shift = {
            id: newId("SH"),
            employee: employee.name,
            employeeId: employee.id,
            type: $("#shiftType").value,
            date: $("#shiftDate").value,
            start: $("#shiftStart").value,
            end: $("#shiftEnd").value
        };

        if (shift.end <= shift.start &&
            !confirm("This shift crosses midnight. Continue?")) return;

        const overlap = db.shifts.some(s =>
            s.employeeId === employee.id &&
            s.date === shift.date &&
            shift.start < s.end &&
            shift.end > s.start
        );

        if (overlap) {
            alert("This employee already has an overlapping shift.");
            return;
        }

        db.shifts.push(shift);
        saveData();
        renderShifts();
        event.target.reset();

        message("Shift Assigned", employee.name + " has been assigned a shift.");
    });

    function renderShifts() {
        const target = $("#shiftContainer");
        if (!target) return;

        target.innerHTML = db.shifts.length ? makeTable(
            ["Employee", "Shift", "Date", "Start", "End", "Action"],
            db.shifts.map(s => `
            <tr>
                <td>${safe(s.employee)}</td>
                <td>${safe(s.type)}</td>
                <td>${safe(s.date)}</td>
                <td>${safe(s.start)}</td>
                <td>${safe(s.end)}</td>
                <td>
                    <button class="text-button"
                        data-action="delete-shift"
                        data-id="${safe(s.id)}">🗑️ Delete</button>
                </td>
            </tr>
        `).join("")
        ) : showEmpty("No shifts assigned yet.");
    }

    // =====================================================
    // 9. ATTENDANCE MANAGEMENT
    // =====================================================

    function renderAttendance() {
        const tbody = $("#attendanceTable");
        if (!tbody) return;

        const date = $("#attendanceDate")?.value || getToday();

        tbody.innerHTML = db.employees.filter(
            e => e.status === "Active"
        ).map(e => {
            const record = db.attendance.find(a =>
                a.employeeId === e.id && a.date === date
            );

            return `
            <tr>
                <td>${safe(e.name)}<br><small>${safe(e.id)}</small></td>
                <td>${safe(record?.checkIn || "--")}</td>
                <td>${safe(record?.checkOut || "--")}</td>
                <td>${badge(record?.status || "Absent")}</td>
                <td>
                    <button class="text-button"
                        data-action="check-in"
                        data-id="${safe(e.id)}"
                        ${record?.checkIn || date !== getToday() ? "disabled" : ""}>
                        🟢 Check In
                    </button>
                    <button class="text-button"
                        data-action="check-out"
                        data-id="${safe(e.id)}"
                        ${!record?.checkIn || record?.checkOut || date !== getToday() ? "disabled" : ""}>
                        🔴 Check Out
                    </button>
                </td>
            </tr>
            `;
        }).join("");
    }

    // Open Dashboard when website loads
    if (document.getElementById("dashboard")) {
        openPage("dashboard");
    }/* ======================================
   RETAILFLOW ATTENDANCE MANAGEMENT
====================================== */

    const RF_ATTENDANCE_KEY = "retailflow_attendance_history";

    function attendanceToday() {
        const date = new Date();
        const offset = date.getTimezoneOffset();

        return new Date(date.getTime() - offset * 60000)
            .toISOString().split("T")[0];
    }

    function attendanceGetEmployees() {
        return rfEmployees();
    }

    function attendanceGetHistory() {
        try {
            return JSON.parse(
                localStorage.getItem(RF_ATTENDANCE_KEY)
            ) || [];
        } catch {
            return [];
        }
    }

    function attendanceSaveHistory(data) {
        localStorage.setItem(
            RF_ATTENDANCE_KEY,
            JSON.stringify(data)
        );
    }

    function attendanceEmployeeId(employee) {
        return String(
            employee.id ||
            employee.employeeId ||
            employee.empId ||
            ""
        );
    }

    function attendanceEmployeeName(employee) {
        return rfEmployeeName(employee);
    }

    function attendanceIsOnLeave(id, date) {
        return rfIsOnLeave(id, date);
    }

    function attendanceGetRecord(id, date) {
        return attendanceGetHistory().find(record =>
            String(record.employeeId) === String(id) &&
            record.date === date
        );
    }

    // CREATE OR UPDATE ATTENDANCE
    function attendanceSetStatus(id, status) {

        const date = document.getElementById(
            "attendanceDate"
        )?.value || attendanceToday();

        if (date > attendanceToday()) {
            alert("Future date attendance cannot be marked.");
            return;
        }

        const employee = attendanceGetEmployees().find(emp =>
            attendanceEmployeeId(emp) === String(id)
        );

        if (!employee) {
            alert("Employee not found!");
            return;
        }

        if (attendanceIsOnLeave(id, date)) {
            alert("This employee has approved leave on this date.");
            return;
        }

        const history = attendanceGetHistory();

        let record = history.find(item =>
            String(item.employeeId) === String(id) &&
            item.date === date
        );

        if (record) {
            record.status = status;
        } else {
            record = {
                employeeId: id,
                employeeName: attendanceEmployeeName(employee),
                department: employee.department || "Not Assigned",
                date: date,
                status: status,
                checkIn: "",
                checkOut: ""
            };

            history.push(record);
        }

        attendanceSaveHistory(history);
        attendanceRenderAll();
    }

    // CHECK IN - SEPARATE ACTION
    function attendanceCheckIn(id) {

        const date = attendanceToday();

        if (document.getElementById("attendanceDate")?.value !== date) {
            alert("Check-in is available only for today.");
            return;
        }

        if (attendanceIsOnLeave(id, date)) {
            alert("Employee is on approved leave.");
            return;
        }

        const history = attendanceGetHistory();

        let record = history.find(item =>
            String(item.employeeId) === String(id) &&
            item.date === date
        );

        if (!record || record.status !== "Present") {
            alert("Please mark attendance as Present first.");
            return;
        }

        if (record.checkIn) {
            alert("Check-in already recorded.");
            return;
        }

        record.checkIn = new Date().toLocaleTimeString();

        attendanceSaveHistory(history);
        attendanceRenderAll();
    }

    // CHECK OUT - SEPARATE ACTION
    function attendanceCheckOut(id) {

        const date = attendanceToday();

        if (document.getElementById("attendanceDate")?.value !== date) {
            alert("Check-out is available only for today.");
            return;
        }

        const history = attendanceGetHistory();

        const record = history.find(item =>
            String(item.employeeId) === String(id) &&
            item.date === date
        );

        if (!record || !record.checkIn) {
            alert("Please check in first.");
            return;
        }

        if (record.checkOut) {
            alert("Check-out already recorded.");
            return;
        }

        record.checkOut = new Date().toLocaleTimeString();

        attendanceSaveHistory(history);
        attendanceRenderAll();
    }

    // MAIN EMPLOYEE LIST
    function attendanceRenderEmployees() {

        const container = document.getElementById(
            "attendanceEmployeeList"
        );

        if (!container) return;

        const employees = attendanceGetEmployees();

        const date = document.getElementById(
            "attendanceDate"
        )?.value || attendanceToday();

        const search = document.getElementById(
            "attendanceSearch"
        )?.value.toLowerCase() || "";

        const filteredEmployees = employees.filter(employee => {

            const name = attendanceEmployeeName(employee).toLowerCase();
            const id = attendanceEmployeeId(employee).toLowerCase();

            return name.includes(search) || id.includes(search);
        });

        container.innerHTML = "";

        if (!filteredEmployees.length) {
            container.textContent = "No employees found.";
            return;
        }

        filteredEmployees.forEach(employee => {

            const id = attendanceEmployeeId(employee);
            const name = attendanceEmployeeName(employee);

            const leave = attendanceIsOnLeave(id, date);
            const record = attendanceGetRecord(id, date);

            const status = leave
                ? "On Leave"
                : record?.status || "Not Marked";

            const row = document.createElement("div");
            row.className = "attendance-employee-row";

            const info = document.createElement("div");

            const employeeName = document.createElement("strong");
            employeeName.textContent = name;

            const employeeDetails = document.createElement("p");
            employeeDetails.textContent =
                "ID: " + id +
                " | Department: " +
                (employee.department || "Not Assigned");

            const employeeStatus = document.createElement("p");
            employeeStatus.textContent = "Attendance: " + status;

            const timings = document.createElement("p");
            timings.textContent =
                "Check-in: " + (record?.checkIn || "--") +
                " | Check-out: " + (record?.checkOut || "--");

            info.append(
                employeeName,
                employeeDetails,
                employeeStatus,
                timings
            );

            row.appendChild(info);

            // MARK ATTENDANCE BUTTONS
            const markBox = document.createElement("div");
            markBox.className = "attendance-actions";

            ["Present", "Absent", "Half Day"].forEach(value => {

                const button = document.createElement("button");

                button.textContent = value;
                button.disabled = leave;

                button.addEventListener("click", () => {
                    attendanceSetStatus(id, value);
                });

                markBox.appendChild(button);
            });

            // CHECK IN BUTTON
            const checkInButton = document.createElement("button");
            checkInButton.textContent = "Check In";

            checkInButton.disabled =
                leave || status !== "Present" ||
                Boolean(record?.checkIn) || date !== attendanceToday();

            checkInButton.addEventListener("click", () => {
                attendanceCheckIn(id);
            });

            markBox.appendChild(checkInButton);

            // CHECK OUT BUTTON
            const checkOutButton = document.createElement("button");
            checkOutButton.textContent = "Check Out";

            checkOutButton.disabled =
                !record?.checkIn ||
                Boolean(record?.checkOut) ||
                date !== attendanceToday();

            checkOutButton.addEventListener("click", () => {
                attendanceCheckOut(id);
            });

            markBox.appendChild(checkOutButton);

            row.appendChild(markBox);
            container.appendChild(row);
        });
    }

    // DASHBOARD SUMMARY
    function attendanceRenderSummary() {

        const employees = attendanceGetEmployees();
        const date = document.getElementById(
            "attendanceDate"
        )?.value || attendanceToday();

        let present = 0;
        let absent = 0;
        let onLeave = 0;

        employees.forEach(employee => {

            const id = attendanceEmployeeId(employee);

            if (attendanceIsOnLeave(id, date)) {
                onLeave++;
                return;
            }

            const record = attendanceGetRecord(id, date);

            if (record?.status === "Present" ||
                record?.status === "Half Day") {
                present++;
            }

            if (record?.status === "Absent") {
                absent++;
            }
        });

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setText("attTotal", employees.length);
        setText("attPresent", present);
        setText("attAbsent", absent);
        setText("attLeave", onLeave);

        // Update existing dashboard cards too
        setText("totalEmployees", employees.length);
        setText("presentEmployees", present);
        setText("onLeave", onLeave);
        setText("absentEmployees", absent);
    }

    // HISTORY
    function attendanceRenderHistory() {

        const container = document.getElementById(
            "attendanceHistory"
        );

        if (!container) return;

        const history = attendanceGetHistory().slice().reverse();

        container.innerHTML = "";

        if (!history.length) {
            container.textContent = "No attendance history available.";
            return;
        }

        history.forEach(record => {

            const item = document.createElement("p");

            item.textContent =
                record.employeeName +
                " | " + record.date +
                " | " + record.status +
                " | In: " + (record.checkIn || "--") +
                " | Out: " + (record.checkOut || "--");

            container.appendChild(item);
        });
    }

    // ON LEAVE LIST
    function attendanceRenderLeaveList() {

        const container = document.getElementById(
            "onLeaveTodayList"
        );

        if (!container) return;

        container.innerHTML = "";

        const employees = attendanceGetEmployees();

        const leaveEmployees = employees.filter(employee =>
            attendanceIsOnLeave(
                attendanceEmployeeId(employee),
                attendanceToday()
            )
        );

        if (!leaveEmployees.length) {
            container.textContent = "No employees on leave today.";
            return;
        }

        leaveEmployees.forEach(employee => {

            const item = document.createElement("p");

            item.textContent =
                attendanceEmployeeName(employee) +
                " - " + (employee.department || "Not Assigned");

            container.appendChild(item);
        });
    }

    // REFRESH ALL
    function attendanceRenderAll() {

        attendanceRenderEmployees();
        attendanceRenderSummary();
        attendanceRenderHistory();
        attendanceRenderLeaveList();
    }

    // EVENT LISTENERS
    document.addEventListener("DOMContentLoaded", function () {

        const date = document.getElementById("attendanceDate");
        const search = document.getElementById("attendanceSearch");

        if (date) {
            date.value = attendanceToday();
            date.addEventListener("change", attendanceRenderAll);
        }

        if (search) {
            search.addEventListener("input", attendanceRenderEmployees);
        }

        attendanceRenderAll();
    }); const attendanceButtons = document.createElement("div");

    attendanceButtons.innerHTML = `
    <button type="button" data-status="Present">Present</button>
    <button type="button" data-status="Absent">Absent</button>
    <button type="button" data-status="Half Day">Half Day</button>
`;

    attendanceButtons.querySelectorAll("button").forEach(button => {

        button.addEventListener("click", function () {

            attendanceSetStatus(id, this.dataset.status);

        });

    });

    row.appendChild(attendanceButtons); function attendanceSetStatus(id, status) {

        const date = document.getElementById("attendanceDate")?.value
            || attendanceToday();

        const employee = attendanceGetEmployees().find(emp =>
            attendanceEmployeeId(emp) === String(id)
        );

        if (!employee) {
            alert("Employee not found!");
            return;
        }

        if (attendanceIsOnLeave(id, date)) {
            alert("Employee is on approved leave!");
            return;
        }

        const history = attendanceGetHistory();

        let record = history.find(item =>
            String(item.employeeId) === String(id) &&
            item.date === date
        );

        if (record) {
            record.status = status;
        } else {
            history.push({
                employeeId: id,
                employeeName: attendanceEmployeeName(employee),
                department: employee.department || "Not Assigned",
                date: date,
                status: status,
                checkIn: "",
                checkOut: ""
            });
        }

        attendanceSaveHistory(history);
        attendanceRenderAll();

        if (typeof updateDashboard === "function") {
            updateDashboard();
        }
    }

    // LEAVE REQUEST
    function rfAddLeave(id, from, to, reason) {

        if (!id || !from || !to || !reason.trim()) {
            alert("Please complete all leave details.");
            return;
        }

        if (to < from) {
            alert("End date cannot be before start date.");
            return;
        }

        const employee = rfEmployees().find(emp =>
            rfEmployeeId(emp) === String(id)
        );

        if (!employee) {
            alert("Employee not found!");
            return;
        }

        const leaves = rfGetData(RF_LEAVE_KEY);

        leaves.push({
            leaveId: Date.now(),
            employeeId: id,
            employeeName: rfEmployeeName(employee),
            from: from,
            to: to,
            reason: reason,
            status: "Pending",
            createdAt: new Date().toLocaleString()
        });

        rfSaveData(RF_LEAVE_KEY, leaves);
        rfRenderAll();

        alert("Leave request submitted!");
    }

    // APPROVE OR REJECT LEAVE
    function rfUpdateLeave(leaveId, status) {

        const leaves = rfGetData(RF_LEAVE_KEY);

        const leave = leaves.find(item =>
            String(item.leaveId) === String(leaveId)
        );

        if (!leave) return;

        leave.status = status;

        rfSaveData(RF_LEAVE_KEY, leaves);
        rfRenderAll();
    }

    // RENDER LEAVE HISTORY
    function rfRenderLeave() {

        const history = document.getElementById("leaveHistory");
        const pending = document.getElementById("pendingLeaveList");

        const leaves = rfGetData(RF_LEAVE_KEY);

        if (history) {
            history.innerHTML = "";

            if (!leaves.length) {
                history.textContent = "No leave history available.";
            }

            leaves.slice().reverse().forEach(leave => {
                const row = document.createElement("p");

                row.textContent =
                    leave.employeeName + " | " +
                    leave.from + " to " + leave.to + " | " +
                    leave.reason + " | " + leave.status;

                history.appendChild(row);
            });
        }

        if (pending) {
            pending.innerHTML = "";

            const pendingLeaves = leaves.filter(item =>
                item.status === "Pending"
            );

            if (!pendingLeaves.length) {
                pending.textContent = "No pending leave requests.";
            }

            pendingLeaves.forEach(leave => {
                const row = document.createElement("div");

                const details = document.createElement("p");
                details.textContent =
                    leave.employeeName + " | " +
                    leave.from + " to " + leave.to +
                    " | " + leave.reason;

                const approve = document.createElement("button");
                approve.textContent = "Approve";
                approve.addEventListener("click", () =>
                    rfUpdateLeave(leave.leaveId, "Approved")
                );

                const reject = document.createElement("button");
                reject.textContent = "Reject";
                reject.addEventListener("click", () =>
                    rfUpdateLeave(leave.leaveId, "Rejected")
                );

                row.append(details, approve, reject);
                pending.appendChild(row);
            });
        }
    }

    // ATTENDANCE HISTORY
    function rfRenderHistory() {

        const container = document.getElementById("attendanceHistory");

        if (!container) return;

        const history = rfGetData(RF_ATT_KEY).slice().reverse();

        container.innerHTML = "";

        if (!history.length) {
            container.textContent = "No attendance history available.";
            return;
        }

        history.forEach(record => {

            const row = document.createElement("p");

            row.textContent =
                record.employeeName + " | " +
                record.date + " | " +
                record.status + " | Check-in: " +
                (record.checkIn || "-") +
                " | Check-out: " +
                (record.checkOut || "-");

            container.appendChild(row);
        });
    }

    // REFRESH ALL SECTIONS
    function rfRenderAll() {
        rfRenderAttendance();
        rfRenderLeave();
        rfRenderHistory();
    }

    // INITIALIZE
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", rfRenderAll);
    } else {
        rfRenderAll();
    } function rfUpdateDashboardAttendance() {

        const employees = rfEmployees();
        const today = rfToday();

        let present = 0;
        let absent = 0;
        let onLeave = 0;

        employees.forEach(emp => {

            const id = rfEmployeeId(emp);

            if (rfIsOnLeave(id, today)) {
                onLeave++;
                return;
            }

            const record = rfGetAttendance(id, today);

            if (!record) return;

            if (record.status === "Present") {
                present++;
            }

            if (record.status === "Absent") {
                absent++;
            }

            if (record.status === "Half Day") {
                present++;
            }
        });

        const total = document.getElementById("totalEmployees");
        const presentBox = document.getElementById("presentEmployees");
        const leaveBox = document.getElementById("onLeave");

        if (total) total.textContent = employees.length;
        if (presentBox) presentBox.textContent = present;
        if (leaveBox) leaveBox.textContent = onLeave;

        const absentBox = document.getElementById("absentEmployees");

        if (absentBox) {
            absentBox.textContent = absent;
        }
    }/* =====================================
   RETAILFLOW MONTHLY SCHEDULE SYSTEM
===================================== */
    const employeeSelect = document.getElementById("monthlyEmployee");

    employeeSelect.innerHTML = '<option value="">Select Employee</option>';

    rfEmployees().forEach(emp => {
        const option = document.createElement("option");
        option.value = rfEmployeeId(emp);
        option.textContent = rfEmployeeName(emp);
        employeeSelect.appendChild(option);
    });

    const MONTHLY_KEY = "retailflow_monthly_schedules";

    function getMonthlySchedules() {
        try {
            return JSON.parse(localStorage.getItem(MONTHLY_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveMonthlySchedules(data) {
        localStorage.setItem(MONTHLY_KEY, JSON.stringify(data));
    }

    // LOAD EMPLOYEES
    function loadMonthlyEmployees() {

        const select = document.getElementById("monthlyEmployee");

        if (!select) return;

        const employees = rfEmployees();

        select.innerHTML = '<option value="">Select Employee</option>';

        employees.forEach(emp => {

            const option = document.createElement("option");

            option.value = rfEmployeeId(emp);
            option.textContent = rfEmployeeName(emp);

            select.appendChild(option);
        });
    }

    // ADD SCHEDULE
    function addMonthlySchedule(event) {

        event.preventDefault();

        const employeeId = document.getElementById("monthlyEmployee").value;
        const month = document.getElementById("monthlyMonth").value;
        const shift = document.getElementById("monthlyShift").value;
        const start = document.getElementById("monthlyStart").value;
        const end = document.getElementById("monthlyEnd").value;

        if (!employeeId || !month || !start || !end) {
            alert("Please complete all fields.");
            return;
        }

        if (start === end) {
            alert("Start and end time cannot be the same.");
            return;
        }

        const employee = rfEmployees().find(emp =>
            rfEmployeeId(emp) === employeeId
        );

        if (!employee) {
            alert("Employee not found.");
            return;
        }

        const schedules = getMonthlySchedules();

        schedules.push({
            id: Date.now(),
            employeeId,
            employeeName: rfEmployeeName(employee),
            department: employee.department || "Not Assigned",
            month,
            shift,
            start,
            end,
            createdAt: new Date().toLocaleString()
        });

        saveMonthlySchedules(schedules);

        document.getElementById("monthlyScheduleForm").reset();

        renderMonthlySchedules();

        alert("Monthly schedule added successfully!");
    }

    // DISPLAY HISTORY
    function renderMonthlySchedules() {

        const container = document.getElementById(
            "monthlyScheduleHistory"
        );

        if (!container) return;

        const filter = document.getElementById("monthlyFilter")?.value;

        let schedules = getMonthlySchedules();

        if (filter) {
            schedules = schedules.filter(item => item.month === filter);
        }

        container.innerHTML = "";

        if (!schedules.length) {
            container.textContent = "No monthly schedules found.";
            return;
        }

        schedules.slice().reverse().forEach(item => {

            const row = document.createElement("div");
            row.className = "monthly-schedule-card";

            const details = document.createElement("p");

            details.textContent =
                item.employeeName +
                " | " + item.department +
                " | " + item.month +
                " | " + item.shift +
                " | " + item.start + " - " + item.end;

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", () => {

                if (!confirm("Delete this schedule?")) return;

                const updated = getMonthlySchedules().filter(
                    schedule => schedule.id !== item.id
                );

                saveMonthlySchedules(updated);
                renderMonthlySchedules();
            });

            row.append(details, deleteButton);
            container.appendChild(row);
        });
    }

    // INITIALIZE
    document.addEventListener("DOMContentLoaded", function () {

        const form = document.getElementById("monthlyScheduleForm");

        if (form) {
            form.addEventListener("submit", addMonthlySchedule);
        }

        const filter = document.getElementById("monthlyFilter");

        if (filter) {
            filter.addEventListener("change", renderMonthlySchedules);
        }

        loadMonthlyEmployees();
        renderMonthlySchedules();

    }); function lockWebsite() {
        loginPage.style.display = "flex";
        document.querySelectorAll(".main-container").forEach(element => {
            element.style.display = "none";
        });
    }

});


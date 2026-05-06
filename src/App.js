import { useState, useEffect } from "react";

function App() {
  const [text, setText] = useState("");

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("events");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleClick = async () => {
    const res = await fetch("http://localhost:5000/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!data.error) {
      if (editIndex !== null) {
        const updated = [...events];
        updated[editIndex] = data;
        setEvents(updated);
        setEditIndex(null);
      } else {
        setEvents((prev) => [...prev, data]);
      }

      setText("");
    }
  };

  const changeMonth = (dir) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month + dir);
    setCurrentDate(newDate);
  };

  const today = new Date();

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AI Calendar</h1>

      {/* Input */}
      <div style={styles.inputBox}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Meeting tomorrow at 5pm"
          style={styles.input}
        />
        <button onClick={handleClick} style={styles.button}>
          {editIndex !== null ? "Update" : "Add"}
        </button>
      </div>

      {/* Month Navigation */}
      <div style={styles.nav}>
        <button style={styles.arrowBtn} onClick={() => changeMonth(-1)}>
          ←
        </button>

        <h2>
          {monthNames[month]} {year}
        </h2>

        <button style={styles.arrowBtn} onClick={() => changeMonth(1)}>
          →
        </button>
      </div>

      {/* Calendar */}
      <div style={styles.calendar}>
        {dayNames.map((d) => (
          <div key={d} style={styles.dayLabel}>
            {d}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={i}></div>
        ))}

        {days.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = events.filter((e) => e.date === dateStr);

          return (
            <div
              key={day}
              style={{
                ...styles.day,
                background: isToday(day) ? "#e3f2fd" : "white",
              }}
            >
              <strong>{day}</strong>

              {dayEvents.map((event, i) => {
                const globalIndex = events.findIndex(
                  (e) =>
                    e.date === event.date &&
                    e.title === event.title &&
                    e.time === event.time,
                );

                return (
                  <div
                    key={i}
                    style={styles.event}
                    onClick={() => {
                      setSelectedEvent(event);
                      setSelectedIndex(globalIndex);
                    }}
                  >
                    {event.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2>{selectedEvent.title}</h2>

            <p>
              <strong>Date:</strong> {selectedEvent.date}
            </p>
            <p>
              <strong>Time:</strong> {selectedEvent.time || "Not specified"}
            </p>

            <div style={styles.modalActions}>
              <button
                style={styles.editBtn}
                onClick={() => {
                  setText(`${selectedEvent.title} ${selectedEvent.time}`);
                  setEditIndex(selectedIndex);
                  setSelectedEvent(null);
                }}
              >
                Edit
              </button>

              <button
                style={styles.deleteBtn}
                onClick={() => {
                  const updated = events.filter((_, i) => i !== selectedIndex);
                  setEvents(updated);
                  setSelectedEvent(null);
                }}
              >
                Delete
              </button>

              <button
                style={styles.closeBtn}
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "20px auto",
    fontFamily: "Segoe UI",
  },
  title: { textAlign: "center" },

  inputBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },

  button: {
    padding: "10px 20px",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  arrowBtn: {
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  calendar: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "6px",
  },

  dayLabel: {
    textAlign: "center",
    fontWeight: "bold",
  },

  day: {
    border: "1px solid #ccc",
    minHeight: "100px",
    padding: "6px",
    borderRadius: "6px",
  },

  event: {
    background: "#4CAF50",
    color: "white",
    padding: "4px",
    marginTop: "4px",
    borderRadius: "4px",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "320px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
  },

  editBtn: {
    background: "#2196f3",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#f44336",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  closeBtn: {
    background: "#777",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default App;

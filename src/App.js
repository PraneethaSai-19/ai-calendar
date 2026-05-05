import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [events, setEvents] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

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
        // update existing event
        const updated = [...events];
        updated[editIndex] = data;
        setEvents(updated);
        setEditIndex(null);
      } else {
        // add new event
        setEvents((prev) => [...prev, data]);
      }

      setText("");
    }
  };

  const handleDelete = (index) => {
    const filtered = events.filter((_, i) => i !== index);
    setEvents(filtered);
  };

  const handleEdit = (index) => {
    const event = events[index];
    setText(`${event.title} ${event.time} ${event.date}`);
    setEditIndex(index);
  };

  return (
    <div style={styles.container}>
      <h1>AI Calendar</h1>

      {/* Input */}
      <div style={styles.inputBox}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Meeting at 9"
          style={styles.input}
        />
        <button onClick={handleClick}>
          {editIndex !== null ? "Update" : "Add"}
        </button>
      </div>

      {/* Events */}
      <div style={styles.list}>
        {events.map((event, index) => (
          <div key={index} style={styles.card}>
            <h3>{event.title}</h3>
            <p>📅 {event.date}</p>
            <p>⏰ {event.time}</p>

            <div style={styles.actions}>
              <button onClick={() => handleEdit(index)}>✏️ Edit</button>
              <button onClick={() => handleDelete(index)}>❌ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    fontFamily: "Arial",
  },
  inputBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "10px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  actions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
};

export default App;

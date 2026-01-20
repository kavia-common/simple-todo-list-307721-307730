import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import ProgressCircle from "./components/ProgressCircle";

const STORAGE_KEY = "kavia.todo.v1";

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * Generate a reasonably-unique id without external deps.
 * Uses crypto.randomUUID when available.
 */
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Load todos from localStorage. Returns an empty list on failure/corruption.
 * @returns {Todo[]}
 */
function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Lightweight validation/sanitization
    return parsed
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: typeof t.id === "string" ? t.id : generateId(),
        title: typeof t.title === "string" ? t.title : "",
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : Date.now(),
      }))
      .filter((t) => t.title.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * Persist todos to localStorage. Fail silently.
 * @param {Todo[]} todos
 */
function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // ignore storage write errors (quota/private mode)
  }
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Note: keeping state initialization lazy avoids reading localStorage twice in strict mode.
   */
  const [todos, setTodos] = useState(() => loadTodos());
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const addInputRef = useRef(null);
  const editInputRef = useRef(null);

  const remainingCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos]
  );
  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos]
  );

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  useEffect(() => {
    if (editingId) {
      // Focus the inline edit input when editing starts
      editInputRef.current?.focus();
      editInputRef.current?.select?.();
    }
  }, [editingId]);

  // PUBLIC_INTERFACE
  const handleAddTodo = () => {
    const title = newTitle.trim();
    if (!title) return;

    const now = Date.now();
    /** @type {Todo} */
    const todo = {
      id: generateId(),
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    setTodos((prev) => [todo, ...prev]);
    setNewTitle("");
    // Keep keyboard flow on the add input for fast entry.
    addInputRef.current?.focus();
  };

  // PUBLIC_INTERFACE
  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
      )
    );
  };

  // PUBLIC_INTERFACE
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingTitle("");
      addInputRef.current?.focus();
    }
  };

  // PUBLIC_INTERFACE
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  // PUBLIC_INTERFACE
  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    addInputRef.current?.focus();
  };

  // PUBLIC_INTERFACE
  const commitEditing = () => {
    const title = editingTitle.trim();
    if (!editingId) return;

    if (!title) {
      // Empty title => delete (common todo app behavior)
      deleteTodo(editingId);
      return;
    }

    setTodos((prev) =>
      prev.map((t) =>
        t.id === editingId ? { ...t, title, updatedAt: Date.now() } : t
      )
    );
    setEditingId(null);
    setEditingTitle("");
    addInputRef.current?.focus();
  };

  // PUBLIC_INTERFACE
  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return (
    <div className="App">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <h1 className="app-title">Todo List</h1>
            <p className="app-subtitle">
              Add tasks, edit them, mark completed, and keep everything saved
              locally in your browser.
            </p>
          </div>

          <div className="stats" aria-label="Task statistics">
            <ProgressCircle total={todos.length} completed={completedCount} />

            <div className="stat">
              <div className="stat-label">Remaining</div>
              <div className="stat-value">{remainingCount}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{completedCount}</div>
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="page">
        <section className="card" aria-label="Add a new task">
          <form
            className="add-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTodo();
            }}
          >
            <div className="field">
              <label className="label" htmlFor="newTodo">
                New task
              </label>
              <input
                ref={addInputRef}
                id="newTodo"
                className="input"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g., Buy groceries"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="hint" id="newTodoHint">
                Press Enter to add.
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={newTitle.trim().length === 0}
            >
              Add
            </button>
          </form>
        </section>

        <section className="card" aria-label="Task list">
          <div className="list-header">
            <h2 className="section-title">Tasks</h2>

            <div className="list-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                Clear completed
              </button>
            </div>
          </div>

          {todos.length === 0 ? (
            <div className="empty" role="status" aria-live="polite">
              <div className="empty-title">No tasks yet</div>
              <div className="empty-subtitle">
                Add your first task using the input above.
              </div>
            </div>
          ) : (
            <ul className="todo-list" aria-label="Todos">
              {todos.map((todo) => {
                const isEditing = editingId === todo.id;
                const checkboxId = `todo-${todo.id}`;

                return (
                  <li key={todo.id} className="todo-item">
                    <div className="todo-left">
                      <input
                        id={checkboxId}
                        className="checkbox"
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        aria-label={
                          todo.completed
                            ? `Mark "${todo.title}" as not completed`
                            : `Mark "${todo.title}" as completed`
                        }
                      />

                      {!isEditing ? (
                        <label
                          htmlFor={checkboxId}
                          className={`todo-title ${
                            todo.completed ? "todo-title-completed" : ""
                          }`}
                          onDoubleClick={() => startEditing(todo)}
                          title="Double-click to edit"
                        >
                          {todo.title}
                        </label>
                      ) : (
                        <div className="edit-wrap">
                          <label className="sr-only" htmlFor={`edit-${todo.id}`}>
                            Edit task title
                          </label>
                          <input
                            ref={editInputRef}
                            id={`edit-${todo.id}`}
                            className="input input-edit"
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitEditing();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditing();
                              }
                            }}
                          />
                          <div className="edit-hint" aria-hidden="true">
                            Enter to save • Esc to cancel
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="todo-actions">
                      {!isEditing ? (
                        <>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => startEditing(todo)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => deleteTodo(todo.id)}
                            aria-label={`Delete "${todo.title}"`}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-success"
                            type="button"
                            onClick={commitEditing}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="footer">
          <div className="footer-note">
            Tip: double-click a task to edit quickly.
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

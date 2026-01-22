import { useState } from "react";

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const Sample = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "サンプルタスク1", completed: false },
    { id: 2, title: "サンプルタスク2", completed: true },
    { id: 3, title: "サンプルタスク3", completed: false },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // タスク追加
  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  // タスク完了状態の切り替え
  const toggleTaskCompletion = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // タスク削除
  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">サンプルページ</h1>
      <p className="mt-2 text-gray-600">
        これはログイン後のサンプルページです。簡単なタスク管理機能を実装しています。
      </p>

      <div className="mt-8">
        <div className="flex mt-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
          <button
            onClick={addTask}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            追加
          </button>
        </div>

        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center">
                      <input
                        id={`task-${task.id}`}
                        name={`task-${task.id}`}
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`ml-3 block text-sm font-medium ${
                          task.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {task.title}
                      </label>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {tasks.length === 0 && (
              <li>
                <div className="px-4 py-4 text-center text-sm text-gray-500">
                  タスクがありません。新しいタスクを追加してください。
                </div>
              </li>
            )}
          </ul>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {tasks.filter((task) => task.completed).length}/{tasks.length} 完了
        </div>
      </div>
    </div>
  );
};

export default Sample;

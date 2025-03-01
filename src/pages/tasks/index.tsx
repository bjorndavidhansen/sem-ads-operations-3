import { TaskList } from '../../components/task/task-list';

export function TasksPage() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TaskList />
      </div>
    </div>
  );
}
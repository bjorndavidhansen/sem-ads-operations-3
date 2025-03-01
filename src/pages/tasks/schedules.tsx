import { TaskScheduleList } from '../../components/task/task-schedule-list';

export function TaskSchedulesPage() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TaskScheduleList />
      </div>
    </div>
  );
}
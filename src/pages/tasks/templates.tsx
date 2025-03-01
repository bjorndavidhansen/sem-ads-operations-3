import { TaskTemplateList } from '../../components/task/task-template-list';

export function TaskTemplatesPage() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TaskTemplateList />
      </div>
    </div>
  );
}
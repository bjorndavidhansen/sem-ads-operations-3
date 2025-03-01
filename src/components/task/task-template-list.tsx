import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Copy, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { TaskTemplateForm } from './task-template-form';
import { taskTemplateApi, type TaskTemplate } from '../../lib/task-template-api';

interface TaskTemplateListProps {
  onSelect?: (template: TaskTemplate) => void;
}

export function TaskTemplateList({ onSelect }: TaskTemplateListProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskTemplateApi.listTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (input: any) => {
    try {
      setError(null);
      const newTemplate = await taskTemplateApi.createTemplate(input);
      setTemplates([...templates, newTemplate]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
      console.error('Error creating template:', err);
    }
  };

  const handleUpdate = async (input: any) => {
    if (!editingTemplate) return;

    try {
      setError(null);
      const updatedTemplate = await taskTemplateApi.updateTemplate(editingTemplate.id, input);
      setTemplates(templates.map(t => 
        t.id === updatedTemplate.id ? updatedTemplate : t
      ));
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
      console.error('Error updating template:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await taskTemplateApi.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      console.error('Error deleting template:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Task Templates</h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <TaskTemplateForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-4 rounded-lg border border-gray-200 bg-white"
          >
            {editingTemplate?.id === template.id ? (
              <TaskTemplateForm
                template={template}
                onSubmit={handleUpdate}
                onCancel={() => setEditingTemplate(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  {template.description && (
                    <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Type: {template.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelect(template)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  )}
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className={`h-4 w-4 ${deleting === template.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {templates.length === 0 && !showCreateForm && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Copy className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No templates created. Click "Create Template" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
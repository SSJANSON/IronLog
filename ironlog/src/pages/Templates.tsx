import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { TemplateCard } from '../components/templates/TemplateCard';
import { TemplateForm } from '../components/templates/TemplateForm';
import { useTemplateStore } from '../store/useTemplateStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { WorkoutTemplate, TemplateMovement } from '../types';

type Mode = 'list' | 'create' | 'edit';

export function Templates() {
  const navigate = useNavigate();
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  const [mode, setMode] = useState<Mode>('list');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  const handleCreate = (name: string, movements: TemplateMovement[]) => {
    addTemplate(name, movements);
    setMode('list');
  };

  const handleEdit = (name: string, movements: TemplateMovement[]) => {
    if (!editingTemplate) return;
    updateTemplate(editingTemplate.id, { name, movements });
    setEditingTemplate(null);
    setMode('list');
  };

  const handleStart = (template: WorkoutTemplate) => {
    startSession(template.id, template.name, template.movements);
    navigate('/session');
  };

  if (mode === 'create') {
    return (
      <div className="page">
        <Header title="New Template" showBack />
        <div className="page-content">
          <TemplateForm
            onSubmit={handleCreate}
            onCancel={() => setMode('list')}
          />
        </div>
      </div>
    );
  }

  if (mode === 'edit' && editingTemplate) {
    return (
      <div className="page">
        <Header title="Edit Template" showBack />
        <div className="page-content">
          <TemplateForm
            initial={editingTemplate}
            onSubmit={handleEdit}
            onCancel={() => {
              setEditingTemplate(null);
              setMode('list');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header
        title="Templates"
        right={
          <Button variant="primary" size="sm" onClick={() => setMode('create')}>
            + New
          </Button>
        }
      />
      <div className="page-content">
        {templates.length === 0 ? (
          <div className="empty-state">
            <p>No templates yet. Create one to get started.</p>
            <Button variant="primary" onClick={() => setMode('create')}>
              Create Template
            </Button>
          </div>
        ) : (
          <div className="template-list">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => {
                  setEditingTemplate(t);
                  setMode('edit');
                }}
                onDelete={() => deleteTemplate(t.id)}
                onStart={() => handleStart(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

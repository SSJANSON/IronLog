import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { TemplateCard } from '../components/templates/TemplateCard';
import { TemplateForm } from '../components/templates/TemplateForm';
import { useTemplateStore } from '../store/useTemplateStore';
import { useFolderStore } from '../store/useFolderStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { WorkoutTemplate, TemplateMovement, Accessory, TemplateFolder } from '../types';

const MAIN_LIFTS = ['squat', 'bench', 'deadlift'];
const LIFT_LABELS: Record<string, string> = { squat: 'SQ', bench: 'BP', deadlift: 'DL' };

type MoveTarget = { kind: 'template'; id: string } | { kind: 'folder'; id: string };

type Mode = 'list' | 'create' | 'edit';

export function Templates() {
  const navigate = useNavigate();
  const { templates, addTemplate, updateTemplate, deleteTemplate, moveTemplate } = useTemplateStore();
  const { folders, addFolder, deleteFolder, renameFolder, moveFolder } = useFolderStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  const [mode, setMode] = useState<Mode>('list');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'template' | 'folder'; id: string; name: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Breadcrumb path from root to current folder
  const getBreadcrumb = (): TemplateFolder[] => {
    const path: TemplateFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  };

  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentTemplates = templates.filter((t) => (t.folderId ?? null) === currentFolderId);
  const breadcrumb = getBreadcrumb();

  const handleCreate = (name: string, movements: TemplateMovement[], accessories: Accessory[]) => {
    addTemplate(name, movements, accessories, currentFolderId);
    setMode('list');
  };

  const handleEdit = (name: string, movements: TemplateMovement[], accessories: Accessory[]) => {
    if (!editingTemplate) return;
    updateTemplate(editingTemplate.id, { name, movements, accessories });
    setEditingTemplate(null);
    setMode('list');
  };

  const handleStart = (template: WorkoutTemplate) => {
    startSession(template.id, template.name, template.movements, template.accessories ?? []);
    navigate('/session');
  };

  const handleNewFolder = () => {
    setNewFolderMode(true);
    setNewFolderName('');
    setShowNewMenu(false);
    setTimeout(() => newFolderInputRef.current?.focus(), 50);
  };

  const commitNewFolder = () => {
    if (newFolderName.trim()) addFolder(newFolderName.trim(), currentFolderId);
    setNewFolderMode(false);
    setNewFolderName('');
  };

  const handleRenameFolder = (folder: TemplateFolder) => {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  };

  const getDescendantIds = (folderId: string): Set<string> => {
    const result = new Set<string>([folderId]);
    const children = folders.filter((f) => f.parentId === folderId);
    children.forEach((c) => getDescendantIds(c.id).forEach((id) => result.add(id)));
    return result;
  };

  const handleMove = (destinationId: string | null) => {
    if (!moveTarget) return;
    if (moveTarget.kind === 'template') {
      moveTemplate(moveTarget.id, destinationId);
    } else {
      moveFolder(moveTarget.id, destinationId);
    }
    setMoveTarget(null);
  };

  // Build flat ordered folder list with depth for the move picker
  const buildFolderTree = (parentId: string | null, depth: number): { folder: TemplateFolder; depth: number }[] => {
    const children = folders.filter((f) => f.parentId === parentId);
    return children.flatMap((f) => [{ folder: f, depth }, ...buildFolderTree(f.id, depth + 1)]);
  };

  const commitRename = () => {
    if (renamingFolderId && renameValue.trim()) {
      renameFolder(renamingFolderId, renameValue.trim());
    }
    setRenamingFolderId(null);
  };

  if (mode === 'create') {
    return (
      <div className="page">
        <Header title="New Template" showBack />
        <div className="page-content">
          <TemplateForm onSubmit={handleCreate} onCancel={() => setMode('list')} />
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
            onCancel={() => { setEditingTemplate(null); setMode('list'); }}
          />
        </div>
      </div>
    );
  }

  const title = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Templates';

  return (
    <div className="page">
      <Header
        title={title}
        showBack={currentFolderId !== null}
        onBack={() => setCurrentFolderId(breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].id : null)}
        right={
          <div className="tmpl-new-menu-wrap" ref={menuRef}>
            <Button variant="primary" size="sm" onClick={() => setShowNewMenu((v) => !v)}>
              + New
            </Button>
            {showNewMenu && (
              <div className="tmpl-new-menu">
                <button className="tmpl-new-menu__item" onClick={() => { setMode('create'); setShowNewMenu(false); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                  New Template
                </button>
                <button className="tmpl-new-menu__item" onClick={handleNewFolder}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>create_new_folder</span>
                  New Folder
                </button>
                {currentFolderId !== null && (
                  <button className="tmpl-new-menu__item" onClick={() => { setShowAddExisting(true); setShowNewMenu(false); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>library_add</span>
                    Add Existing Template
                  </button>
                )}
              </div>
            )}
          </div>
        }
      />

      <div className="page-content">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="tmpl-breadcrumb">
            <button className="tmpl-breadcrumb__item" onClick={() => setCurrentFolderId(null)}>Templates</button>
            {breadcrumb.map((f, i) => (
              <span key={f.id} className="tmpl-breadcrumb__sep-wrap">
                <span className="tmpl-breadcrumb__sep">›</span>
                {i < breadcrumb.length - 1 ? (
                  <button className="tmpl-breadcrumb__item" onClick={() => setCurrentFolderId(f.id)}>{f.name}</button>
                ) : (
                  <span className="tmpl-breadcrumb__item tmpl-breadcrumb__item--current">{f.name}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {currentFolders.length === 0 && currentTemplates.length === 0 && !newFolderMode ? (
          <div className="empty-state">
            <p>{currentFolderId ? 'This folder is empty.' : 'No templates yet. Create one to get started.'}</p>
            <Button variant="primary" onClick={() => setMode('create')}>Create Template</Button>
          </div>
        ) : (
          <div className="template-list">
            {/* New folder input row */}
            {newFolderMode && (
              <div className="folder-card folder-card--new">
                <div className="folder-card__main">
                  <span className="material-symbols-outlined folder-card__icon">create_new_folder</span>
                  <input
                    ref={newFolderInputRef}
                    className="folder-card__rename-input"
                    placeholder="Folder name…"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitNewFolder(); if (e.key === 'Escape') { setNewFolderMode(false); } }}
                    onBlur={commitNewFolder}
                  />
                </div>
              </div>
            )}

            {/* Folders first */}
            {currentFolders.map((folder) => {
              const folderTemplates = templates.filter((t) => t.folderId === folder.id);
              return (
                <div key={folder.id} className="folder-card">
                  {/* Folder header */}
                  <div className="folder-card__header">
                    <div className="folder-card__title-row">
                      <span className="material-symbols-outlined folder-card__icon" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                      {renamingFolderId === folder.id ? (
                        <input
                          className="folder-card__rename-input"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingFolderId(null); }}
                        />
                      ) : (
                        <span className="folder-card__name">{folder.name}</span>
                      )}
                      {folderTemplates.length > 0 && (
                        <span className="folder-card__count-badge">{folderTemplates.length} {folderTemplates.length === 1 ? 'routine' : 'routines'}</span>
                      )}
                    </div>
                    <div className="folder-card__actions">
                      <button className="tmpl-card-action-btn" onClick={() => handleRenameFolder(folder)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                      </button>
                      <button className="tmpl-card-action-btn" onClick={() => setMoveTarget({ kind: 'folder', id: folder.id })}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>drive_file_move</span>
                      </button>
                      <button
                        className="tmpl-card-action-btn tmpl-card-action-btn--danger"
                        onClick={() => setDeleteConfirm({ kind: 'folder', id: folder.id, name: folder.name })}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Template items */}
                  {folderTemplates.length > 0 && (
                    <div className="folder-card__templates">
                      {folderTemplates.map((t) => {
                        const mainMovements = t.movements.filter((m) => MAIN_LIFTS.includes(m.name));
                        return (
                          <div key={t.id} className="folder-card__tmpl-item">
                            <span className="folder-card__tmpl-name">{t.name}</span>
                            {mainMovements.length > 0 && (
                              <div className="folder-card__tmpl-pills">
                                {mainMovements.map((m) => (
                                  <span key={m.name} className="folder-card__tmpl-pill">
                                    {m.name.charAt(0).toUpperCase() + m.name.slice(1)} {m.targetSets}×{m.targetReps}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button className="folder-card__open-btn" onClick={() => setCurrentFolderId(folder.id)}>
                    Open Folder
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              );
            })}

            {/* Templates */}
            {currentTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => { setEditingTemplate(t); setMode('edit'); }}
                onDelete={() => setDeleteConfirm({ kind: 'template', id: t.id, name: t.name })}
                onStart={() => handleStart(t)}
                onMove={() => setMoveTarget({ kind: 'template', id: t.id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="pr-dialog-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="pr-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="pr-dialog__header" style={{ borderBottom: 'none' }}>
              <div className="pr-dialog__title-row">
                <span className="material-symbols-outlined pr-dialog__trophy" style={{ color: 'var(--color-danger)' }}>delete</span>
                <h2 className="pr-dialog__title">Delete {deleteConfirm.kind === 'folder' ? 'Folder' : 'Template'}?</h2>
              </div>
              <span className="pr-dialog__sub">
                {deleteConfirm.kind === 'folder'
                  ? `"${deleteConfirm.name}" and all its subfolders will be deleted. Templates inside will be moved to root.`
                  : `"${deleteConfirm.name}" will be permanently deleted.`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', padding: '0 var(--space-4) var(--space-4)' }}>
              <button
                className="pr-dialog__close"
                style={{ flex: 1, margin: 0, borderRadius: 'var(--radius-md)' }}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="pr-dialog__close"
                style={{ flex: 1, margin: 0, borderRadius: 'var(--radius-md)', background: 'var(--color-danger)', color: '#fff', border: 'none' }}
                onClick={() => {
                  if (deleteConfirm.kind === 'folder') deleteFolder(deleteConfirm.id);
                  else deleteTemplate(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move modal */}
      {moveTarget && (() => {
        const excludeIds = moveTarget.kind === 'folder' ? getDescendantIds(moveTarget.id) : new Set<string>();
        const movingItem = moveTarget.kind === 'template'
          ? templates.find((t) => t.id === moveTarget.id)
          : folders.find((f) => f.id === moveTarget.id);
        const tree = buildFolderTree(null, 0).filter((n) => !excludeIds.has(n.folder.id));
        return (
          <div className="pr-dialog-backdrop" onClick={() => setMoveTarget(null)}>
            <div className="pr-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="pr-dialog__header">
                <div className="pr-dialog__title-row">
                  <span className="material-symbols-outlined pr-dialog__trophy">drive_file_move</span>
                  <h2 className="pr-dialog__title">Move to…</h2>
                </div>
                <span className="pr-dialog__sub">{movingItem?.name}</span>
              </div>
              <div className="pr-dialog__list">
                <button className="tmpl-move-dest-row" onClick={() => handleMove(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-accent)' }}>home</span>
                  <span>Templates (root)</span>
                </button>
                {tree.map(({ folder, depth }) => (
                  <button
                    key={folder.id}
                    className="tmpl-move-dest-row"
                    style={{ paddingLeft: `calc(var(--space-3) + ${depth * 16}px)` }}
                    onClick={() => handleMove(folder.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-accent)' }}>folder</span>
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
              <button className="pr-dialog__close" onClick={() => setMoveTarget(null)}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* Add Existing Template overlay */}
      {showAddExisting && (
        <div className="pr-dialog-backdrop" onClick={() => setShowAddExisting(false)}>
          <div className="pr-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="pr-dialog__header">
              <div className="pr-dialog__title-row">
                <span className="material-symbols-outlined pr-dialog__trophy">library_add</span>
                <h2 className="pr-dialog__title">Add Template</h2>
              </div>
              <span className="pr-dialog__sub">Select a template to add to this folder</span>
            </div>
            <div className="pr-dialog__list">
              {templates.filter((t) => (t.folderId ?? null) !== currentFolderId).length === 0 ? (
                <p style={{ color: 'var(--color-text-disabled)', fontSize: 13 }}>No other templates available</p>
              ) : (
                templates
                  .filter((t) => (t.folderId ?? null) !== currentFolderId)
                  .map((t) => (
                    <button
                      key={t.id}
                      className="tmpl-add-existing-row"
                      onClick={() => { moveTemplate(t.id, currentFolderId); setShowAddExisting(false); }}
                    >
                      <span className="tmpl-add-existing-name">{t.name}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-text-disabled)' }}>add</span>
                    </button>
                  ))
              )}
            </div>
            <button className="pr-dialog__close" onClick={() => setShowAddExisting(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

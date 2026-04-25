'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestionFolder } from '@/types/question';
import { Checkbox } from '@/components/ui/checkbox';

interface FolderTreeProps {
  folders: QuestionFolder[];
  selectedFolderIds: string[];
  onSelectFolders: (ids: string[]) => void;
  onEditFolder: (folder: QuestionFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  activeFolderId?: string;
  onActiveFolderChange?: (id: string) => void;
  searchQuery?: string;
}

export function FolderTree({
  folders,
  selectedFolderIds,
  onSelectFolders,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  activeFolderId,
  onActiveFolderChange,
  searchQuery = '',
}: FolderTreeProps) {
  const [expandedIds, setExpandedSet] = useState<Set<string>>(new Set());
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const parentById = useMemo(() => {
    const map = new Map<string, string | null>();
    folders.forEach((f) => map.set(f.id, f.parentFolderId ?? null));
    return map;
  }, [folders]);

  const expandPathToRoot = (folderId: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      let currentParent = parentById.get(folderId) ?? null;
      while (currentParent) {
        next.add(currentParent);
        currentParent = parentById.get(currentParent) ?? null;
      }
      return next;
    });
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isSelected = (id: string) => selectedFolderIds.includes(id);

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      onSelectFolders([...selectedFolderIds, id]);
    } else {
      onSelectFolders(selectedFolderIds.filter(fid => fid !== id));
    }
  };

  const buildTree = (parentId: string | null = null): QuestionFolder[] => {
    return folders
      .filter(f => f.parentFolderId === parentId)
      .map(f => ({
        ...f,
        children: buildTree(f.id)
      }));
  };

  const tree = buildTree(null);

  useEffect(() => {
    if (activeFolderId) {
      expandPathToRoot(activeFolderId);
    }
  }, [activeFolderId, parentById]);

  const filteredTree = useMemo(() => {
    if (!normalizedQuery) return tree;

    const includeIfMatchOrDescendant = (node: QuestionFolder): QuestionFolder | null => {
      const ownMatch = node.name.toLowerCase().includes(normalizedQuery);
      const childMatches = (node.children || [])
        .map(includeIfMatchOrDescendant)
        .filter(Boolean) as QuestionFolder[];
      if (ownMatch || childMatches.length > 0) {
        return { ...node, children: childMatches };
      }
      return null;
    };

    return tree
      .map(includeIfMatchOrDescendant)
      .filter(Boolean) as QuestionFolder[];
  }, [tree, normalizedQuery]);

  useEffect(() => {
    if (!normalizedQuery) return;
    const next = new Set<string>();
    const walk = (nodes: QuestionFolder[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          next.add(n.id);
          walk(n.children);
        }
      });
    };
    walk(filteredTree);
    setExpandedSet(next);
  }, [normalizedQuery, filteredTree]);

  const expandAll = () => {
    setExpandedSet(new Set(folders.map((f) => f.id)));
  };

  const collapseAll = () => {
    setExpandedSet(new Set());
  };

  const renderNode = (node: QuestionFolder, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activeFolderId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div 
          onClick={() => {
            onActiveFolderChange?.(node.id);
            expandPathToRoot(node.id);
          }}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200",
            isActive ? "bg-indigo-50 text-indigo-700 shadow-sm" : "hover:bg-slate-50 text-slate-600"
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          <div 
            onClick={(e) => hasChildren && toggleExpand(e, node.id)}
            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-200/50 transition-colors"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <div className="w-1 h-1 rounded-full bg-slate-300" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox 
              checked={isSelected(node.id)} 
              onCheckedChange={(checked) => handleSelect(node.id, !!checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            
            {isExpanded ? (
              <FolderOpen className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "text-amber-400")} />
            ) : (
              <Folder className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "text-amber-400")} />
            )}
            
            <span className={cn("truncate text-sm font-bold tracking-tight", isActive ? "font-black" : "font-bold")}>
              {node.name}
            </span>
            
            {node._count?.questions !== undefined && (
              <span className="ml-auto px-1.5 py-0.5 rounded-lg bg-slate-100 text-[9px] font-black text-slate-400 uppercase">
                {node._count.questions}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onCreateSubfolder(node.id); }}
              className="p-1 rounded-lg hover:bg-white hover:text-emerald-600 hover:shadow-sm"
              title="Add Subfolder"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEditFolder(node); }}
              className="p-1 rounded-lg hover:bg-white hover:text-amber-600 hover:shadow-sm"
              title="Edit Folder"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(node.id); }}
              className="p-1 rounded-lg hover:bg-white hover:text-rose-600 hover:shadow-sm"
              title="Delete Folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children?.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1 px-1">
        <button
          onClick={expandAll}
          className="h-7 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Expand all folders"
        >
          <ChevronsDown className="h-3 w-3 inline mr-1" />
          Expand
        </button>
        <button
          onClick={collapseAll}
          className="h-7 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Collapse all folders"
        >
          <ChevronsUp className="h-3 w-3 inline mr-1" />
          Collapse
        </button>
      </div>

      {filteredTree.length > 0 ? (
        filteredTree.map(node => renderNode(node))
      ) : (
        <div className="px-4 py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
           <Folder className="h-8 w-8 text-slate-200 mx-auto mb-3" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
             {normalizedQuery ? 'No matching folders found' : 'No organizational structure established'}
           </p>
        </div>
      )}
    </div>
  );
}

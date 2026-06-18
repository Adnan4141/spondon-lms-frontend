'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { field } from './course-form-ui';
import type { CourseFormController } from '../hooks/useCourseForm';

export function CourseFormRenameDialog({ ctrl }: { ctrl: CourseFormController }) {
  const {
    renameModal,
    setRenameModal,
    renameInput,
    setRenameInput,
    submitRename,
    subjectRenaming,
  } = ctrl;

  return (
    <Dialog
      open={renameModal.open}
      onOpenChange={(open) => setRenameModal((prev) => ({ ...prev, open }))}
    >
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Rename Subject</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="text-xs text-slate-500">
            Updates the subject name across all chapters and segments within it.
          </p>
          <Input
            className={field}
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="e.g. Physics"
            autoFocus
          />
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRenameModal({ open: false, subject: '' })}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submitRename}
            disabled={subjectRenaming || !renameInput.trim()}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {subjectRenaming ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

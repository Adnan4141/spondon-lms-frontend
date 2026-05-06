import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CommunityAdminFilters({
  search,
  status,
  visibility,
  courses = [],
  doubtCourseId = 'all',
  doubtStatus = 'all',
  showDoubtCourse = false,
  onSearch,
  onStatus,
  onVisibility,
  onDoubtCourse,
  onDoubtStatus,
}: {
  search: string;
  status: string;
  visibility: string;
  courses?: Array<{ id: string; name: string }>;
  doubtCourseId?: string;
  doubtStatus?: string;
  showDoubtCourse?: boolean;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onVisibility: (value: string) => void;
  onDoubtCourse?: (value: string) => void;
  onDoubtStatus?: (value: string) => void;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_210px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search communities, posts, or doubts..."
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9"
          />
        </div>
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={visibility} onValueChange={onVisibility}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All visibility</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="COURSE_ONLY">Course only</SelectItem>
            <SelectItem value="MEMBERS_ONLY">Members only</SelectItem>
          </SelectContent>
        </Select>
        {showDoubtCourse ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
            <Select value={doubtCourseId} onValueChange={onDoubtCourse ?? (() => undefined)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Q&A courses</SelectItem>
                <SelectItem value="unassigned">Unassigned legacy</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={doubtStatus} onValueChange={onDoubtStatus ?? (() => undefined)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Q&A status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="hidden lg:block" />
        )}
      </CardContent>
    </Card>
  );
}

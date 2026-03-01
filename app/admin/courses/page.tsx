'use client';

import { useEffect, useState } from 'react';
import { getCourses, GetCoursesParams } from '@/lib/api/courses';
import { Course, CourseStatus, CourseType } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, RefreshCw } from 'lucide-react';

const statusOptions: (CourseStatus | 'all')[] = ['all', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: (CourseType | 'all')[] = ['all', 'ONLINE', 'OFFLINE', 'HYBRID'];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CourseType | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetCoursesParams = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await getCourses(params);

      if (response.success && response.data) {
        let filteredCourses = response.data;

        // Client-side filtering for search and type
        if (searchQuery.trim()) {
          filteredCourses = filteredCourses.filter(
            (course) =>
              course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.program?.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        if (typeFilter !== 'all') {
          filteredCourses = filteredCourses.filter((course) => course.type === typeFilter);
        }

        setCourses(filteredCourses);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setCourses([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadCourses();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter]);

  const getStatusBadgeVariant = (status: CourseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'DISABLED':
        return 'secondary';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type: CourseType) => {
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Manage all courses in the system</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses by name, code, or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CourseStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === 'all' ? 'All Status' : opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CourseType | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === 'all' ? 'All Types' : opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadCourses}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No courses found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono text-sm">{course.code}</TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.program?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(course.type)}>{course.type}</Badge>
                  </TableCell>
                  <TableCell>{course.billingType}</TableCell>
                  <TableCell>৳{Number(course.fee).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(course.status)}>
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {course.featured ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>{course._count?.enrollments || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type MyCourseRow = {
  id: string;
  courseId: string;
  course?: { id: string; name: string; slug?: string | null };
};

export type DashboardStats = {
  myCourses: number;
  myBooks: number;
  myExams: number;
  results: number;
};

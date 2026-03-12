import { apiRequest } from '../api';
import type { Student, CreateStudentDto, UpdateStudentDto, ApiResponse } from '@/types/student';
export type { Student, CreateStudentDto, UpdateStudentDto, ApiResponse };

export async function getStudents(params?: {
  role?: string;
  branchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Student[]>> {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Student[]>>(`/users${query ? `?${query}` : ''}`);
}

export async function getStudentById(id: string): Promise<ApiResponse<Student>> {
  return apiRequest<ApiResponse<Student>>(`/users/${id}`);
}

export async function createStudent(data: CreateStudentDto): Promise<ApiResponse<Student>> {
  // First create the user
  const userData = {
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
    password: data.password,
    role: 'STUDENT' as const,
    branchId: data.branchId,
    status: data.status || 'ACTIVE',
  };

  const userResponse = await apiRequest<ApiResponse<Student>>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (!userResponse.success || !userResponse.data) {
    return userResponse;
  }

  // Then create/update the student profile if any profile data is provided
  if (
    data.fatherName ||
    data.motherName ||
    data.dob ||
    data.bloodGroup ||
    data.gender ||
    data.primaryMobile ||
    data.secondaryMobile ||
    data.address ||
    data.instituteId ||
    data.registrationNumber ||
    data.sscInfo ||
    data.hscInfo
  ) {
    const profileData = {
      userId: userResponse.data.id,
      fatherName: data.fatherName,
      motherName: data.motherName,
      dob: data.dob,
      bloodGroup: data.bloodGroup,
      gender: data.gender,
      primaryMobile: data.primaryMobile,
      secondaryMobile: data.secondaryMobile,
      address: data.address,
      instituteId: data.instituteId,
      registrationNumber: data.registrationNumber,
      sscInfo: data.sscInfo,
      hscInfo: data.hscInfo,
    };

    await apiRequest('/student-profiles/upsert', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Fetch the complete student data
  return getStudentById(userResponse.data.id);
}

export async function updateStudent(id: string, data: UpdateStudentDto): Promise<ApiResponse<Student>> {
  // Update user fields
  const userData: any = {};
  if (data.fullName) userData.fullName = data.fullName;
  if (data.email !== undefined) userData.email = data.email;
  if (data.mobile) userData.mobile = data.mobile;
  if (data.password) userData.password = data.password;
  if (data.branchId !== undefined) userData.branchId = data.branchId;
  if (data.status) userData.status = data.status;

  if (Object.keys(userData).length > 0) {
    await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Update student profile if any profile data is provided
  if (
    data.fatherName !== undefined ||
    data.motherName !== undefined ||
    data.dob !== undefined ||
    data.bloodGroup !== undefined ||
    data.gender !== undefined ||
    data.primaryMobile !== undefined ||
    data.secondaryMobile !== undefined ||
    data.address !== undefined ||
    data.instituteId !== undefined ||
    data.registrationNumber !== undefined ||
    data.sscInfo !== undefined ||
    data.hscInfo !== undefined
  ) {
    const profileData: any = {
      userId: id,
    };
    if (data.fatherName !== undefined) profileData.fatherName = data.fatherName;
    if (data.motherName !== undefined) profileData.motherName = data.motherName;
    if (data.dob !== undefined) profileData.dob = data.dob;
    if (data.bloodGroup !== undefined) profileData.bloodGroup = data.bloodGroup;
    if (data.gender !== undefined) profileData.gender = data.gender;
    if (data.primaryMobile !== undefined) profileData.primaryMobile = data.primaryMobile;
    if (data.secondaryMobile !== undefined) profileData.secondaryMobile = data.secondaryMobile;
    if (data.address !== undefined) profileData.address = data.address;
    if (data.instituteId !== undefined) profileData.instituteId = data.instituteId;
    if (data.registrationNumber !== undefined) profileData.registrationNumber = data.registrationNumber;
    if (data.sscInfo !== undefined) profileData.sscInfo = data.sscInfo;
    if (data.hscInfo !== undefined) profileData.hscInfo = data.hscInfo;

    await apiRequest('/student-profiles/upsert', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Fetch the complete student data
  return getStudentById(id);
}

export async function deleteStudent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/users/${id}`, {
    method: 'DELETE',
  });
}

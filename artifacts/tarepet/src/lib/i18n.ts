// Lightweight internationalization (i18n) utility for Tarepet Montessori
// Supports string lookup and fallback for UI localization safely without prototype pollution.

const defaultTranslations = new Map<string, string>([
  ['school.name', 'Tarepet Montessori School'],
  ['school.location', 'Yenagoa, Bayelsa State'],
  ['school.abbr', 'TMS'],
  ['teacher.id_card_official_title', 'Official Student ID Card'],
  ['teacher.id_card_student_id', 'STUDENT ID:'],
  ['teacher.id_card_valid_until', 'VALID UNTIL:'],
  ['teacher.id_card_valid_date', 'DEC 2028'],
  ['teacher.btn_print_id', 'Print ID Card'],
  ['teacher.btn_download_pdf', 'Download PDF'],
  ['teacher.general', 'General'],
  ['teacher.default_house', 'Blue House (Eagle)'],
  ['teacher.profile_title', 'Teacher Official Profile'],
  ['teacher.profile_desc', 'View and update your personal information, teaching assignments, and staff credentials.'],
  ['teacher.staff_id_label', 'STAFF ID:'],
  ['teacher.staff_id_title', 'Official Staff ID Card'],
  ['teacher.edit_profile', 'Edit Profile'],
  ['teacher.view_staff_id', 'View Staff ID Card'],
  ['teacher.personal_info', 'Personal & Contact Information'],
  ['teacher.teaching_assignments', 'Teaching Assignments & Schedule'],
  ['teacher.qualifications', 'Certifications & Qualifications'],
  ['common.administrator', 'Administrator'],
  ['teacher.btn_print_profile', 'Print Profile'],
  ['teacher.form_teacher_prefix', 'Form Teacher: '],
  ['teacher.form_class', 'Form Class'],
  ['teacher.students_supervised', 'Students Supervised'],
  ['teacher.service_duration', 'Service Duration'],
  ['teacher.status', 'Status'],
  ['teacher.active_verified', 'Active / Verified'],
  ['teacher.full_name', 'Full Name'],
  ['teacher.staff_designation_code', 'Staff Designation Code'],
  ['teacher.official_email', 'Official Email Address'],
  ['teacher.phone_contact', 'Phone Contact'],
  ['teacher.gender_dob', 'Gender / Date of Birth'],
  ['teacher.first_appointment_date', 'First Appointment Date'],
  ['teacher.residential_address', 'Residential Address'],
  ['teacher.specialization_in', 'Specialization in '],
  ['teacher.philosophy_statement', 'Professional Philosophy Statement'],
  ['teacher.form_teacher_class', 'Form Teacher Class'],
  ['teacher.assigned_subjects', 'Assigned Subjects'],
  ['teacher.consultation_hours', 'Consultation / Office Hours'],
  ['teacher.faculty_staff_identity', 'FACULTY / STAFF IDENTITY'],
  ['teacher.valid_until_dec_2028', 'VALID UNTIL DEC 2028'],
  ['teacher.expand_print_id', 'Expand & Print ID Card'],
  ['teacher.official_staff_account', 'Tarepet Montessori School — Official Staff Account'],
  ['teacher.active_students', 'Active'],
  ['teacher.science', 'Science'],
]);

export function t(key: string, fallback?: string): string {
  if (typeof key !== 'string' || key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return fallback ?? String(key);
  }
  if (defaultTranslations.has(key)) {
    return defaultTranslations.get(key) ?? fallback ?? key;
  }
  return fallback ?? key;
}

export function useTranslation() {
  return {
    t: (key: string, fallback?: string) => t(key, fallback),
    i18n: {
      language: 'en',
      changeLanguage: async (_lang: string) => {
        // Safe placeholder for dynamic translation pack loading
      },
    },
  };
}

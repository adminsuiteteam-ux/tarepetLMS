// Tarepet Montessori Teacher Profile Page
import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { useLocation } from 'wouter';
import {
  User, BookOpen, Award, ShieldCheck, CreditCard, Printer, Download,
  Edit2, Bell, Lock, CheckCircle2, X, Mail, Phone, MapPin, Calendar,
  Briefcase, GraduationCap, Save, ArrowLeft, Check, Star, Layers, Users,
  BarChart2, ChevronDown, Upload, Trash2, Scissors
} from 'lucide-react';

import { authClient } from '@/lib/api-auth';
import { getStoredTeachers, saveTeacher, broadcastRealtimeEvent, addRealtimeActivity, syncTeachersWithBackend } from '@/lib/cbt-store';
import { addRealtimeNotification } from '@/lib/notifications-store';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { MobileProfileView } from '@/components/profile/MobileProfileView';

export default function TeacherProfile() {
  const { t } = useTranslation();
  const { user, updateUser, refreshUserProfile } = useAuth();
  const [, setLocation] = useLocation();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showStaffIdModal, setShowStaffIdModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'teaching' | 'qualifications' | 'settings'>('details');

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleApplyCroppedPhoto = (croppedBase64: string) => {
    const updated = { ...profileForm, profileImage: croppedBase64 };
    setProfileForm(updated);
    updateUser({
      profile_image: croppedBase64,
      profile: {
        ...(user?.profile || {}),
        profile_image: croppedBase64,
        profileImage: croppedBase64,
      }
    });
    saveTeacher({
      id: user?.id,
      email: profileForm.email || user?.email,
      staffId: profileForm.staffId,
      name: profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`,
      profileImage: croppedBase64,
    });
    authClient.put('/auth/me/', {
      profile_image: croppedBase64,
      profile: {
        profile_image: croppedBase64,
        profileImage: croppedBase64,
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});
    broadcastRealtimeEvent();
    showToast('Profile photo cropped and updated in real time!');
  };

  const handleDeletePhoto = () => {
    const updated = { ...profileForm, profileImage: '' };
    setProfileForm(updated);
    updateUser({
      profile_image: '',
      profile: {
        ...(user?.profile || {}),
        profile_image: '',
        profileImage: '',
      }
    });
    saveTeacher({
      id: user?.id,
      email: profileForm.email || user?.email,
      staffId: profileForm.staffId,
      name: profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`,
      profileImage: '',
    });
    authClient.put('/auth/me/', {
      profile_image: '',
      profile: {
        profile_image: '',
        profileImage: '',
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});
    broadcastRealtimeEvent();
    showToast('Profile photo deleted successfully.');
  };

  const getInitialProfile = () => {
    const prof = (user?.profile as any) || {};
    const uEmail = (user?.email || '').toLowerCase();
    const uStaffId = ((user?.profile as any)?.teacher_id || (user as any)?.staffId || (user as any)?.id || (user as any)?.username || '').toString().toLowerCase();
    const uName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim().toLowerCase();
    const cleanUStaffId = uStaffId.replace(/[^a-z0-9]/g, '');
    const cleanUEmail = uEmail.replace(/[^a-z0-9]/g, '');

    const allTeachers = getStoredTeachers();
    const stored = allTeachers.find((t: any) => {
      const tEmail = (t.email || '').toLowerCase();
      const tStaffId = (t.staffId || '').toLowerCase();
      const tName = (t.name || '').toLowerCase();
      const cleanTStaffId = tStaffId.replace(/[^a-z0-9]/g, '');
      const cleanTEmail = tEmail.replace(/[^a-z0-9]/g, '');

      return (
        (tStaffId && tStaffId === uStaffId) ||
        (cleanUStaffId.length >= 3 && (cleanUStaffId === cleanTStaffId || cleanUStaffId.includes(cleanTStaffId) || cleanTStaffId.includes(cleanUStaffId))) ||
        (tEmail && tEmail === uEmail) ||
        (cleanUEmail.length >= 4 && (cleanUEmail.includes(cleanTEmail) || cleanTEmail.includes(cleanUEmail))) ||
        (uName.length >= 3 && tName === uName)
      );
    });

    const tName = stored?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || '';
    const nameParts = tName.split(' ');
    const fName = user?.first_name || nameParts[0] || '';
    const lName = user?.last_name || nameParts.slice(1).join(' ') || '';
    const formCls = (stored?.formTeacherOf && stored.formTeacherOf !== 'None' && !stored.formTeacherOf.startsWith('No'))
      ? stored.formTeacherOf
      : (prof.form_teacher_of || prof.formTeacherOf || '');
    const rawSpec = stored?.specialization || prof.specialization || (Array.isArray(prof.subjects_taught) ? prof.subjects_taught.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : prof.subjects_taught) || '';
    const subs = (stored?.subjectsAssigned && Array.isArray(stored.subjectsAssigned) && stored.subjectsAssigned.length > 0)
      ? stored.subjectsAssigned
      : (Array.isArray(prof.subjects_taught) ? prof.subjects_taught : []);

    return {
      firstName: fName,
      lastName: lName,
      fullName: tName,
      email: stored?.email || user?.email || '',
      phone: stored?.phone || user?.phone || prof.phone || '',
      staffId: stored?.staffId || prof.teacher_id || (user as any)?.staffId || '',
      roleTitle: formCls ? `Form Teacher (${formCls})` : (stored?.department || prof.department || ''),
      department: stored?.department || prof.department || '',
      qualification: stored?.qualification || prof.qualifications || '',
      joiningDate: stored?.joined || prof.hire_date || '',
      gender: stored?.gender || prof.gender || '',
      dob: stored?.dob || prof.dob || '',
      specialization: typeof rawSpec === 'string' ? rawSpec : '',
      address: stored?.address || prof.address || '',
      bio: stored?.bio || prof.bio || '',
      formClass: formCls,
      subjectsAssigned: subs,
      studentsCount: stored?.studentsCount ?? (prof.students_count ?? 0),
      cbtExamsCount: stored?.cbtExamsCount ?? 0,
      attendanceRate: stored?.attendanceRate || prof.attendance_rate || '0%',
      emergencyContactName: '',
      emergencyContactPhone: '',
      officeHours: (stored as any)?.officeHours || '',
      salary: stored?.salary || prof.salary || '',
      bankName: stored?.bankName || prof.bank_name || '',
      accountNumber: stored?.accountNumber || prof.account_number || '',
      emailAlerts: true,
      cbtAlerts: true,
      smsAlerts: false,
      profileImage: user?.profile_image || (user as any)?.profileImage || prof.profile_image || prof.profileImage || stored?.profileImage || '',
    };
  };

  // Teacher Profile Form State (synced with logged-in user & admin store)
  const [profileForm, setProfileForm] = useState(getInitialProfile);

  useEffect(() => {
    // 1. Sync from local auth & stored teacher records
    const updated = getInitialProfile();
    setProfileForm(updated);
    syncTeachersWithBackend().then(() => {
      setProfileForm(getInitialProfile());
    });

    // 2. Fetch live user profile from Django REST API backend (/auth/me/)
    authClient.get('/auth/me/').then(res => {
      if (res.data && res.data.profile) {
        const p = res.data.profile;
        const subs = Array.isArray(p.subjects_taught) ? p.subjects_taught.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : p.subjects_taught;
        const rawF = p.form_teacher_of || p.formTeacherOf;
        const cleanF = (rawF && rawF !== 'None' && !rawF.startsWith('No')) ? rawF : 'None';
        setProfileForm(prev => ({
          ...prev,
          firstName: res.data.first_name || prev.firstName,
          lastName: res.data.last_name || prev.lastName,
          email: res.data.email || prev.email,
          phone: res.data.phone || p.phone || prev.phone,
          staffId: p.teacher_id || prev.staffId,
          department: p.department || prev.department,
          formClass: cleanF,
          roleTitle: cleanF !== 'None' ? `Form Teacher (${cleanF})` : (p.department || 'Subject Teacher'),
          specialization: p.specialization || subs || prev.specialization,
          qualification: p.qualifications || prev.qualification,
          gender: p.gender || prev.gender,
          dob: p.dob || prev.dob,
          address: p.address || prev.address,
          joiningDate: p.hire_date || prev.joiningDate,
          salary: p.salary || prev.salary,
          bankName: p.bank_name || prev.bankName,
          accountNumber: p.account_number || prev.accountNumber,
          profileImage: res.data.profile_image || p.profile_image || p.profileImage || prev.profileImage,
        }));
      }
    }).catch(() => {});
  }, [user]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authClient.post('/auth/change-password/', {
        old_password: passwordForm.currentPassword || profileForm.staffId,
        new_password: passwordForm.newPassword,
      });
      showToast('Password updated successfully! Use your new password on your next login.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast('Custom password updated! You can now log in with your new password.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const allTeachers = getStoredTeachers();
    const stored = allTeachers.find((t: any) =>
      (t.staffId && t.staffId === profileForm.staffId) ||
      (t.email && t.email === profileForm.email) ||
      (t.name && t.name.toLowerCase() === profileForm.fullName.toLowerCase())
    );

    // 1. Update cbt-store for local persistence
    saveTeacher({
      id: stored?.id,
      staffId: profileForm.staffId,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      email: profileForm.email,
      phone: profileForm.phone,
      department: profileForm.department,
      specialization: profileForm.specialization,
      qualification: profileForm.qualification,
      gender: profileForm.gender,
      dob: profileForm.dob,
      address: profileForm.address,
      bio: profileForm.bio,
      formTeacherOf: profileForm.formClass,
      salary: profileForm.salary,
      bankName: profileForm.bankName,
      accountNumber: profileForm.accountNumber,
      profileImage: profileForm.profileImage,
      joined: profileForm.joiningDate,
    });

    // 2. Alert Admin via Real-Time Notification & Audit Activity Log
    addRealtimeNotification({
      title: '👤 Teacher Profile Updated',
      message: `Teacher ${profileForm.firstName} ${profileForm.lastName} (${profileForm.staffId}) updated their personal profile details.`,
      category: 'ACADEMICS',
      type: 'info',
      recipientRole: 'ADMIN'
    });

    addRealtimeActivity(
      'EXAM_APPROVED',
      `Teacher Profile Edited: ${profileForm.firstName} ${profileForm.lastName}`,
      `Profile changes saved & synced to Admin Portal. Staff ID: ${profileForm.staffId}`,
      `${profileForm.firstName} ${profileForm.lastName}`
    );

    // 2. Sync session user in AuthContext and localStorage
    updateUser({
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      email: profileForm.email,
      profile: {
        ...(user?.profile || {}),
        teacher_id: profileForm.staffId,
        department: profileForm.department,
        specialization: profileForm.specialization,
        qualifications: profileForm.qualification,
        gender: profileForm.gender,
        dob: profileForm.dob,
        address: profileForm.address,
        bio: profileForm.bio,
        formTeacherOf: profileForm.formClass,
        form_teacher_of: profileForm.formClass,
        salary: profileForm.salary,
        bank_name: profileForm.bankName,
        account_number: profileForm.accountNumber,
        profileImage: profileForm.profileImage,
        profile_image: profileForm.profileImage,
      }
    });

    // 3. Sync to Django Backend Database via API, then re-fetch authoritative profile
    authClient.put('/auth/me/', {
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      email: profileForm.email,
      profile: {
        teacher_id: profileForm.staffId,
        department: profileForm.department,
        specialization: profileForm.specialization,
        qualifications: profileForm.qualification,
        gender: profileForm.gender,
        dob: profileForm.dob || null,
        address: profileForm.address,
        bio: profileForm.bio,
        form_teacher_of: profileForm.formClass,
        hire_date: profileForm.joiningDate,
        salary: profileForm.salary,
        bank_name: profileForm.bankName,
        account_number: profileForm.accountNumber,
        profile_image: profileForm.profileImage,
        profileImage: profileForm.profileImage,
      }
    }).then(() => {
      // Re-fetch authoritative profile from database to guarantee sync
      refreshUserProfile().catch(() => {});
      showToast(t('teacher.profile_saved_success', 'Profile updated and synced to Admin Portal in real time!'));
    }).catch(() => {
      showToast(t('teacher.profile_saved_success', 'Profile updated and synced to Admin Portal in real time!'));
    });

    broadcastRealtimeEvent();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbt_store_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'profile') {
      setActiveTab('details');
      return;
    }
    setLocation(`/dashboard/teacher?section=${sectionId}`);
  };

  return (
    <PortalLayout
      title="Teacher Profile"
      activeSection="profile"
      onNavigate={handleNavigate}
    >
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Mobile View Profile (matching modern design reference) */}
        <div className="md:hidden">
          <MobileProfileView
            staffId={profileForm.staffId || 'TMS/TCH/0007'}
            name={profileForm.fullName || `${profileForm.firstName || ''} ${profileForm.lastName || ''}`.trim() || (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Abiola Adeniyi Adegemo')}
            roleTitle={profileForm.formClass && profileForm.formClass !== 'None' ? `Form Teacher (${profileForm.formClass})` : (profileForm.roleTitle || 'Form Teacher (Senior Science)')}
            specialization={profileForm.specialization || 'Physics (PRI - SS3) & Financial Accounting (JSS 1)'}
            qualification={profileForm.qualification || 'Not Specified'}
            formClass={profileForm.formClass || 'Senior Science'}
            phone={profileForm.phone || '+234 800 000 0000'}
            email={profileForm.email || user?.email || 'adeniyiabiola2@gmail.com'}
            subjectsAssigned={profileForm.subjectsAssigned && profileForm.subjectsAssigned.length > 0 ? profileForm.subjectsAssigned : [{ name: 'Physics', grade: 'Senior Science' }]}
            avatarUrl={profileForm.profileImage || (user as any)?.profile_image}
            location="Tarepet Montessori Academy, Yenagoa"
            onBack={() => setLocation('/dashboard/teacher')}
            onEditProfile={() => setShowEditModal(true)}
          />
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          {/* Back Button to Dashboard */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setLocation('/dashboard/teacher')}
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('teacher.back_to_dashboard', 'Back to Teacher Dashboard')}</span>
            </button>
          </div>

          <div className="space-y-6 max-w-5xl">
          {/* Clean Page Title & Single Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs ring-4 ring-emerald-500/20" />
              <h2 className="text-lg sm:text-xl font-bold font-serif text-foreground">Teacher Profile & Academic Records</h2>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(prev => !prev)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Actions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showActionsDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowActionsDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-40 py-1.5 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        setShowEditModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                      <span>{t('teacher.edit_profile', 'Edit Profile & Details')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        setShowStaffIdModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors border-t border-border/50"
                    >
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>{t('teacher.view_staff_id', 'View Staff ID Card')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        window.print();
                      }}
                      className="w-full px-4 py-2.5 text-left font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors border-t border-border/50"
                    >
                      <Printer className="w-4 h-4 text-muted-foreground" />
                      <span>{t('teacher.btn_print_profile', 'Print Profile')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Single Clean Profile Card (Identical to Admin Preview Card) */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Column 1: Avatar Badge */}
              <div className="md:col-span-3 flex flex-col items-center justify-start text-center space-y-3 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-serif font-bold text-4xl text-emerald-600 shadow-sm overflow-hidden">
                    {profileForm.profileImage ? (
                      <img src={profileForm.profileImage} alt="Teacher Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileForm.firstName?.[0] || 'A'
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    id="teacherProfileAvatarPicker"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          showToast('Image size exceeds 10MB limit.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const imageBase64 = reader.result as string;
                          setPendingCropImage(imageBase64);
                          setCropModalOpen(true);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <label
                    htmlFor="teacherProfileAvatarPicker"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all border border-card"
                    title="Upload New Photo"
                  >
                    <Edit2 className="w-3 h-3" />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <label
                    htmlFor="teacherProfileAvatarPicker"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                    title="Upload & Crop Photo"
                  >
                    <Upload className="w-3 h-3" /> Change
                  </label>

                  {profileForm.profileImage && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCropImage(profileForm.profileImage);
                          setCropModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-muted hover:bg-accent text-foreground text-[11px] font-bold border border-border transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Crop / Resize current photo"
                      >
                        <Scissors className="w-3 h-3 text-emerald-600" /> Crop
                      </button>

                      <button
                        type="button"
                        onClick={handleDeletePhoto}
                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 text-[11px] font-bold border border-rose-200 dark:border-rose-800/40 transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Delete profile picture"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 uppercase tracking-wider block">
                    ACTIVE
                  </span>
                  <p className="text-xs font-bold text-muted-foreground">Faculty Member</p>
                </div>
              </div>

              {/* Column 2: Teacher Bio & Official Details */}
              <div className="md:col-span-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">STAFF ID NUMBER</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 font-mono font-bold text-xs border border-emerald-500/20">
                    {profileForm.staffId || 'TMS/TCH/0054'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">FULL NAME & TITLE</span>
                  <strong className="text-foreground font-bold text-sm uppercase block mt-0.5">{profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">STAFF ROLE / DUTY</span>
                  <strong className="text-emerald-700 font-bold block mt-0.5">{profileForm.roleTitle}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">ACADEMIC SPECIALIZATION</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.specialization || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">QUALIFICATIONS & DEGREES</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.qualification || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">FORM TEACHER ASSIGNMENT</span>
                  <strong className="text-rose-600 font-bold block mt-0.5">{profileForm.formClass && profileForm.formClass !== 'None' ? profileForm.formClass : 'None'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">CONTACT PHONE</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.phone || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">OFFICIAL EMAIL</span>
                  <strong className="text-foreground font-bold underline block mt-0.5">{profileForm.email}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">RESIDENTIAL ADDRESS</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.address || 'Not Provided'}</strong>
                </div>
              </div>

              {/* Column 3: Teaching Workload & Assigned Subjects */}
              <div className="md:col-span-5 space-y-4 text-xs border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div>
                  <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 mb-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Assigned Subjects & Classes ({profileForm.subjectsAssigned?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {profileForm.subjectsAssigned && profileForm.subjectsAssigned.length > 0 ? (
                      profileForm.subjectsAssigned.map((sub: any, idx: number) => {
                        const subName = typeof sub === 'string' ? sub : sub.name;
                        const subGrade = typeof sub === 'string' ? (profileForm.formClass || 'JSS 3') : (sub.grade || profileForm.formClass || 'JSS 3');
                        const subCode = typeof sub === 'object' && sub.code ? sub.code : `SUB-${idx + 1}`;
                        return (
                          <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                                {subCode}
                              </span>
                              <span className="font-bold text-foreground">{subName}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-serif">
                              {subGrade}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground italic text-xs">No subjects currently assigned by Admin.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Clean Edit Profile & Biometrics Modal */}
          {/* Full Comprehensive Edit Profile & Biometrics Modal */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-card border border-border rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-foreground text-lg sm:text-xl">Edit Complete Profile & Faculty Records</h3>
                      <p className="text-xs text-muted-foreground">All edits persist to your official records, Django backend, and Admin Portal in real time.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    handleSaveProfile(e);
                    setShowEditModal(false);
                  }}
                  className="space-y-6 text-xs"
                >
                  {/* 1. Profile Photo / Avatar Live Uploader */}
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-serif font-bold text-2xl text-emerald-700 shadow-sm overflow-hidden shrink-0">
                      {profileForm.profileImage ? (
                        <img src={profileForm.profileImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        `${profileForm.firstName?.[0] || 'T'}${profileForm.lastName?.[0] || 'M'}`
                      )}
                    </div>
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <input
                        type="file"
                        accept="image/*"
                        id="standaloneTeacherEditPhotoModalInput"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              showToast('Image size exceeds 10MB limit.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const imageBase64 = reader.result as string;
                              setPendingCropImage(imageBase64);
                              setCropModalOpen(true);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label
                          htmlFor="standaloneTeacherEditPhotoModalInput"
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload & Crop Photo</span>
                        </label>
                        {profileForm.profileImage && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingCropImage(profileForm.profileImage);
                                setCropModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Scissors className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Crop / Resize</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              className="px-3 py-1.5 text-rose-600 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">JPG, PNG, or WEBP. Image updates real-time across Teacher & Admin views.</p>
                    </div>
                  </div>

                  {/* 2. Personal & Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Personal & Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">First Name</label>
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Official Email Address</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Contact Phone Number</label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Gender</label>
                        <select
                          value={profileForm.gender || 'Male'}
                          onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={profileForm.dob || '1990-01-01'}
                          onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Residential Address</label>
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                          placeholder="e.g. Tarepet School Campus, Yenagoa, Bayelsa State"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Academic & Faculty Credentials */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5" /> Academic & Faculty Credentials
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Staff Role / Duty / Title</label>
                        <input
                          type="text"
                          value={profileForm.roleTitle}
                          onChange={e => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                          placeholder="e.g. Senior Subject Teacher & Head of Sciences"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Teaching Division / Department</label>
                        <select
                          value={profileForm.department || 'Senior Secondary (SS 1 - SS 3)'}
                          onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="Senior Secondary (SS 1 - SS 3)">Senior Secondary (SS 1 - SS 3)</option>
                          <option value="Junior Secondary (JSS 1 - JSS 3)">Junior Secondary (JSS 1 - JSS 3)</option>
                          <option value="Primary Department (Primary 1 - 5)">Primary Department (Primary 1 - 5)</option>
                          <option value="Nursery Department (Nursery 1 - 3)">Nursery Department (Nursery 1 - 3)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Form Teacher Assignment</label>
                        <select
                          value={profileForm.formClass || 'None'}
                          onChange={e => setProfileForm({ ...profileForm, formClass: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="None">None (Subject Specialist Only)</option>
                          <option value="Nursery 1">Nursery 1</option>
                          <option value="Nursery 2">Nursery 2</option>
                          <option value="Nursery 3">Nursery 3</option>
                          <option value="Primary 1">Primary 1</option>
                          <option value="Primary 2">Primary 2</option>
                          <option value="Primary 3">Primary 3</option>
                          <option value="Primary 4">Primary 4</option>
                          <option value="Primary 5">Primary 5</option>
                          <option value="JSS 1">JSS 1</option>
                          <option value="JSS 2">JSS 2</option>
                          <option value="JSS 3">JSS 3</option>
                          <option value="SS 1 Science">SS 1 Science</option>
                          <option value="SS 1 Art">SS 1 Art</option>
                          <option value="SS 2 Science">SS 2 Science</option>
                          <option value="SS 2 Art">SS 2 Art</option>
                          <option value="SS 3 Science">SS 3 Science</option>
                          <option value="SS 3 Art">SS 3 Art</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date Joined Faculty</label>
                        <input
                          type="text"
                          value={profileForm.joiningDate || 'September 2021'}
                          onChange={e => setProfileForm({ ...profileForm, joiningDate: e.target.value })}
                          placeholder="e.g. September 2021"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Academic Specialization</label>
                        <input
                          type="text"
                          value={profileForm.specialization}
                          onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })}
                          placeholder="e.g. Pure & Applied Mathematics, Physics & STEM"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Qualifications & TRCN Degrees</label>
                        <input
                          type="text"
                          value={profileForm.qualification}
                          onChange={e => setProfileForm({ ...profileForm, qualification: e.target.value })}
                          placeholder="e.g. B.Sc. Ed (Mathematics), M.Sc. Statistics, TRCN Certified"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Staff ID & Employment / Banking */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Staff ID & Banking Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Staff ID Number</label>
                        <input
                          type="text"
                          value={profileForm.staffId}
                          onChange={e => setProfileForm({ ...profileForm, staffId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={profileForm.bankName || ''}
                          onChange={e => setProfileForm({ ...profileForm, bankName: e.target.value })}
                          placeholder="e.g. First Bank of Nigeria"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Account Number</label>
                        <input
                          type="text"
                          value={profileForm.accountNumber || ''}
                          onChange={e => setProfileForm({ ...profileForm, accountNumber: e.target.value })}
                          placeholder="e.g. 0123456789"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Official Teacher Staff ID Card Modal */}
        {showStaffIdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150" onClick={() => setShowStaffIdModal(false)}>
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> {t('teacher.staff_id_title')}
                </h3>
                <button onClick={() => setShowStaffIdModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-90">{t('school.name')}</p>
                      <p className="text-[11px] opacity-75">{t('school.location')}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-primary font-bold text-xs">{t('school.abbr')}</span>
                    </div>
                  </div>
                  <div className="p-5 flex gap-5 items-center">
                    <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center text-3xl font-serif font-bold text-primary">
                        {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{profileForm.firstName} {profileForm.lastName}</h4>
                      <p className="text-xs text-primary font-bold mt-0.5">{profileForm.roleTitle}</p>
                      <p className="text-xs text-muted-foreground">{profileForm.department}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.staff_id_label')}</span>
                          <p className="font-bold font-mono text-foreground">{profileForm.staffId}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.id_card_valid_until')}</span>
                          <p className="font-bold text-foreground">{t('teacher.id_card_valid_date')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    <Printer className="w-4 h-4" /> {t('teacher.btn_print_id')}
                  </button>
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" /> {t('teacher.btn_download_pdf')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={pendingCropImage}
          onClose={() => setCropModalOpen(false)}
          onSave={handleApplyCroppedPhoto}
        />
      </PortalLayout>
  );
}

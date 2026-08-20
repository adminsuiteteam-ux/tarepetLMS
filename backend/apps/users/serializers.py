from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import StudentProfile, TeacherProfile, ParentProfile, AdminProfile

User = get_user_model()


class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Accepts email, username, or Student ID / Teacher ID alongside password for JWT login.
    For students: email is firstname.surname@tarepet.com and password is their Student ID.
    For teachers: email is firstname.surname@tarepet.com and password is their Teacher ID.
    """
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = (
            attrs.get('email') or
            attrs.get('username') or
            self.initial_data.get('email') or
            self.initial_data.get('username')
        )
        password = attrs.get('password')

        if not identifier:
            raise serializers.ValidationError({'email': 'Email, Username, or ID is required.'})
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})

        identifier = str(identifier).strip()
        password = str(password).strip()

        from django.contrib.auth import authenticate
        from django.db.models import Q
        from rest_framework_simplejwt.exceptions import AuthenticationFailed
        from rest_framework_simplejwt.tokens import RefreshToken

        # Find user by email, username, teacher_id, or student_id
        target_user = User.objects.filter(
            Q(email__iexact=identifier) |
            Q(username__iexact=identifier) |
            Q(teacher_profile__teacher_id__iexact=identifier) |
            Q(student_profile__student_id__iexact=identifier)
        ).first()

        user = None
        if target_user:
            teacher_id = getattr(getattr(target_user, 'teacher_profile', None), 'teacher_id', None)
            student_id = getattr(getattr(target_user, 'student_profile', None), 'student_id', None)

            # Auto-repair default password hash if matching Staff ID or Student ID
            if (teacher_id and (password.upper() == teacher_id.upper())) or \
               (student_id and (password.upper() == student_id.upper())):
                target_user.set_password(password)
                target_user.save()

            user = authenticate(self.context.get('request'), username=target_user.email, password=password)
            if not user and target_user.check_password(password) and target_user.is_active:
                user = target_user

        if not user:
            user = authenticate(self.context.get('request'), username=identifier, password=password)

        if not user or not user.is_active:
            raise AuthenticationFailed('Invalid email/ID or password credentials.')

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['first_name'] = user.first_name
        refresh['last_name'] = user.last_name
        refresh['full_name'] = user.get_full_name()

        # Add profile details (student_id / teacher_id) if available
        student_id = getattr(getattr(user, 'student_profile', None), 'student_id', None)
        teacher_id = getattr(getattr(user, 'teacher_profile', None), 'teacher_id', None)

        user_data = UserSerializer(user).data
        user_data['student_id'] = student_id
        user_data['teacher_id'] = teacher_id

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }


class ParentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentProfile
        fields = ['id', 'occupation', 'address', 'preferred_language', 'newsletter_subscription']


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'student_id', 'grade_level', 'house', 'admission_date', 'date_of_birth', 'medical_conditions', 'allergies', 'emergency_contact']


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'teacher_id', 'department', 'specialization', 'subjects_taught',
            'hire_date', 'qualifications', 'gender', 'dob', 'address', 'salary',
            'bank_name', 'account_number', 'form_teacher_of', 'bio'
        ]


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['id', 'role_type', 'permissions']


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'date_joined', 'is_active', 'profile']
        read_only_fields = ['id', 'date_joined', 'is_active']

    def get_profile(self, obj):
        if obj.role == User.Role.STUDENT and hasattr(obj, 'student_profile'):
            return StudentProfileSerializer(obj.student_profile).data
        elif obj.role == User.Role.TEACHER and hasattr(obj, 'teacher_profile'):
            return TeacherProfileSerializer(obj.teacher_profile).data
        elif obj.role == User.Role.PARENT and hasattr(obj, 'parent_profile'):
            return ParentProfileSerializer(obj.parent_profile).data
        elif obj.role == User.Role.ADMIN and hasattr(obj, 'admin_profile'):
            return AdminProfileSerializer(obj.admin_profile).data
        return None

    def update(self, instance, validated_data):
        profile_data = self.initial_data.get('profile', {})
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone = validated_data.get('phone', instance.phone)
        if 'email' in validated_data and validated_data['email']:
            instance.email = validated_data['email']
        instance.save()

        if instance.role == User.Role.TEACHER and hasattr(instance, 'teacher_profile'):
            t_prof = instance.teacher_profile
            field_map = {
                'department': 'department',
                'specialization': 'specialization',
                'qualifications': 'qualifications',
                'qualification': 'qualifications',
                'gender': 'gender',
                'dob': 'dob',
                'address': 'address',
                'salary': 'salary',
                'bank_name': 'bank_name',
                'bankName': 'bank_name',
                'account_number': 'account_number',
                'accountNumber': 'account_number',
                'form_teacher_of': 'form_teacher_of',
                'formTeacherOf': 'form_teacher_of',
                'bio': 'bio',
                'profile_image': 'profile_image',
                'profileImage': 'profile_image',
            }
            for key, attr in field_map.items():
                if key in profile_data:
                    val = profile_data[key]
                    if val is not None:
                        setattr(t_prof, attr, val)
            t_prof.save()

        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.STUDENT)
    student_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    teacher_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True)
    specialization = serializers.CharField(write_only=True, required=False, allow_blank=True)
    qualifications = serializers.CharField(write_only=True, required=False, allow_blank=True)
    subjects_taught = serializers.JSONField(write_only=True, required=False, default=list)
    hire_date = serializers.DateField(write_only=True, required=False, allow_null=True)
    gender = serializers.CharField(write_only=True, required=False, allow_blank=True)
    dob = serializers.DateField(write_only=True, required=False, allow_null=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    salary = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bank_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    account_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    form_teacher_of = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'role', 'student_id', 'teacher_id',
            'department', 'specialization', 'qualifications', 'subjects_taught', 'hire_date', 'gender',
            'dob', 'address', 'salary', 'bank_name', 'account_number', 'form_teacher_of'
        ]

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.STUDENT)
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        email = validated_data.get('email', '').strip().lower()

        # Extract teacher profile extra fields
        dept = validated_data.pop('department', 'Academic Department')
        spec = validated_data.pop('specialization', '')
        qual = validated_data.pop('qualifications', '')
        subs = validated_data.pop('subjects_taught', [])
        hire = validated_data.pop('hire_date', None)
        gen = validated_data.pop('gender', '')
        dob_val = validated_data.pop('dob', None)
        addr = validated_data.pop('address', '')
        sal = validated_data.pop('salary', '')
        bank = validated_data.pop('bank_name', '')
        acct = validated_data.pop('account_number', '')
        form_tch = validated_data.pop('form_teacher_of', '')

        # Enforce email format: firstname.surname@tarepet.com for Student & Teacher
        if not email or '@' not in email:
            if first_name and last_name:
                fn = first_name.lower().replace(' ', '')
                ln = last_name.lower().replace(' ', '')
                email = f"{fn}.{ln}@tarepet.com"
            else:
                email = email or "user@tarepet.com"

        # Determine Student ID / Teacher ID and Password
        password = validated_data.get('password')
        custom_stu_id = validated_data.pop('student_id', None)
        custom_tch_id = validated_data.pop('teacher_id', None)

        if role == User.Role.STUDENT:
            if not custom_stu_id:
                count = StudentProfile.objects.count() + 1
                custom_stu_id = f"TP-STU-{count:03d}"
            # Strictly: Password for student is their Student ID
            if not password:
                password = custom_stu_id

        elif role == User.Role.TEACHER:
            if not custom_tch_id:
                count = TeacherProfile.objects.count() + 1
                custom_tch_id = f"TMS/TCH/{count:04d}"
            # Strictly: Password for teacher is their Teacher ID
            if not password:
                password = custom_tch_id

        if not password:
            password = "DefaultPassword123!"

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone', ''),
            role=role,
        )

        # Create role profile with strictly assigned ID and individual fields
        if role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user, student_id=custom_stu_id)
        elif role == User.Role.TEACHER:
            TeacherProfile.objects.create(
                user=user,
                teacher_id=custom_tch_id,
                department=dept or 'Academic Department',
                specialization=spec,
                qualifications=qual,
                subjects_taught=subs,
                hire_date=hire,
                gender=gen,
                dob=dob_val,
                address=addr,
                salary=sal,
                bank_name=bank,
                account_number=acct,
                form_teacher_of=form_tch,
            )
        elif role == User.Role.PARENT:
            ParentProfile.objects.create(user=user)
        elif role == User.Role.ADMIN:
            AdminProfile.objects.create(user=user)

        return user

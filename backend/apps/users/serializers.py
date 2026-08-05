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
    email = serializers.EmailField(required=False, allow_blank=True)
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

        identifier = identifier.strip()

        # If identifier matches a student_id or teacher_id, resolve the associated user's email
        from apps.users.models import StudentProfile, TeacherProfile
        student_prof = StudentProfile.objects.filter(student_id__iexact=identifier).first()
        if student_prof:
            identifier = student_prof.user.email
        else:
            teacher_prof = TeacherProfile.objects.filter(teacher_id__iexact=identifier).first()
            if teacher_prof:
                identifier = teacher_prof.user.email

        from django.contrib.auth import authenticate
        from rest_framework_simplejwt.exceptions import AuthenticationFailed
        from rest_framework_simplejwt.tokens import RefreshToken

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

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'phone': user.phone,
                'student_id': student_id,
                'teacher_id': teacher_id,
            }
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
        fields = ['id', 'teacher_id', 'department', 'subjects_taught', 'hire_date', 'qualifications', 'bio']


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


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.STUDENT)
    student_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    teacher_id = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role', 'student_id', 'teacher_id']

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.STUDENT)
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        email = validated_data.get('email', '').strip().lower()

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
                custom_tch_id = f"TP-TCH-{count:03d}"
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

        # Create role profile with strictly assigned ID
        if role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user, student_id=custom_stu_id)
        elif role == User.Role.TEACHER:
            TeacherProfile.objects.create(user=user, teacher_id=custom_tch_id)
        elif role == User.Role.PARENT:
            ParentProfile.objects.create(user=user)
        elif role == User.Role.ADMIN:
            AdminProfile.objects.create(user=user)

        return user

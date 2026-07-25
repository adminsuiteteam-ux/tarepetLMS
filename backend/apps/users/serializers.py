from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import StudentProfile, TeacherProfile, ParentProfile, AdminProfile

User = get_user_model()


class CustomTokenObtainPairSerializer(serializers.Serializer):
    """Accepts either 'email' or 'username' alongside 'password' for JWT login."""
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
            raise serializers.ValidationError({'email': 'Email or username is required.'})
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})

        from django.contrib.auth import authenticate
        from rest_framework_simplejwt.exceptions import AuthenticationFailed
        from rest_framework_simplejwt.tokens import RefreshToken

        user = authenticate(self.context.get('request'), username=identifier, password=password)
        if not user or not user.is_active:
            raise AuthenticationFailed('No active account found with the given credentials')

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['first_name'] = user.first_name
        refresh['last_name'] = user.last_name
        refresh['full_name'] = user.get_full_name()

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
            }
        }


class ParentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentProfile
        fields = ['id', 'occupation', 'address', 'preferred_language', 'newsletter_subscription']


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'grade_level', 'house', 'admission_date', 'date_of_birth', 'medical_conditions', 'allergies', 'emergency_contact']


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ['id', 'department', 'subjects_taught', 'hire_date', 'qualifications', 'bio']


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
    password = serializers.CharField(write_only=True, min_length=12)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.STUDENT)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.STUDENT)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role,
        )

        # Auto-create role profile
        if role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user)
        elif role == User.Role.TEACHER:
            TeacherProfile.objects.create(user=user)
        elif role == User.Role.PARENT:
            ParentProfile.objects.create(user=user)
        elif role == User.Role.ADMIN:
            AdminProfile.objects.create(user=user)

        return user

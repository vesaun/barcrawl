import ProfilePhotoCameraModal from '@/components/profile-photo-camera-modal';
import { useApp } from '@/context/AppContext';
import { signInWithGoogle } from '@/src/lib/googleAuth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { signUp } = useApp();
  
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileCameraOpen, setIsProfileCameraOpen] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = () => {
    // Use the same expo-camera flow as crawl photos to avoid mirrored selfies.
    setIsProfileCameraOpen(true);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return false;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum)) {
      Alert.alert('Error', 'Please enter a valid age');
      return false;
    }
    if (ageNum < 21) {
      Alert.alert(
        'Age Restriction',
        'You must be 21 or older to use BarCrawl. Please verify your age.',
        [{ text: 'OK' }]
      );
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 100) {
      Alert.alert('Error', 'Description must be 100 words or less');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp({
        username: username.trim(),
        name: name.trim(),
        age: parseInt(age, 10),
        email: email.trim(),
        phone: phone.trim(),
        profilePicture: profilePicture || undefined,
        description: description.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign up. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      console.log('[Welcome] Starting Google sign-in...');
      await signInWithGoogle();
      console.log('[Welcome] Google sign-in successful!');
      
      // Navigate to tabs immediately - AppContext has already set currentUser
      console.log('[Welcome] Navigating to main app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[Welcome] Google sign-in failed:', error);
      const errorMessage = error.message || 'Failed to sign in with Google. Please try again.';
      Alert.alert(
        'Sign-In Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsSubmitting(false);
    }
    // Don't set isSubmitting to false here - keep button disabled until redirect happens
  };

  const handleTestSignUp = async () => {
    // Fill form with test data (for visual feedback)
    setUsername('testuser');
    setName('Test User');
    setAge('25');
    setEmail('test@example.com');
    setPhone('5551234567');
    setDescription('This is a test account for quick access to the app.');

    // Directly submit with test data
    setIsSubmitting(true);
    try {
      await signUp({
        username: 'testuser',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        phone: '5551234567',
        profilePicture: undefined,
        description: 'This is a test account for quick access to the app.',
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign up. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <View style={styles.mainContainer}>
      <ProfilePhotoCameraModal
        visible={isProfileCameraOpen}
        onClose={() => setIsProfileCameraOpen(false)}
        onPhotoTaken={(uri) => {
          setProfilePicture(uri);
          setIsProfileCameraOpen(false);
        }}
      />
      {/* Decorative elements */}
      <View style={styles.decorLeft}>
        <Ionicons name="beer" size={50} color="#FF6B35" style={styles.decorIcon} />
      </View>
      <View style={styles.decorRight}>
        <Ionicons name="wine" size={44} color="#E74C3C" style={styles.decorIcon} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="beer" size={48} color="#FF6B35" />
            </View>
            <Text style={styles.title}>Welcome to BarCrawl!</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Social Sign-in Options */}
          <View style={styles.socialSignIn}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.socialButtonText}>
                {isSubmitting ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} disabled>
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

        <View style={styles.form}>
          {/* Profile Picture */}
          <View style={styles.profilePictureSection}>
            <TouchableOpacity onPress={showImagePickerOptions} style={styles.profilePictureButton}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Ionicons name="camera" size={40} color="#FF6B35" />
                  <Text style={styles.profilePictureText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor="#8B7355"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#8B7355"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Age */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor="#8B7355"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            {age && parseInt(age, 10) < 21 && (
              <Text style={styles.errorText}>You must be 21 or older to use BarCrawl</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#8B7355"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#8B7355"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (optional, max 100 words)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#8B7355"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.wordCount}>
              {wordCount} / 100 words
            </Text>
          </View>

          {/* Test Sign Up Button */}
          <TouchableOpacity
            style={[styles.testButton, isSubmitting && styles.testButtonDisabled]}
            onPress={handleTestSignUp}
            disabled={isSubmitting}
          >
            <Ionicons name="flash" size={18} color="#FF6B35" />
            <Text style={styles.testButtonText}>
              {isSubmitting ? 'Signing Up...' : 'Quick Test Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, isSubmitting && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={isSubmitting}
          >
            <Text style={styles.signUpButtonText}>
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  decorLeft: {
    position: 'absolute',
    top: 100,
    left: 20,
    zIndex: 1,
    opacity: 0.25,
  },
  decorRight: {
    position: 'absolute',
    top: 180,
    right: 20,
    zIndex: 1,
    opacity: 0.25,
  },
  decorIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3E2723',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF8E7',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#C4A87C',
    textAlign: 'center',
    marginTop: 8,
  },
  socialSignIn: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#3E2723',
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#FFF8E7',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#6B5744',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#8B7355',
  },
  form: {
    paddingHorizontal: 20,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePictureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3E2723',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  profilePictureText: {
    marginTop: 8,
    fontSize: 14,
    color: '#C4A87C',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFF8E7',
  },
  input: {
    borderWidth: 2,
    borderColor: '#6B5744',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#3E2723',
    color: '#FFF8E7',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  wordCount: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 5,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 5,
  },
  testButton: {
    backgroundColor: '#3E2723',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#F95700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

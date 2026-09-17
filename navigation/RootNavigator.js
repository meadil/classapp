import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// shared teacher content-management screens (registered in both CQ and MCQ stacks)
import ChapterDetailScreen from '../screens/ChapterDetailScreen';
import ChaptersScreen from '../screens/ChaptersScreen';
import CqVideosScreen from '../screens/CqVideosScreen';
import ClassLevelsScreen from '../screens/ClassLevelsScreen';
import CreateClassLevelScreen from '../screens/CreateClassLevelScreen';
import CreateChapterScreen from '../screens/CreateChapterScreen';
import CreateCqVideoScreen from '../screens/CreateCqVideoScreen';
import CreateMcqDeckScreen from '../screens/CreateMcqDeckScreen';
import CreateMcqExtraVideoScreen from '../screens/CreateMcqExtraVideoScreen';
import CreateSubjectScreen from '../screens/CreateSubjectScreen';
import McqDeckQuestionsScreen from '../screens/McqDeckQuestionsScreen';
import McqDecksScreen from '../screens/McqDecksScreen';
import McqExtraVideosScreen from '../screens/McqExtraVideosScreen';
import SubjectsScreen from '../screens/SubjectsScreen';

// CQ tab
import CqChapterListScreen from '../screens/CqChapterListScreen';
import CqHomeScreen from '../screens/CqHomeScreen';
import CqVideoListScreen from '../screens/CqVideoListScreen';
import CqVideoPlayerScreen from '../screens/CqVideoPlayerScreen';

// MCQ tab (Weekly Live Quiz + student practice flow)
import CreateQuizScreen from '../screens/CreateQuizScreen';
import McqChapterListScreen from '../screens/McqChapterListScreen';
import McqChapterScreen from '../screens/McqChapterScreen';
import McqDeckResultsScreen from '../screens/McqDeckResultsScreen';
import McqDeckTakingScreen from '../screens/McqDeckTakingScreen';
import McqExtraVideoPlayerScreen from '../screens/McqExtraVideoPlayerScreen';
import McqHomeScreen from '../screens/McqHomeScreen';
import McqSubjectPickerScreen from '../screens/McqSubjectPickerScreen';
import QuizDetailScreen from '../screens/QuizDetailScreen';
import QuizzesScreen from '../screens/QuizzesScreen';

import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();
const CqStack = createNativeStackNavigator();
const McqStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const ICONS = {
  CQ: 'play-circle',
  MCQ: 'checkmark-circle',
  Profile: 'person-circle',
};

// the same set of teacher content-management screens is registered inside both
// the CQ and MCQ stacks, so a teacher can reach full management from either tab
function registerContentManagementScreens(Stack) {
  return (
    <>
      <Stack.Screen name="Subjects" component={SubjectsScreen} />
      <Stack.Screen name="CreateSubject" component={CreateSubjectScreen} presentation="modal" />
      <Stack.Screen name="ClassLevels" component={ClassLevelsScreen} />
      <Stack.Screen name="CreateClassLevel" component={CreateClassLevelScreen} presentation="modal" />
      <Stack.Screen name="Chapters" component={ChaptersScreen} />
      <Stack.Screen name="CreateChapter" component={CreateChapterScreen} presentation="modal" />
      <Stack.Screen name="ChapterDetail" component={ChapterDetailScreen} />
      <Stack.Screen name="CqVideos" component={CqVideosScreen} />
      <Stack.Screen name="CreateCqVideo" component={CreateCqVideoScreen} presentation="modal" />
      <Stack.Screen name="McqExtraVideos" component={McqExtraVideosScreen} />
      <Stack.Screen name="CreateMcqExtraVideo" component={CreateMcqExtraVideoScreen} presentation="modal" />
      <Stack.Screen name="McqDecks" component={McqDecksScreen} />
      <Stack.Screen name="CreateMcqDeck" component={CreateMcqDeckScreen} presentation="modal" />
      <Stack.Screen name="McqDeckQuestions" component={McqDeckQuestionsScreen} />
    </>
  );
}

function CqStackScreen() {
  return (
    <CqStack.Navigator screenOptions={{ headerShown: false }}>
      <CqStack.Screen name="CqHome" component={CqHomeScreen} />
      {registerContentManagementScreens(CqStack)}
      {/* student-facing flow */}
      <CqStack.Screen name="CqChapterList" component={CqChapterListScreen} />
      <CqStack.Screen name="CqVideoList" component={CqVideoListScreen} />
      <CqStack.Screen name="CqVideoPlayer" component={CqVideoPlayerScreen} />
    </CqStack.Navigator>
  );
}

function McqStackScreen() {
  return (
    <McqStack.Navigator screenOptions={{ headerShown: false }}>
      <McqStack.Screen name="McqHome" component={McqHomeScreen} />
      {registerContentManagementScreens(McqStack)}
      {/* Weekly Live Quiz, relocated here */}
      <McqStack.Screen name="QuizzesList" component={QuizzesScreen} />
      <McqStack.Screen name="CreateQuiz" component={CreateQuizScreen} presentation="modal" />
      <McqStack.Screen name="QuizDetail" component={QuizDetailScreen} />
      {/* student-facing practice deck flow */}
      <McqStack.Screen name="McqSubjectPicker" component={McqSubjectPickerScreen} />
      <McqStack.Screen name="McqChapterList" component={McqChapterListScreen} />
      <McqStack.Screen name="McqChapter" component={McqChapterScreen} />
      <McqStack.Screen name="McqExtraVideoPlayer" component={McqExtraVideoPlayerScreen} />
      <McqStack.Screen name="McqDeckTaking" component={McqDeckTakingScreen} />
      <McqStack.Screen name="McqDeckResults" component={McqDeckResultsScreen} />
    </McqStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="CQ" component={CqStackScreen} />
        <Tab.Screen name="MCQ" component={McqStackScreen} />
        <Tab.Screen name="Profile" component={ProfileStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

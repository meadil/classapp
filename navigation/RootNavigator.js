import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AllQuestionsScreen from '../screens/AllQuestionsScreen';
import AllVideosScreen from '../screens/AllVideosScreen';
import CreateVideoScreen from '../screens/CreateVideoScreen';
import VideoDetailScreen from '../screens/VideoDetailScreen';
import VideosScreen from '../screens/VideosScreen';

import CreateQuizScreen from '../screens/CreateQuizScreen';
import QuizDetailScreen from '../screens/QuizDetailScreen';
import QuizzesScreen from '../screens/QuizzesScreen';

import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();
const VideosStack = createNativeStackNavigator();
const QuizzesStack = createNativeStackNavigator();

const ICONS = {
  Videos: 'play-circle',
  Quizzes: 'checkmark-circle',
  Profile: 'person-circle',
};

function VideosStackScreen() {
  return (
    <VideosStack.Navigator screenOptions={{ headerShown: false }}>
      <VideosStack.Screen name="VideosList" component={VideosScreen} />
      <VideosStack.Screen name="CreateVideo" component={CreateVideoScreen} presentation="modal" />
      <VideosStack.Screen name="AllVideos" component={AllVideosScreen} />
      <VideosStack.Screen name="AllQuestions" component={AllQuestionsScreen} />
      <VideosStack.Screen name="VideoDetail" component={VideoDetailScreen} />
    </VideosStack.Navigator>
  );
}

function QuizzesStackScreen() {
  return (
    <QuizzesStack.Navigator screenOptions={{ headerShown: false }}>
      <QuizzesStack.Screen name="QuizzesList" component={QuizzesScreen} />
      <QuizzesStack.Screen name="CreateQuiz" component={CreateQuizScreen} presentation="modal" />
      <QuizzesStack.Screen name="QuizDetail" component={QuizDetailScreen} />
    </QuizzesStack.Navigator>
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
        <Tab.Screen name="Videos" component={VideosStackScreen} />
        <Tab.Screen name="Quizzes" component={QuizzesStackScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
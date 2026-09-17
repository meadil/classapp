import { useUser } from '../contexts/UserContext';
import CqSubjectPickerScreen from './CqSubjectPickerScreen';
import SubjectsScreen from './SubjectsScreen';

export default function CqHomeScreen({ navigation, route }) {
    const { profile } = useUser();
    const isTeacher = profile?.role === 'teacher';

    return isTeacher ? (
        <SubjectsScreen navigation={navigation} route={route} />
    ) : (
        <CqSubjectPickerScreen navigation={navigation} route={route} />
    );
}

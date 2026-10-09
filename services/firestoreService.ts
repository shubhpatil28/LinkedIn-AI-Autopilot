import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Topic, ContentItem, UserSettings, LinkedInConnection } from '@/types';

// Default initial topics if user has none
export const DEFAULT_TOPICS = [
  'AI & LLMs',
  'React & Next.js',
  'TypeScript & JavaScript',
  'Backend & Databases',
  'Debugging & Architecture',
  'DevOps & Automation',
];

// Default user settings
export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  topics: DEFAULT_TOPICS,
  postsPerDay: 1,
  postingTime: '09:00',
  timezone: 'Asia/Kolkata',
  language: 'English',
  writingStyle: 'Professional & Technical',
  publishingMode: 'Human Approval',
};

// TOPICS CRUD - Firestore is the single source of truth
export async function getUserTopics(userId: string): Promise<Topic[]> {
  try {
    const topicsRef = collection(db, 'topics');
    const q = query(topicsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Initialize default topics in Firestore if empty
      const createdTopics: Topic[] = [];
      for (const name of DEFAULT_TOPICS) {
        const id = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newTopic: Topic = {
          id,
          userId,
          name,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createTopic(newTopic);
        createdTopics.push(newTopic);
      }
      return createdTopics;
    }

    const topics: Topic[] = [];
    querySnapshot.forEach((docSnap) => {
      topics.push(docSnap.data() as Topic);
    });
    return topics.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    console.error('Firestore getUserTopics failed:', error);
    throw error;
  }
}

export async function createTopic(topic: Topic): Promise<void> {
  try {
    const docRef = doc(db, 'topics', topic.id);
    await setDoc(docRef, topic);
  } catch (error) {
    console.error('Firestore createTopic failed for topic:', topic.id, error);
    throw error;
  }
}

export async function updateTopic(id: string, updates: Partial<Topic>): Promise<void> {
  try {
    const docRef = doc(db, 'topics', id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Firestore updateTopic failed for topic:', id, error);
    throw error;
  }
}

export async function deleteTopic(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'topics', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore deleteTopic failed for topic:', id, error);
    throw error;
  }
}

// CONTENT CRUD - Firestore is the single source of truth
export async function getUserContent(userId: string): Promise<ContentItem[]> {
  try {
    const contentRef = collection(db, 'content');
    const q = query(contentRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const items: ContentItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as ContentItem);
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Firestore getUserContent failed:', error);
    throw error;
  }
}

export async function saveContentItem(content: ContentItem): Promise<void> {
  try {
    const docRef = doc(db, 'content', content.id);
    await setDoc(docRef, content);
  } catch (error) {
    console.error('Firestore saveContentItem failed for content:', content.id, error);
    throw error;
  }
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<void> {
  try {
    const docRef = doc(db, 'content', id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Firestore updateContentItem failed for content:', id, error);
    throw error;
  }
}

export async function deleteContentItem(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'content', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore deleteContentItem failed for content:', id, error);
    throw error;
  }
}

// USER SETTINGS
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const docRef = doc(db, 'settings', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    }
    const initialSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await saveUserSettings(initialSettings);
    return initialSettings;
  } catch (error) {
    console.error('Firestore getUserSettings failed:', error);
    const initialSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      userId,
      updatedAt: new Date().toISOString(),
    };
    return initialSettings;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    const docRef = doc(db, 'settings', settings.userId);
    await setDoc(docRef, settings);
  } catch (error) {
    console.error('Firestore saveUserSettings failed:', error);
    throw error;
  }
}

// LINKEDIN CONNECTION
export async function getLinkedInConnection(userId: string): Promise<LinkedInConnection | null> {
  try {
    const docRef = doc(db, 'linkedin_connections', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LinkedInConnection;
    }
    return null;
  } catch (error) {
    console.error('Firestore getLinkedInConnection failed:', error);
    return null;
  }
}

// Client-safe getter that strips secret token before returning to UI
export async function getLinkedInConnectionClientSafe(userId: string): Promise<Omit<LinkedInConnection, 'accessToken'> | null> {
  const conn = await getLinkedInConnection(userId);
  if (!conn) return null;
  const { accessToken, ...safeConn } = conn;
  return safeConn;
}

export async function saveLinkedInConnection(connection: LinkedInConnection): Promise<void> {
  try {
    const docRef = doc(db, 'linkedin_connections', connection.userId);
    await setDoc(docRef, connection);
  } catch (error) {
    console.error('Firestore saveLinkedInConnection failed:', error);
    throw error;
  }
}

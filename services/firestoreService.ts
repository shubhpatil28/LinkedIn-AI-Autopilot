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
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Topic, ContentItem, UserSettings, LinkedInConnection, ContentStatus } from '@/types';

// Default initial topics if user has none
export const DEFAULT_TOPICS = ['AI', 'Coding', 'JavaScript', 'React', 'Web Development'];

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

// In-memory fallback cache for smooth offline/demo support
const mockStorage = {
  topics: new Map<string, Topic>(),
  content: new Map<string, ContentItem>(),
  settings: new Map<string, UserSettings>(),
  connections: new Map<string, LinkedInConnection>(),
};

// TOPICS CRUD
export async function getUserTopics(userId: string): Promise<Topic[]> {
  try {
    const topicsRef = collection(db, 'topics');
    const q = query(topicsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Initialize default topics if empty
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
    console.warn('Firestore fetch failed, using fallback storage:', error);
    const userTopics = Array.from(mockStorage.topics.values()).filter((t) => t.userId === userId);
    if (userTopics.length === 0) {
      DEFAULT_TOPICS.forEach((name, i) => {
        const t: Topic = {
          id: `topic_${i}`,
          userId,
          name,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockStorage.topics.set(t.id, t);
      });
    }
    return Array.from(mockStorage.topics.values()).filter((t) => t.userId === userId);
  }
}

export async function createTopic(topic: Topic): Promise<void> {
  try {
    mockStorage.topics.set(topic.id, topic);
    const docRef = doc(db, 'topics', topic.id);
    await setDoc(docRef, topic);
  } catch (error) {
    console.warn('Firestore set failed, stored in local cache:', error);
  }
}

export async function updateTopic(id: string, updates: Partial<Topic>): Promise<void> {
  try {
    const existing = mockStorage.topics.get(id);
    if (existing) {
      mockStorage.topics.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    }
    const docRef = doc(db, 'topics', id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn('Firestore update failed:', error);
  }
}

export async function deleteTopic(id: string): Promise<void> {
  try {
    mockStorage.topics.delete(id);
    const docRef = doc(db, 'topics', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore delete failed:', error);
  }
}

// CONTENT CRUD
export async function getUserContent(userId: string): Promise<ContentItem[]> {
  try {
    const contentRef = collection(db, 'content');
    const q = query(contentRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const items: ContentItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as ContentItem);
    });
    const result = [...items, ...Array.from(mockStorage.content.values()).filter(c => c.userId === userId)];
    // deduplicate by id
    const uniqueMap = new Map<string, ContentItem>();
    result.forEach(item => uniqueMap.set(item.id, item));
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Firestore getUserContent failed, returning cached:', error);
    return Array.from(mockStorage.content.values()).filter((c) => c.userId === userId);
  }
}

export async function saveContentItem(content: ContentItem): Promise<void> {
  try {
    mockStorage.content.set(content.id, content);
    const docRef = doc(db, 'content', content.id);
    await setDoc(docRef, content);
  } catch (error) {
    console.warn('Firestore saveContentItem failed, saved in cache:', error);
  }
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<void> {
  try {
    const existing = mockStorage.content.get(id);
    if (existing) {
      mockStorage.content.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    }
    const docRef = doc(db, 'content', id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn('Firestore updateContentItem failed:', error);
  }
}

export async function deleteContentItem(id: string): Promise<void> {
  try {
    mockStorage.content.delete(id);
    const docRef = doc(db, 'content', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore deleteContentItem failed:', error);
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
    console.warn('Firestore getUserSettings failed, returning defaults:', error);
    if (mockStorage.settings.has(userId)) {
      return mockStorage.settings.get(userId)!;
    }
    const initialSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      userId,
      updatedAt: new Date().toISOString(),
    };
    mockStorage.settings.set(userId, initialSettings);
    return initialSettings;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    mockStorage.settings.set(settings.userId, settings);
    const docRef = doc(db, 'settings', settings.userId);
    await setDoc(docRef, settings);
  } catch (error) {
    console.warn('Firestore saveUserSettings failed:', error);
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
    return mockStorage.connections.get(userId) || null;
  } catch (error) {
    return mockStorage.connections.get(userId) || null;
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
    mockStorage.connections.set(connection.userId, connection);
    const docRef = doc(db, 'linkedin_connections', connection.userId);
    await setDoc(docRef, connection);
  } catch (error) {
    console.warn('Firestore saveLinkedInConnection failed:', error);
  }
}

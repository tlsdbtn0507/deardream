'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  images: string[];
  date: string;
  commentCount: number;
}

interface FeedContextType {
  posts: FeedPost[];
  addPost: (post: Omit<FeedPost, 'id'>) => void;
  updatePost: (id: string, post: Partial<FeedPost>) => void;
  deletePost: (id: string) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: '1',
      authorName: '두콩잉',
      authorRole: '손녀',
      text: '이렇게 쭉쭉 글자를 쓴다면 과연 몇 글자가 나올까 생각보다 100자는 굉장히 적은데 이쯤 적으면 얼추 이미 찼을지도 몰라 아니나 다를까 이제 100자가 다 차버렸에 우짜노 큰일이다',
      images: ['/family.png', '/father.png'],
      date: '2025.01.19',
      commentCount: 3
    },
    {
      id: '2',
      authorName: '두콩잉',
      authorRole: '손녀',
      text: '두 번째 피드입니다. 이것도 삭제해보세요!',
      images: ['/family.png'],
      date: '2025.01.20',
      commentCount: 1
    },
    {
      id: '3',
      authorName: '두콩잉',
      authorRole: '손녀',
      text: '세 번째 피드입니다. 이것도 삭제해보세요!',
      images: ['/father.png'],
      date: '2025.01.21',
      commentCount: 2
    }
  ]);

  const addPost = (post: Omit<FeedPost, 'id'>) => {
    const newPost: FeedPost = {
      ...post,
      id: Date.now().toString()
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (id: string, post: Partial<FeedPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...post } : p));
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <FeedContext.Provider value={{ posts, addPost, updatePost, deletePost }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
}

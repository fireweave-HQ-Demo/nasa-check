import type { RouteObject } from 'react-router-dom';
import { ExplorePage } from '@/features/explore/ExplorePage';
import { GalleryPage } from '@/features/gallery/GalleryPage';
import { TodayPage } from '@/features/today/TodayPage';
import { AppLayout } from './layout/AppLayout';
import { NotFoundPage } from './NotFoundPage';
import { RouteError } from './RouteError';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'today/:date', element: <TodayPage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

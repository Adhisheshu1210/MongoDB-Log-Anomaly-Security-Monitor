/**
 * Viewer Layout
 */

import React from 'react';
import MainLayout from './MainLayout';
import { viewerSidebarItems } from '../components/layout/sidebarConfig';

const ViewerLayout = ({ children }) => {
  return <MainLayout sidebarItems={viewerSidebarItems}>{children}</MainLayout>;
};

export default ViewerLayout;

/**
 * User Layout
 */

import React from 'react';
import MainLayout from './MainLayout';
import { userSidebarItems } from '../components/layout/sidebarConfig';

const UserLayout = ({ children }) => {
  return <MainLayout sidebarItems={userSidebarItems}>{children}</MainLayout>;
};




export default UserLayout;



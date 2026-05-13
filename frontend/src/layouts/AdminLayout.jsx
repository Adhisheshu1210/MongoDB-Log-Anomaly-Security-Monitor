/**
 * Admin Layout
 */

import React, { useState } from 'react';
import MainLayout from './MainLayout';
import { adminSidebarItems } from '../components/layout/sidebarConfig';

const AdminLayout = ({ children }) => {
  return <MainLayout sidebarItems={adminSidebarItems}>{children}</MainLayout>;
};

export default AdminLayout;

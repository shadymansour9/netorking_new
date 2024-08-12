import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-grow p-6">
        {children}
      </div>
    </div>
  );
};

export default Layout;

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';

/**
 * ProtectedRoute component that checks user authentication and role permissions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles that can access this route (optional)
 * @param {string[]} props.restrictedRoles - Array of roles that should be redirected away (optional)
 * @param {string} props.redirectTo - Where to redirect unauthorized users (default: '/auth')
 * @param {string} props.fallbackRedirect - Where to redirect restricted roles (default: '/')
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  restrictedRoles = [],
  fallbackRedirect = '/'
}) {
  const user = getCurrentUser();
  const isUserAuthenticated = isAuthenticated();


  // If user is authenticated, check role restrictions
  if (isUserAuthenticated && user) {
    // Check if user's role is in restricted roles
    if (restrictedRoles.length > 0 && restrictedRoles.includes(user.role)) {
      return <Navigate to={fallbackRedirect} replace />;
    }

    // Check if user's role is in allowed roles (if specified)
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to={fallbackRedirect} replace />;
    }
  }

  // If all checks pass, render the children
  return children;
}
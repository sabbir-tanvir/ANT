import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { router } from "./router/router.jsx";
import { RouterProvider } from 'react-router-dom';
import { fetchSiteSettings } from './config/sitesetting.js';

// Fire-and-forget site settings load (logo, favicon, footer info)
fetchSiteSettings();


createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>,
)

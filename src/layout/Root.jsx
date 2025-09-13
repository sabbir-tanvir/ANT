import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from "../components/sharedComponents/Footer";
import Navbar from "../components/sharedComponents/Navbar";


const Root = () => {
  const location = useLocation();

  // Prevent browser from restoring previous scroll and always start at top on load/refresh
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    // Initial mount scroll to top
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top on route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
    <Navbar />
    <Outlet />
    <Footer />
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    </>
  );
};

export default Root;
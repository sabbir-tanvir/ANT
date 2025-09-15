import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Home from "../page/Home";
import Product from "../page/Product";
import Training from "../page/Training";
import Recharge from "../page/Recharge";
import Shops from "../page/Shops";
import ShopDetails from "../page/ShopDetails";
import ShopProductDetails from "../page/ShopProductDetails";
import About from "../page/About";
import Contact from "../page/Contact";
import Auth from "../page/Auth";
import Profile from "../page/Profile";
import ProductDetails from "../page/ProductDetails";
import Myshop from "../page/Myshop";
import ViewInShop from "../page/ViewInShop";
import ProtectedRoute from "../components/auth/ProtectedRoute";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root></Root>,
    children: [
  { path: "/", element: <Home></Home> },
  { path: "/product", element: <Product /> },
  { path: "/product/:id", element: <ProductDetails /> },
  { path: "/training", element: <Training /> },
  { path: "/view-in-shop/:id", element: <ViewInShop /> },
  { path: "/recharge", element: <Recharge /> },
  { 
    path: "/shops", 
    element: (
      <ProtectedRoute restrictedRoles={['shop_owner']} fallbackRedirect="/myshop">
        <Shops />
      </ProtectedRoute>
    )
  },
  { 
    path: "/shops/:id", 
    element: (
      <ProtectedRoute restrictedRoles={['shop_owner']} fallbackRedirect="/myshop">
        <ShopDetails />
      </ProtectedRoute>
    )
  },
  { path: "/shop-products/:id", element: <ShopProductDetails /> },
  { path: "/myshop", element: <Myshop /> },
  { path: "/about", element: <About /> },
  { path: "/contact", element: <Contact /> },
  { path: "/auth", element: <Auth /> },
  { path: "/profile", element: <Profile /> },
    ]
  }
]);


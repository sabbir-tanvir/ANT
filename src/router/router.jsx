import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Home from "../page/Home";
import Home2 from "../page/Home2";
import Product from "../page/Product";
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


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root></Root>,
    children: [
  { path: "/", element: <Home></Home> },
  { path: "/home2", element: <Home2></Home2> },
  { path: "/product", element: <Product /> },
  { path: "/product/:id", element: <ProductDetails /> },
  { path: "/view-in-shop/:id", element: <ViewInShop /> },
  { path: "/recharge", element: <Recharge /> },
  { path: "/shops", element: <Shops /> },
  { path: "/shops/:id", element: <ShopDetails /> },
  { path: "/shop-products/:id", element: <ShopProductDetails /> },
  { path: "/myshop", element: <Myshop /> },
  { path: "/about", element: <About /> },
  { path: "/contact", element: <Contact /> },
  { path: "/auth", element: <Auth /> },
  { path: "/profile", element: <Profile /> },
    ]
  }
]);


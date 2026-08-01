import { Routes, Route } from 'react-router'
import { CartProvider } from './lib/cart'
import ChatBot from './components/ChatBot'
import Home from './pages/Home'
import Sell from './pages/Sell'
import Affiliates from './pages/Affiliates'
import Verification from './pages/Verification'
import Food from './pages/Food'
import Restaurant from './pages/Restaurant'
import Cart from './pages/Cart'
import TrackOrder from './pages/TrackOrder'
import Returns from './pages/Returns'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import SearchResults from './pages/SearchResults'
import SellerListings from './pages/SellerListings'
import Admin from './pages/Admin'

export default function App() {
  return (
    <CartProvider>
      <ChatBot />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/affiliates" element={<Affiliates />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/food" element={<Food />} />
        <Route path="/food/:slug" element={<Restaurant />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/sell/listings" element={<SellerListings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </CartProvider>
  )
}

import React from 'react';
import Hero from '../components/Hero.jsx';
import NearbyShop from '../components/nearbyShop.jsx';
import WhyChoseUs from '../components/whychoseUs.jsx';
import Review from '../components/review.jsx';

function Home() {
        return (
            <>
                <Hero />
                <NearbyShop />
                <WhyChoseUs />
                <Review />
            </>
        );
}

export default Home;
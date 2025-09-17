import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewCard from './cards/reviewCard.jsx';

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get('/data.json')
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data?.reviews) ? res.data.reviews : [];
        setReviews(list.slice(0, 3));
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-8 text-center">
          <h3 className="text-3xl font-semibold text-zinc-800">What Our Customers Are Saying</h3>
          <p className="text-neutral-400">Featured Products You Might Like</p>
        </header>

        {loading ? (
          <div className="text-gray-500 text-center">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <ReviewCard key={r.id} avatar={r.avatar} name={r.name} role={r.role} rating={r.rating} text={r.text} />
            ))}
          </div>
        )}

        
      </div>
    </section>
  );
}
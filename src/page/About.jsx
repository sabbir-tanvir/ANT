import React from 'react';

function About() {
  return (
    <section className="min-h-screen py-16 px-6 md:px-12 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden p-8 md:p-16">
          
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl font-extrabold font-['Montserrat'] text-gray-900 leading-tight">
                <span className="relative inline-block">
                  <span className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src="/Vector.png" 
                      alt="decoration" 
                      className="w-64 opacity-20"
                    />
                  </span>
                  <span className="relative px-4">About</span>
                </span>
                <span className="ml-3 text-green-600">Us</span>
              </h1>

              {/* Who we are Section */}
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-bold text-green-600 mb-4">
                  <span className="w-12 h-1 bg-green-400 rounded"></span>
                  Who We Are
                </h2>
                
                <div className="space-y-4 text-gray-600 text-base leading-relaxed">
                  <p>
                    Fooding Trading was founded to infuse and properly utilize modern day technology in the Agro-trade and businesses and also to provide Agro-products with the certified global standards worthy of competition in the local and international markets.
                  </p>
                  <p>
                    We enlighten, collaborate, and share intellectual resources with local farmers, our clients, and partners to reach new heights in the Agro-trade while ensuring a healthy, green, and unpolluted society.
                  </p>
                  <p>
                    We also serve as consultants for distribution channels, documentation, validation, and investment opportunities in the Agro-industry.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center lg:justify-end">
              <img 
                className="w-80 h-96 rounded-2xl shadow-2xl object-cover transform hover:scale-105 transition duration-500" 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face" 
                alt="About Us - Professional"
              />
            </div>
          </div>

          {/* Mission, Vision, Values */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-green-50 rounded-xl p-8 hover:shadow-lg transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2..." clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-700">Our Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                We are a commendable agro-commodity supplier, providing industry-standard products and services through modern machinery, affordable distribution channels, and maximum utility for our clients, partners, and customers.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-green-50 rounded-xl p-8 hover:shadow-lg transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2..." />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-700">Our Vision</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                We aim to be among the largest and most trusted exporters of agricultural produce, empowering local farmers, engaging customers, and collaborating with the government to foster sustainable investments in the Agro-industry.
              </p>
            </div>

            {/* Values */}
            <div className="bg-green-50 rounded-xl p-8 hover:shadow-lg transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066..." clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-700">Our Values</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Quality, loyalty, customer satisfaction, feedback, reliability, and maintaining a green and unpolluted society.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;

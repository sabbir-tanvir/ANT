import React from 'react';

function About() {
  return (
    <section className="min-h-screen py-8 px-4 md:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white rounded-[10px] shadow-[0px_4px_8px_5px_rgba(217,217,217,0.25)] overflow-hidden p-8 md:p-16">
          
          {/* Hero Section with Image */}
          <div className="grid  bg-white grid-cols-1  py-20 lg:grid-cols-2 gap-12 mb-16">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Hero Title */}
              <div className=" bg-white pt-20 flex items-center justify-center">
                <h1 className=" z-10 text-zinc-900 text-5xl font-extrabold font-['Montserrat'] leading-tight text-center">
                  <span className="relative inline-block align-middle">
                    <img 
                      src="/Vector.png" 
                      alt="Background decoration" 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-auto z-0"
                    />
                    <span className="relative px-8 py-4 z-10 text-black">About</span>
                  </span>
                  <span className="ml-4">us</span>
                </h1>
              </div>

              {/* Who we are Section */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-green-500 text-2xl font-extrabold font-['Montserrat']">
                    Who we are
                  </h2>
                  <div className="w-16 h-0.5 bg-gray-400" />
                </div>
                
                <div className="space-y-4 text-zinc-700 text-sm leading-relaxed font-['Montserrat']">
                  <p>
                    Fooding Trading was founded to infuse and properly utilize modern day technology in the Agro-trade and businesses and also to provide Agro-products with the certified global standards worthy of competition in the local and international markets.
                  </p>
                  <p>
                    We tend to enlighten, collaborate and share intellectual resources to local farmers, our clients and partners so as to attain the peak in the Agro-trade hereby highly taking into consideration the sustenance of a healthy, green and unpolluted society.
                  </p>
                  <p>
                    We serve as consultants as it relates to distribution channels, documentation and validation and value experts. We also serve as an arena for guaranteed and secured investments for investors willing to invest into the Agro-industry.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative flex justify-center items-center">
              <img 
                className="w-72 h-96 absulate z-10 rounded-full -top-8 -right-8 object-cover" 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face" 
                alt="About Us - Professional"
              />
            </div>
          </div>

          {/* Mission and Vision Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Our Mission */}
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-green-500 text-2xl font-extrabold font-['Montserrat']">
                  Our Mission
                </h3>
              </div>
              
              <p className="text-zinc-700 text-sm leading-relaxed font-['Montserrat']">
                We are a commendable agro-commodity supplier which provides industry standard products and services with the use of modern day machinery and methods for operations, affordable distribution channels at ease and maximum utility for our clients, partners, and customers.
              </p>
            </div>

            {/* Our Vision */}
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-green-500 text-2xl font-extrabold font-['Montserrat']">
                  Our Vision
                </h3>
              </div>
              
              <p className="text-zinc-700 text-sm leading-relaxed font-['Montserrat']">
                We aim at being at the peak of the largest and most trusted exporters and dealers of agricultural produce. We intend reaching this height by partnering and educating local farmers, receiving feedback from our customers and collaborating with the government to improve local entrepreneurship and sustainable investments in the Agro-industry.
              </p>
            </div>
          </div>

          {/* Our Values Section */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-green-500 text-2xl font-extrabold font-['Montserrat']">
                Our Values
              </h3>
            </div>
            
            <div className="max-w-2xl">
              <p className="text-zinc-700 text-sm leading-relaxed font-['Montserrat']">
                Quality, Loyalty, Customer Satisfaction, Feedback, Reliability, and maintaining a green and unpolluted society.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;
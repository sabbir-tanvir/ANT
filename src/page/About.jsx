import React from 'react';
import { useSiteSettings } from '../config/sitesetting.js';

function About() {
  const settings = useSiteSettings();

  const resolveAsset = (url, fallback) => {
    if (!url) return fallback;
    if (/^https?:/i.test(url)) return url;
    return `${window._env_?.BASE_URL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const aboutText = settings?.about_us;
  const missionText = settings?.mission;
  const visionText = settings?.vision;
  const aboutImage = resolveAsset(
    settings?.about_us_image,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face'
  );

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

                <div
                  className="space-y-4 text-gray-600 text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: aboutText || '' }}
                />
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center lg:justify-end">
              <img
                className="w-80 h-96 rounded-2xl shadow-2xl object-cover transform hover:scale-105 transition duration-500"
                src={aboutImage}
                alt="About Us"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face';
                }}
              />
            </div>
          </div>

          {/* Mission, Vision, Values */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-green-50 rounded-xl p-8 hover:shadow-lg transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66" fill="none">
                    <path d="M33.3651 6.35864C36.6166 6.35864 39.7331 6.93387 42.6201 7.98441L39.3929 11.209C34.5088 9.88089 29.3229 10.2038 24.6413 12.1276C19.9598 14.0513 16.0451 17.468 13.5059 21.8463C10.9668 26.2247 9.94547 31.3194 10.6008 36.3381C11.2562 41.3569 13.5515 46.0185 17.1298 49.598C20.7082 53.1775 25.369 55.4744 30.3875 56.1315C35.4061 56.7885 40.5011 55.7689 44.8803 53.2312C49.2595 50.6935 52.6775 46.78 54.6028 42.0991C56.5281 37.4182 56.8528 32.2323 55.5264 27.3478L58.7509 24.1233C59.8294 27.0868 60.3797 30.2166 60.3767 33.3702C60.3767 48.2884 48.2833 60.3818 33.3651 60.3818C18.4469 60.3818 6.35352 48.2884 6.35352 33.3702C6.35352 18.452 18.4469 6.35864 33.3651 6.35864ZM33.3651 17.1665C34.7334 17.1659 36.0963 17.3383 37.4214 17.6796V21.9115C34.8227 20.9921 31.9887 20.9835 29.3845 21.8871C26.7803 22.7907 24.5606 24.5527 23.0898 26.8841C21.619 29.2154 20.9845 31.9775 21.2904 34.717C21.5963 37.4565 22.8244 40.0106 24.7732 41.9602C26.722 43.9097 29.2757 45.1387 32.0151 45.4456C34.7545 45.7525 37.5168 45.119 39.8487 43.6491C42.1806 42.1791 43.9435 39.9601 44.848 37.3562C45.7525 34.7523 45.7449 31.9183 44.8265 29.3193H49.0584C49.9032 32.5914 49.7039 36.0458 48.4883 39.1989C47.2726 42.3521 45.1016 45.0464 42.2789 46.9045C39.4562 48.7627 36.1232 49.6919 32.7463 49.5619C29.3694 49.432 26.1176 48.2495 23.446 46.18C20.7744 44.1104 18.8168 41.2574 17.847 38.0201C16.8772 34.7828 16.9439 31.3233 18.0377 28.1258C19.1314 24.9283 21.1975 22.1528 23.9468 20.1877C26.6962 18.2226 29.9911 17.1662 33.3705 17.1665H33.3651ZM38.7663 33.3702C38.7659 34.5311 38.3916 35.661 37.6986 36.5924C37.0057 37.5238 36.0312 38.2072 34.9194 38.5412C33.8076 38.8753 32.6178 38.8423 31.5262 38.4471C30.4347 38.0518 29.4995 37.3154 28.8594 36.347C28.2192 35.3786 27.908 34.2297 27.9721 33.0706C28.0361 31.9114 28.4719 30.8038 29.2148 29.9118C29.9578 29.0198 30.9684 28.3909 32.0968 28.1183C33.2252 27.8457 34.4114 27.9439 35.4797 28.3984L40.1247 23.7533L40.122 15.141C40.1225 14.604 40.3362 14.0892 40.7162 13.7097L47.4677 6.95818C47.751 6.67527 48.1117 6.48265 48.5044 6.40465C48.897 6.32664 49.304 6.36675 49.6739 6.5199C50.0438 6.67306 50.36 6.93239 50.5826 7.26515C50.8052 7.59791 50.9241 7.98917 50.9245 8.38951V15.8162H58.3512C58.7515 15.8166 59.1428 15.9355 59.4756 16.1581C59.8083 16.3807 60.0676 16.6969 60.2208 17.0668C60.374 17.4367 60.4141 17.8437 60.3361 18.2363C60.258 18.629 60.0654 18.9897 59.7825 19.273L53.031 26.0245C52.6515 26.4045 52.1367 26.6182 51.5997 26.6187H42.9847L38.3396 31.2637C38.6151 31.9119 38.7663 32.6221 38.7663 33.3702ZM50.7598 22.5677L53.4604 19.8671H48.8963C48.3591 19.8671 47.844 19.6537 47.4641 19.2739C47.0843 18.894 46.8709 18.3789 46.8709 17.8417V13.2776L44.173 15.9782V22.4084C44.2293 22.4592 44.2825 22.5133 44.3323 22.5704H50.7598V22.5677Z" fill="#218225" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-700">Our Mission</h3>
              </div>
              <div
                className="text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: missionText || '' }}
              />
            </div>

            {/* Vision */}
            <div className="bg-green-50 rounded-xl p-8 hover:shadow-lg transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 66 66" fill="none">
                    <g clip-path="url(#clip0_127_659)">
                      <path d="M55.2295 1.94813L56.2117 5.61361L15.6346 16.4251L16.6181 20.0958L9.28196 22.0616L10.2649 25.7298L6.59674 26.7127L4.63103 19.3764L0.962891 20.3593L5.87724 38.6999L9.54538 37.717L7.57966 30.3807L11.2478 29.3978L12.2307 33.0659L19.567 31.1002L20.5479 34.7609L28.6447 32.6265C29.1561 33.3837 29.8447 34.012 30.6504 34.4514L17.0004 61.9786H12.482V65.7761H19.3561L31.4695 41.3474V61.9786H27.672V65.7761H39.0645V61.9786H35.267V41.3474L47.3804 65.7761H54.2546V61.9786H49.7362L36.0863 34.4514C37.7482 33.5451 38.91 31.8349 39.0488 29.847L61.1261 23.9549L62.1096 27.6248L65.7777 26.6419L58.8976 0.965332L55.2295 1.94813ZM14.9158 28.415L13.9329 24.7468L17.601 23.7639L18.584 27.432L14.9158 28.415ZM20.287 19.1156L49.8556 11.2372L52.8053 22.2453L38.0358 26.187C37.0049 24.7152 35.2977 23.7502 33.3684 23.7502C30.3951 23.7502 27.948 26.0406 27.6952 28.9495L23.237 30.1247L20.287 19.1156ZM33.3683 31.3454C32.3213 31.3454 31.4695 30.4936 31.4695 29.4466C31.4695 28.3997 32.3213 27.5479 33.3683 27.5479C34.4152 27.5479 35.267 28.3997 35.267 29.4466C35.267 30.4936 34.4152 31.3454 33.3683 31.3454ZM56.4742 21.2662L53.5251 10.2596L57.1946 9.28187L60.1433 20.2869L56.4742 21.2662Z" fill="#218225" />
                    </g>
                    <defs>
                      <clipPath id="clip0_127_659">
                        <rect width="64.8148" height="64.8148" fill="white" transform="translate(0.962891 0.962769)" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-700">Our Vision</h3>
              </div>
              <div
                className="text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: visionText || '' }}
              />
            </div>


          </div>

        </div>
      </div>
    </section>
  );
}

export default About;

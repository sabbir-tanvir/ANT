import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Api_Base_Url } from '../config/api';

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [error, setError] = useState('');

  // Fetch divisions
  const fetchDivisions = async () => {
    try {
      setError('');
      const response = await axios.get(`${Api_Base_Url}/api/locations/divisions/`);
      setDivisions(response.data);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      setError('Failed to load divisions. Please try again.');
    }
  };

  // Fetch districts for selected division
  const fetchDistricts = async (divisionId) => {
    setLoadingDistricts(true);
    try {
      const response = await axios.get(`${Api_Base_Url}/api/locations/divisions/${divisionId}/districts/`);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch upazilas for selected district
  const fetchUpazilas = async (districtId) => {
    setLoadingUpazilas(true);
    try {
      const response = await axios.get(`${Api_Base_Url}/api/locations/districts/${districtId}/upazilas/`);
      setUpazilas(response.data);
    } catch (error) {
      console.error('Error fetching upazilas:', error);
      setUpazilas([]);
    } finally {
      setLoadingUpazilas(false);
    }
  };

  // Fetch shops with filters
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedDivision) {
        params.append('division_id', selectedDivision);
      }
      if (selectedDistrict) {
        params.append('district_id', selectedDistrict);
      }
      if (selectedUpazila) {
        params.append('upazila_id', selectedUpazila);
      }
      
      const queryString = params.toString();
      const url = `${Api_Base_Url}/api/shops/${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      setShops(response.data);
      console.log(response.data);
      
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('Failed to load shops. Please try again.');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDivision, selectedDistrict, selectedUpazila]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedUpazila('');
    setDistricts([]);
    setUpazilas([]);
  };

  // Fetch initial data
  useEffect(() => {
    fetchDivisions();
  }, []);

  // Fetch shops when filters change (with debouncing for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShops();
    }, searchTerm ? 500 : 0); // 500ms debounce for search, immediate for filters

    return () => clearTimeout(timer);
  }, [fetchShops, searchTerm]);

  // Fetch districts when division changes
  useEffect(() => {
    if (selectedDivision) {
      fetchDistricts(selectedDivision);
      setSelectedDistrict('');
      setSelectedUpazila('');
      setUpazilas([]);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
      setSelectedUpazila('');
      setUpazilas([]);
    }
  }, [selectedDivision]);

  // Fetch upazilas when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchUpazilas(selectedDistrict);
      setSelectedUpazila('');
    } else {
      setUpazilas([]);
      setSelectedUpazila('');
    }
  }, [selectedDistrict]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Shops Near You</h1>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {/* Search and Filter Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search shops by name, address, or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="absolute right-0 top-0 h-full px-6 bg-green-600 text-white rounded-r-md flex items-center">
                    {loading && searchTerm ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Division Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Divisions</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedDivision || loadingDistricts}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">All Districts</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {loadingDistricts && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Upazila Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upazila</label>
                  <select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    disabled={!selectedDistrict || loadingUpazilas}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">All Upazilas</option>
                    {upazilas.map((upazila) => (
                      <option key={upazila.id} value={upazila.id}>
                        {upazila.name}
                      </option>
                    ))}
                  </select>
                  {loadingUpazilas && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedDivision || selectedDistrict || selectedUpazila) && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found {shops.length} shop{shops.length !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            {/* Shops Grid */}
            {shops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {shops.map((shop) => (
                  <div key={shop.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square">
                      <img 
                        src={shop.shop_image || '/api/placeholder/300/300'} 
                        alt={shop.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/300';
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {shop.name}
                      </h3>
                      
                      {/* Owner Info */}
                      {shop.owner_name && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm">{shop.owner_name}</span>
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-start text-gray-600 mb-3">
                        <svg className="w-4 h-4 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-sm">
                          <div>{shop.address}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {[shop.upazila_name, shop.district_name, shop.division_name].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      {shop.owner_phone && (
                        <div className="flex items-center text-gray-600 mb-4">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm">{shop.owner_phone}</span>
                        </div>
                      )}

                      <Link
                        to={`/shops/${shop.id}`}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors inline-block text-center"
                      >
                        Visit Shop
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or browse all shops.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

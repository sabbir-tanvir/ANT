import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function ProductDetails() {
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('Big size');
    const [selectedVolume, setSelectedVolume] = useState('800ml');
    const [quantity, setQuantity] = useState(1);
    const params = useParams();

    // Mock product images for image navigation
    const productImages = [
        'https://placehold.co/151x348',
        'https://placehold.co/32x74',
        'https://placehold.co/32x74',
        'https://placehold.co/32x74',
        'https://placehold.co/32x74'
    ];

    const sizeOptions = [
        { name: 'Big size', price: 150 },
        { name: 'Medium size', price: 200 },
        { name: 'Small size', price: 250 }
    ];

    const volumeOptions = ['1000ml', '800ml', '500ml', '250ml'];

    useEffect(() => {
        const idFromRoute = Number.parseInt(params.id, 10);
        const targetId = Number.isFinite(idFromRoute) ? idFromRoute : 1;
        axios.get('/data.json').then((res) => {
            const list = res.data?.products || [];
            const foundProduct = list.find((p) => p.id === targetId) || null;
            setProduct(foundProduct);
            if (foundProduct?.image) {
                productImages[0] = foundProduct.image;
            }
        });
    }, [params.id]);

    if (!product) {
        return (
            <section className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-500 text-sm">Loading product…</div>
            </section>
        );
    }

    return (
        <section className="py-8 px-4 md:px-6 bg-gray-50">
            <div className="max-w-[1360px] mx-auto space-y-8">
                {/* Top section */}
                <div className="w-[1360px] h-[779px] relative bg-white rounded-[10px] shadow-[0px_4px_8px_5px_rgba(217,217,217,0.25)] overflow-hidden">
                    <div className="w-[524px] h-[670px] left-[30px] top-[30px] absolute overflow-hidden">
                        <div className="w-[524.16px] h-[550px] left-0 top-0 absolute outline outline-1 outline-offset-[-1px] outline-black overflow-hidden">
                            <img className="w-36 h-80 left-[187px] top-[92px] absolute" src="https://placehold.co/151x348" />
                        </div>
                        <div className="left-0 top-[569px] absolute inline-flex justify-start items-center gap-3.5 overflow-hidden">
                            <div className="w-24 h-24 relative outline outline-1 outline-offset-[-1px] outline-black overflow-hidden">
                                <img className="w-8 h-20 left-[28px] top-[7px] absolute" src="https://placehold.co/32x74" />
                            </div>
                            <div className="w-24 h-24 relative overflow-hidden">
                                <img className="w-8 h-20 left-[28.20px] top-[7px] absolute" src="https://placehold.co/32x74" />
                            </div>
                            <div className="w-24 h-24 relative overflow-hidden">
                                <img className="w-8 h-20 left-[28.41px] top-[7px] absolute" src="https://placehold.co/32x74" />
                            </div>
                            <div className="w-24 h-24 relative overflow-hidden">
                                <img className="w-8 h-20 left-[28.41px] top-[7px] absolute" src="https://placehold.co/32x74" />
                            </div>
                        </div>
                        <div className="w-10 h-6 left-[70px] top-[29px] absolute bg-neutral-800 rounded-[5px]">
                            <div className="w-6 h-3.5 left-[8px] top-[3.50px] absolute justify-center text-white text-[10px] font-normal font-['Inter'] uppercase leading-none">new</div>
                        </div>
                    </div>
                    <div className="w-24 h-4 left-[599.16px] top-[243.55px] absolute justify-center text-green-600 text-xs font-normal font-['Inter'] uppercase leading-none">free shipping</div>
                    <div className="w-28 h-7 left-[584.16px] top-[239.05px] absolute opacity-5 bg-green-600 rounded-md" />
                    <div className="w-24 h-4 left-[726.59px] top-[243.55px] absolute justify-center text-red-600 text-xs font-normal font-['Inter'] uppercase leading-none">free gift</div>
                    <div className="w-24 h-7 left-[711.59px] top-[239.05px] absolute opacity-5 bg-red-600 rounded-md" />
                    <div className="w-96 h-60 left-[584.16px] top-[287.05px] absolute border-t border-b border-stone-300">
                        <div className="left-[-0.16px] top-[20.95px] absolute justify-center text-black text-sm font-bold font-['Inter'] uppercase leading-normal">Size: </div>
                        <div className="w-24 h-6 left-[41.84px] top-[21px] absolute justify-center text-stone-500 text-sm font-normal font-['Inter'] leading-normal">Big size</div>
                        <div className="w-32 h-16 left-0 top-[54.79px] absolute rounded-[10px] outline outline-1 outline-offset-[-1px] outline-green-600">
                            <div className="w-11 h-11 left-[8.84px] top-[9.16px] absolute">
                                <img className="w-4 h-10 left-[13.84px] top-[2px] absolute" src="https://placehold.co/18x41" />
                            </div>
                            <div className="w-16 h-12 left-[54.03px] top-[8.30px] absolute">
                                <div className="left-0 top-[6.29px] absolute justify-center text-black text-xs font-normal font-['Inter'] leading-none">Big size</div>
                                <div className="w-12 h-3.5 left-0 top-[30.09px] absolute justify-center text-black text-xs font-bold font-['Inter'] leading-none">150TK</div>
                            </div>
                        </div>
                        <div className="w-32 h-16 left-[140.43px] top-[54.79px] absolute rounded-[10px] outline outline-1 outline-offset-[-1px] outline-stone-300">
                            <div className="w-10 h-9 left-[9px] top-[14.29px] absolute">
                                <div className="w-11 h-11 left-0 top-[-5px] absolute">
                                    <img className="w-4 h-10 left-[13.84px] top-[2px] absolute" src="https://placehold.co/18x41" />
                                </div>
                            </div>
                            <div className="w-16 h-12 left-[50.80px] top-[8.29px] absolute">
                                <div className="left-[-4.39px] top-[5.86px] absolute justify-center text-black text-xs font-normal font-['Inter'] leading-none">Medium size</div>
                                <div className="w-12 h-3.5 left-0 top-[30.09px] absolute justify-center text-black text-xs font-bold font-['Inter'] leading-none">200TK</div>
                            </div>
                        </div>
                        <div className="w-32 h-16 left-[280.87px] top-[54.79px] absolute rounded-[10px] outline outline-1 outline-offset-[-1px] outline-stone-300">
                            <div className="w-10 h-9 left-[9px] top-[14.29px] absolute">
                                <div className="w-11 h-11 left-0 top-[-5px] absolute">
                                    <img className="w-4 h-10 left-[13.84px] top-[2px] absolute" src="https://placehold.co/18x41" />
                                </div>
                            </div>
                            <div className="w-16 h-12 left-[50.78px] top-[8.30px] absolute">
                                <div className="left-0 top-[5.86px] absolute justify-center text-black text-xs font-normal font-['Inter'] leading-none">Small size</div>
                                <div className="w-12 h-3.5 left-0 top-[30.09px] absolute justify-center text-black text-xs font-bold font-['Inter'] leading-none">250TK</div>
                            </div>
                        </div>
                        <div className="left-0 top-[136.97px] absolute justify-center text-black text-sm font-bold font-['Inter'] uppercase leading-normal">VOLUME: </div>
                        <div className="w-11 h-6 left-[70.84px] top-[138.37px] absolute justify-center text-stone-500 text-sm font-normal font-['Inter'] leading-normal">800ml</div>
                        <div className="w-16 h-9 left-0 top-[175.17px] absolute opacity-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300">
                            <div className="left-[9.84px] top-[8.50px] absolute justify-center text-neutral-500 text-xs font-bold font-['Inter'] leading-none">1000ml</div>
                        </div>
                        <div className="w-16 h-9 left-[68.65px] top-[175.17px] absolute rounded-lg outline outline-1 outline-offset-[-1px] outline-green-600">
                            <div className="left-[16px] top-[8.50px] absolute justify-center text-black text-xs font-bold font-['Inter'] leading-none">800ml</div>
                        </div>
                        <div className="w-16 h-9 left-[142.53px] top-[175.17px] absolute rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300">
                            <div className="left-[16px] top-[8.50px] absolute justify-center text-stone-300 text-xs font-bold font-['Inter'] leading-none">500ml</div>
                        </div>
                        <div className="w-16 h-9 left-[218.25px] top-[175.17px] absolute rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300">
                            <div className="left-[16px] top-[8.50px] absolute justify-center text-stone-300 text-xs font-bold font-['Inter'] leading-none">250ml</div>
                        </div>
                    </div>
                    <div className="left-[584px] top-[535px] absolute inline-flex justify-start items-center gap-3.5">
                        <div className="w-10 h-10 relative bg-gray-200 rounded-[20px]">
                            <div className="w-3.5 h-3.5 left-[13px] top-[13px] absolute text-center justify-center text-black text-sm font-normal font-['Font_Awesome_5_Brands'] leading-none"></div>
                        </div>
                        <div className="w-10 h-10 relative bg-gray-200 rounded-[20px]">
                            <div className="w-2.5 h-3.5 left-[15.63px] top-[13px] absolute text-center justify-center text-black text-sm font-normal font-['Font_Awesome_5_Brands'] leading-none"></div>
                        </div>
                        <div className="w-10 h-10 relative bg-gray-200 rounded-[20px]">
                            <div className="w-3 h-3.5 left-[13.88px] top-[13px] absolute text-center justify-center text-black text-sm font-normal font-['Font_Awesome_5_Brands'] leading-none"></div>
                        </div>
                        <div className="w-10 h-10 relative bg-gray-200 rounded-[20px]">
                            <div className="w-4 h-3.5 left-[12.12px] top-[13px] absolute text-center justify-center text-black text-sm font-normal font-['Font_Awesome_5_Brands'] leading-none"></div>
                        </div>
                        <div className="w-10 h-10 relative bg-gray-200 rounded-[20px]">
                            <div className="w-3.5 h-3.5 left-[13px] top-[13px] absolute text-center justify-center text-black text-sm font-normal font-['Font_Awesome_5_Brands'] leading-none"></div>
                        </div>
                    </div>
                    <div className="p-6 left-[1021.73px] top-[30px] absolute bg-slate-100 rounded-lg shadow-[0px_0px_12px_2px_rgba(0,0,0,0.04)] inline-flex flex-col justify-start items-start gap-5 overflow-hidden">
                        <div className="self-stretch flex flex-col justify-start items-start gap-5">
                            <div className="w-64 flex flex-col justify-start items-start gap-5">
                                <div className="self-stretch flex flex-col justify-start items-start gap-3">
                                    <div className="self-stretch justify-start text-zinc-800 text-xl font-extrabold font-['Inter'] leading-snug">BDT 150 TK</div>
                                    <div className="w-56 justify-start text-green-700 text-xs font-semibold font-['Inter'] leading-none">Order now and get it around Saturday, August 30</div>
                                </div>
                                <div className="inline-flex justify-start items-center gap-2">
                                    <div className="justify-start text-zinc-800 text-sm font-semibold font-['Inter'] leading-tight">QTY:</div>
                                    <div className="px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-neutral-400 flex justify-center items-center gap-1 overflow-hidden">
                                        <div className="w-6 h-6 relative">
                                            <div className="w-2 h-0 left-[8px] top-[12px] absolute outline outline-2 outline-offset-[-1px] outline-zinc-800" />
                                        </div>
                                        <div className="justify-start text-zinc-800 text-sm font-medium font-['Inter'] leading-tight">1</div>
                                        <div className="w-6 h-6 relative">
                                            <div className="w-0 h-2 left-[12px] top-[8px] absolute outline outline-2 outline-offset-[-1px] outline-zinc-800" />
                                            <div className="w-2 h-0 left-[8px] top-[12px] absolute outline outline-2 outline-offset-[-1px] outline-zinc-800" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start gap-4">
                                <div className="self-stretch px-1.5 py-3 bg-green-600 rounded inline-flex justify-center items-center gap-2.5 overflow-hidden">
                                    <div className="justify-start text-white text-sm font-bold font-['Inter'] leading-tight">BUY NOW</div>
                                </div>
                                <div className="self-stretch px-1.5 py-3 bg-green-600 rounded inline-flex justify-center items-center gap-2.5 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                                        <path d="M12.2305 22C17.7533 22 22.2305 17.5228 22.2305 12C22.2305 6.47715 17.7533 2 12.2305 2C6.70762 2 2.23047 6.47715 2.23047 12C2.23047 13.3789 2.50954 14.6926 3.01429 15.8877C3.29325 16.5481 3.43273 16.8784 3.45 17.128C3.46727 17.3776 3.39381 17.6521 3.24689 18.2012L2.23047 22L6.02924 20.9836C6.57835 20.8367 6.85291 20.7632 7.10249 20.7805C7.35208 20.7977 7.68232 20.9372 8.34282 21.2162C9.53792 21.7209 10.8516 22 12.2305 22Z" stroke="white" stroke-width="1.5" stroke-linejoin="round" />
                                        <path d="M8.81862 12.3773L9.68956 11.2956C10.0566 10.8397 10.5104 10.4153 10.546 9.80826C10.5549 9.65494 10.4471 8.96657 10.2313 7.58986C10.1465 7.04881 9.64133 7 9.20379 7C8.63361 7 8.34852 7 8.06542 7.12931C7.70761 7.29275 7.34026 7.75231 7.25964 8.13733C7.19586 8.44196 7.24326 8.65187 7.33806 9.07169C7.7407 10.8548 8.68528 12.6158 10.1499 14.0805C11.6147 15.5452 13.3757 16.4898 15.1588 16.8924C15.5786 16.9872 15.7885 17.0346 16.0932 16.9708C16.4782 16.8902 16.9377 16.5229 17.1012 16.165C17.2305 15.8819 17.2305 15.5969 17.2305 15.0267C17.2305 14.5891 17.1817 14.084 16.6406 13.9992C15.2639 13.7834 14.5756 13.6756 14.4222 13.6845C13.8152 13.7201 13.3908 14.1738 12.9349 14.5409L11.8532 15.4118" stroke="white" stroke-width="1.5" />
                                    </svg>
                                    <div className="justify-start text-white text-sm font-bold font-['Inter'] leading-tight">WhatsApp</div>
                                </div>
                                <div className="self-stretch justify-start text-black text-sm font-bold font-['Inter'] leading-tight">If you want to know more about the product</div>
                                <div className="w-64 px-1.5 py-3 bg-zinc-800 rounded inline-flex justify-center items-center gap-2.5 overflow-hidden">
                                    <div className="justify-start text-white text-sm font-bold font-['Inter'] leading-tight">CONTACT US</div>
                                </div>
                            </div>
                        </div>
                        <div className="w-52 flex flex-col justify-start items-start gap-4">
                            <div className="w-44 flex flex-col justify-start items-start gap-5">
                                <div className="inline-flex justify-start items-center gap-2">
                                    <div className="justify-start text-stone-500 text-sm font-semibold font-['Inter'] leading-tight">Secured transaction</div>
                                    <div className="w-3.5 h-3.5 relative">
                                        <div className="w-2.5 h-2 left-[2.33px] top-[5.25px] absolute bg-green-700 outline outline-1 outline-offset-[-0.58px] outline-green-700" />
                                        <div className="w-1.5 h-1 left-[4.38px] top-[1.17px] absolute outline outline-1 outline-offset-[-0.58px] outline-green-700" />
                                        <div className="w-0 h-px left-[7px] top-[8.46px] absolute outline outline-1 outline-offset-[-0.58px] outline-white" />
                                    </div>
                                </div>
                                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                                    <div className="self-stretch justify-start text-zinc-800 text-sm font-semibold font-['Inter'] leading-tight">Our Top Logistics Partners</div>
                                    <div className="inline-flex justify-start items-center gap-3">
                                        <div className="w-14 h-8 relative rounded border border-black" />
                                        <div className="w-14 h-8 relative rounded border border-black" />
                                    </div>
                                </div>
                            </div>
                            <div className="self-stretch justify-start text-green-700 text-sm font-semibold font-['Inter'] leading-tight">Fastest cross-border delivery</div>
                        </div>
                    </div>
                    <div className="left-[585px] top-[195px] absolute inline-flex justify-start items-center gap-3">
                        <div className="w-4 h-3.5 justify-center text-black text-sm font-black font-['Font_Awesome_5_Pro'] leading-none"></div>
                        <div className="w-40 h-6 justify-center"><span class="text-stone-500 text-sm font-normal font-['Inter'] leading-normal">Ships from</span><span class="text-black text-sm font-normal font-['Inter'] leading-normal"> </span><span class="text-black text-sm font-bold font-['Inter'] leading-normal">United States</span></div>
                    </div>
                    <div className="w-64 left-[584px] top-[63.90px] absolute inline-flex flex-col justify-start items-start gap-4">
                        <div className="self-stretch flex flex-col justify-start items-start gap-4">
                            <div className="self-stretch flex flex-col justify-center items-start gap-4">
                                <div className="justify-center text-black text-xl font-medium font-['Inter']">Cleanser Liquid Detergent</div>
                            </div>
                            <div className="w-44 flex flex-col justify-center items-start gap-2">
                                <div className="self-stretch justify-center"><span class="text-black text-sm font-medium font-['Inter']">Brand: </span><span class="text-green-600 text-sm font-medium font-['Inter']">Cleanser</span></div>
                                <div className="self-stretch justify-center"><span class="text-black text-sm font-medium font-['Inter']">Category: </span><span class="text-green-600 text-sm font-medium font-['Inter']">Washing Liquid</span></div>
                            </div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M17.3346 9.00008C17.3346 4.39771 13.6036 0.666748 9.0013 0.666748C4.39893 0.666748 0.667969 4.39771 0.667969 9.00008C0.667969 13.6024 4.39893 17.3334 9.0013 17.3334C13.6036 17.3334 17.3346 13.6024 17.3346 9.00008Z" fill="#0EBC3F" />
                            </svg>
                            <div className="justify-center text-black text-xs font-normal font-['Inter']">  In stock</div>
                        </div>
                    </div>
                </div>

                {/* Specification and Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-zinc-800 mb-4">Specification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SpecRow label="Title" value={product.name} />
                        <SpecRow label="Brand" value={product.brand} />
                        <SpecRow label="Country of Origin" value="Bangladesh" />
                        <SpecRow label="Volume" value={product.volume || '—'} />
                        <SpecRow label="Scent" value="—" />
                        <SpecRow label="Product name" value={product.name} />
                        <SpecRow label="Product Code" value="—" />
                        <SpecRow label="How To Use" value="—" />
                        <SpecRow label="Benefits" value="—" />
                        <SpecRow label="Brand Origin" value="Bangladesh" />
                        <SpecRow label="Feature" value="—" />
                    </div>

                    <h2 className="text-xl font-semibold text-zinc-800 mt-8 mb-2">Summary</h2>
                    <p className="text-sm text-gray-700">{product.name} by {product.brand}. Volume: {product.volume || '—'}. Ships from {product.shippedFrom}. Price: {product.price} TK.</p>
                </div>
            </div>
        </section>
    );
}

function SpecRow({ label, value }) {
    return (
        <div className="flex items-center">
            <div className="w-48 text-sm text-gray-600">{label}:</div>
            <div className="flex-1 text-sm text-zinc-800 font-medium">{value}</div>
        </div>
    );
}


<div className="w-[1358px] h-[968px] relative bg-white rounded-[10px] overflow-hidden">
    <div className="w-[1275px] left-[31px] top-[85px] absolute inline-flex flex-col justify-start items-start gap-2">
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Title</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Cleanser Liquid Detergent</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Brand:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Cleanser</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Country of Origin:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Bangladesh</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Volume:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">800 ml</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Scent:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Lemon</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Product name:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Cleanser Liquid Detergent</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Product Code:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">FC800CITRUS</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">How To Use:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Use 1 cap for regular loads, 2 caps for heavy loads.</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Benefits:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Effective stain removal, brightening, and a long-lasting fresh scent.</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Brand Origin:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Bangladesh</div>
        </div>
        <div className="w-[1275px] h-7 relative bg-neutral-100 overflow-hidden">
            <div className="left-[15px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Feature:</div>
        </div>
        <div className="w-[1114px] h-7 relative bg-zinc-100 overflow-hidden">
            <div className="left-[18px] top-[4px] absolute justify-start text-zinc-800 text-sm font-normal font-['Inter'] leading-tight">Eco-friendly formula, safe for all fabrics.</div>
        </div>
    </div>
    <div className="left-[31px] top-[32px] absolute justify-start text-black text-xl font-semibold font-['Inter'] leading-loose">Specification</div>
    <div className="left-[31px] top-[556px] absolute justify-start text-black text-xl font-semibold font-['Inter'] leading-loose">Summary</div>
</div>
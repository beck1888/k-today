import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false,  // Remove the ISR status from the bottom of the page
    buildActivity: false, // Remove the build activity indicator from the bottom of the page
  },
};

export default nextConfig;

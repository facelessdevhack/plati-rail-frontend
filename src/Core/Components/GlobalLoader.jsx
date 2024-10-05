import React from "react";
import { Oval } from "react-loader-spinner";

const GlobalLoader = ({ visible }) => {
  if (visible)
    return (
      <div className="fixed top-0 bottom-0 left-0 right-0 z-50 w-screen h-screen backdrop-blur-sm">
        <div className="flex items-center justify-center h-full">
          <div className="relative flex items-center justify-center aspect-square">
            <div className="absolute z-0 bg-black border border-gray-200 rounded-md w-60 h-60 aspect-square backdrop-blur-sm opacity-80" />
            <div className="z-10 ">
              <Oval
                visible={true}
                height="80"
                width="80"
                color="#4fa94d"
                ariaLabel="oval-loading"
                wrapperStyle={{}}
                wrapperClass=""
              />
            </div>
          </div>
        </div>
      </div>
    );
};

export default GlobalLoader;
